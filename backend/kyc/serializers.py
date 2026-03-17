from django.conf import settings
from rest_framework import serializers

from .models import KycDocument

ALLOWED_CONTENT_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
}
MAX_SIZE_BYTES = int(settings.KYC_MAX_FILE_SIZE_MB * 1024 * 1024)


class KycDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KycDocument
        fields = ('id', 'document_type', 'file', 'status', 'rejection_reason', 'uploaded_at', 'reviewed_at')
        read_only_fields = fields


class KycDocumentUploadSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=KycDocument.DocumentType.choices)
    file = serializers.FileField()

    def validate_file(self, value):
        if value.size > MAX_SIZE_BYTES:
            raise serializers.ValidationError(
                f'File size must not exceed {settings.KYC_MAX_FILE_SIZE_MB}MB.'
            )
        content_type = getattr(value, 'content_type', '') or ''
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError(
                'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF.'
            )
        return value
