"""
Stripe client for fiat (USD) deposits.
"""

import os

from django.conf import settings


def create_stripe_payment_intent(user_id: int, amount_cents: int) -> dict | None:
    """Create Stripe PaymentIntent. Returns {client_secret, payment_intent_id} or None if not configured."""
    secret_key = os.environ.get('STRIPE_SECRET_KEY') or getattr(settings, 'STRIPE_SECRET_KEY', None)
    if not secret_key:
        return None

    import stripe
    stripe.api_key = secret_key

    backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8000')
    metadata = {'user_id': str(user_id)}

    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency='usd',
        automatic_payment_methods={'enabled': True},
        metadata=metadata,
    )

    # Store pending deposit for webhook
    from wallets.models import PendingDeposit
    PendingDeposit.objects.get_or_create(
        reference_id=intent.id,
        defaults={
            'user_id': user_id,
            'currency_code': 'USD',
            'amount_usd': amount_cents / 100,
            'gateway': 'stripe',
            'status': 'PENDING',
        },
    )

    return {
        'client_secret': intent.client_secret,
        'payment_intent_id': intent.id,
    }
