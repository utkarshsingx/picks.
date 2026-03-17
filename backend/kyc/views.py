from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import KycDocument
from .serializers import KycDocumentSerializer, KycDocumentUploadSerializer


@extend_schema(
    tags=['kyc'],
    responses={200: KycDocumentSerializer(many=True)},
    request=KycDocumentUploadSerializer,
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def document_list(request):
    """List or upload KYC documents."""
    if request.method == 'GET':
        docs = KycDocument.objects.filter(user=request.user)
        serializer = KycDocumentSerializer(docs, many=True)
        return Response(serializer.data)
    # POST
    serializer = KycDocumentUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    doc = KycDocument.objects.create(
        user=request.user,
        document_type=serializer.validated_data['document_type'],
        file=serializer.validated_data['file'],
    )
    return Response(
        KycDocumentSerializer(doc).data,
        status=status.HTTP_201_CREATED,
    )


@extend_schema(
    tags=['kyc'],
    responses={200: {'type': 'object', 'properties': {'kyc_status': {'type': 'string'}}}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kyc_status(request):
    """Return current user's KYC status."""
    return Response({'kyc_status': request.user.kyc_status})
