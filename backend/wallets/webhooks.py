"""
Webhook handlers for NowPayments and Stripe.
CSRF is disabled for these - we verify via signature instead.
"""

import hashlib
import hmac
import json
import os

from django.conf import settings
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import PendingDeposit
from .services import credit_wallet


@csrf_exempt
@require_POST
def nowpayments_webhook(request):
    """Handle NowPayments IPN (Instant Payment Notification)."""
    ipn_secret = os.environ.get('NOWPAYMENTS_IPN_SECRET') or getattr(settings, 'NOWPAYMENTS_IPN_SECRET', None)
    if ipn_secret:
        # Verify signature: x-nowpayments-sig header = hmac-sha512(payload, ipn_secret)
        sig = request.headers.get('x-nowpayments-sig', '')
        payload = request.body
        expected = hmac.new(
            ipn_secret.encode(),
            payload,
            hashlib.sha512,
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return HttpResponse('Invalid signature', status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponse('Invalid JSON', status=400)

    payment_status = data.get('payment_status')
    payment_id = str(data.get('payment_id') or data.get('id', ''))

    if payment_status not in ('finished', 'confirmed', 'sent'):
        return HttpResponse('OK')  # Ignore non-completion statuses

    # Idempotency: check if already processed
    try:
        pending = PendingDeposit.objects.get(reference_id=payment_id)
    except PendingDeposit.DoesNotExist:
        return HttpResponse('OK')  # Unknown payment, ignore

    if pending.status == 'COMPLETED':
        return HttpResponse('OK')  # Already processed

    # Get amount from webhook - use pay_amount and pay_currency
    pay_amount = data.get('pay_amount') or data.get('actually_paid') or float(pending.amount_usd)
    pay_currency = (data.get('pay_currency') or pending.currency_code).upper()

    # Credit wallet
    from decimal import Decimal
    credit_wallet(
        pending.user_id,
        pay_currency,
        Decimal(str(pay_amount)),
        'DEPOSIT',
        reference_id=payment_id,
    )
    pending.status = 'COMPLETED'
    pending.save()

    return HttpResponse('OK')


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET') or getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    payload = request.body
    sig_header = request.headers.get('stripe-signature', '')

    if webhook_secret:
        import stripe
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            return HttpResponse('Invalid payload', status=400)
        except Exception as e:
            return HttpResponse(f'Webhook error: {e}', status=400)
    else:
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            return HttpResponse('Invalid JSON', status=400)

    if event.get('type') == 'payment_intent.succeeded':
        pi = event.get('data', {}).get('object', {})
        payment_id = pi.get('id')
        metadata = pi.get('metadata', {})
        user_id = metadata.get('user_id')
        amount = pi.get('amount', 0)  # cents

        if not user_id or not amount:
            return HttpResponse('OK')

        # Idempotency
        try:
            pending = PendingDeposit.objects.get(reference_id=payment_id)
        except PendingDeposit.DoesNotExist:
            pending = PendingDeposit.objects.create(
                user_id=int(user_id),
                currency_code='USD',
                amount_usd=amount / 100,
                reference_id=payment_id,
                gateway='stripe',
                status='PENDING',
            )

        if pending.status == 'COMPLETED':
            return HttpResponse('OK')

        from decimal import Decimal
        credit_wallet(
            pending.user_id,
            'USD',
            Decimal(str(amount / 100)),
            'DEPOSIT',
            reference_id=payment_id,
        )
        pending.status = 'COMPLETED'
        pending.save()

    return HttpResponse('OK')
