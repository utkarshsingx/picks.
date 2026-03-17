"""
Custom admin site for Picks platform with dashboard.
"""

from django.contrib import admin
from django.contrib.admin import AdminSite
from django.urls import reverse


class PicksAdminSite(AdminSite):
    site_header = 'Picks Admin'
    site_title = 'Picks'
    index_title = 'Dashboard'
    index_template = 'admin/picks_index.html'

    def index(self, request, extra_context=None):
        from wallets.models import Transaction

        extra_context = extra_context or {}
        # Pending withdrawals count
        pending_withdrawals = Transaction.objects.filter(
            type=Transaction.Type.WITHDRAWAL,
            status=Transaction.Status.PENDING,
        ).count()
        withdrawals_url = reverse('admin:wallets_pendingwithdrawal_changelist')
        extra_context['pending_withdrawals_count'] = pending_withdrawals
        extra_context['pending_withdrawals_url'] = withdrawals_url

        # Recent registrations (last 5 users)
        from users.models import User
        extra_context['recent_users'] = User.objects.order_by('-created_at')[:5]

        # Quick links
        extra_context['users_url'] = reverse('admin:users_user_changelist')
        extra_context['transactions_url'] = reverse('admin:wallets_transaction_changelist')
        extra_context['bets_url'] = reverse('admin:games_bet_changelist')

        return super().index(request, extra_context)
