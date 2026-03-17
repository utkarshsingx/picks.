from django.core.management.base import BaseCommand

from wallets.models import Currency


CURRENCIES = [
    {'code': 'BTC', 'name': 'Bitcoin', 'is_crypto': True, 'decimals': 8},
    {'code': 'ETH', 'name': 'Ethereum', 'is_crypto': True, 'decimals': 8},
    {'code': 'USDT', 'name': 'Tether', 'is_crypto': True, 'decimals': 2},
    {'code': 'USD', 'name': 'US Dollar', 'is_crypto': False, 'decimals': 2},
]


class Command(BaseCommand):
    help = 'Seed supported currencies (BTC, ETH, USDT, USD)'

    def handle(self, *args, **options):
        for c in CURRENCIES:
            obj, created = Currency.objects.get_or_create(code=c['code'], defaults=c)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created currency {obj.code}'))
            else:
                self.stdout.write(f'Currency {obj.code} already exists')
