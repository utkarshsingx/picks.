from django.conf import settings
from django.db import models


def kyc_document_upload_to(instance, filename):
    return f"kyc/{instance.user_id}/{instance.document_type}_{filename}"


class KycDocument(models.Model):
    """KYC document uploaded by user for verification."""

    class DocumentType(models.TextChoices):
        ID_FRONT = 'ID_FRONT', 'ID Front'
        ID_BACK = 'ID_BACK', 'ID Back'
        PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS', 'Proof of Address'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='kyc_documents',
    )
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    file = models.FileField(upload_to=kyc_document_upload_to)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    rejection_reason = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['user', 'document_type']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_document_type_display()} ({self.status})"
