from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with KYC, VIP, and 2FA support."""

    class KycStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    username = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    kyc_status = models.CharField(
        max_length=20,
        choices=KycStatus.choices,
        default=KycStatus.PENDING,
    )
    vip_level = models.PositiveIntegerField(default=0)
    two_factor_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
