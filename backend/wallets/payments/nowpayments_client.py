"""
NowPayments API client for crypto deposits.
"""

import os
import requests
from django.conf import settings


def create_nowpayments_payment(
    user_id: int,
    user_email: str,
    currency: str,
    amount_usd: float,
) -> dict | None:
    """Create a NowPayments payment. Returns {payment_url, payment_id} or None if not configured."""
    api_key = os.environ.get('NOWPAYMENTS_API_KEY') or getattr(settings, 'NOWPAYMENTS_API_KEY', None)
    if not api_key:
        return None

    sandbox = os.environ.get('NOWPAYMENTS_SANDBOX', 'true').lower() == 'true'
    base_url = 'https://api-sandbox.nowpayments.io/v1' if sandbox else 'https://api.nowpayments.io/v1'

    # Get price in target currency
    price_resp = requests.get(
        f'{base_url}/estimate?amount={amount_usd}&currency_from=usd&currency_to={currency.lower()}',
        headers={'x-api-key': api_key},
        timeout=10,
    )
    if price_resp.status_code != 200:
        return None

    price_data = price_resp.json()
    pay_amount = price_data.get('pay_amount') or price_data.get('estimated_amount')
    if not pay_amount:
        return None

    # Create payment
    payload = {
        'price_amount': amount_usd,
        'price_currency': 'usd',
        'pay_currency': currency.lower(),
        'pay_amount': float(pay_amount),
        'order_id': f'picks-{user_id}-{os.urandom(4).hex()}',
        'ipn_callback_url': f"{os.environ.get('BACKEND_URL', 'http://localhost:8000')}/api/webhooks/nowpayments/",
        'order_description': f'Deposit for {user_email}',
    }

    resp = requests.post(
        f'{base_url}/payment',
        json=payload,
        headers={'x-api-key': api_key, 'Content-Type': 'application/json'},
        timeout=10,
    )
    if resp.status_code not in (200, 201):
        return None

    data = resp.json()
    payment_id = data.get('payment_id') or data.get('id')
    payment_url = data.get('invoice_url') or data.get('pay_address')

    # Store pending deposit for webhook idempotency
    from wallets.models import PendingDeposit
    PendingDeposit.objects.get_or_create(
        reference_id=str(payment_id),
        defaults={
            'user_id': user_id,
            'currency_code': currency,
            'amount_usd': amount_usd,
            'gateway': 'nowpayments',
            'status': 'PENDING',
        },
    )

    return {
        'payment_url': payment_url or f'https://nowpayments.io/payment/?i={payment_id}',
        'payment_id': str(payment_id),
    }
