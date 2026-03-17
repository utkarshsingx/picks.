import pyotp
from django.conf import settings
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .auth_serializers import CustomTokenObtainPairSerializer
from drf_spectacular.utils import extend_schema, OpenApiExample

from .models import User
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    TwoFactorEnableSerializer,
    TwoFactorVerifySerializer,
    TwoFactorDisableSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def create_email_verification_token(user):
    raw = f"{user.pk}:{user.email}"
    return urlsafe_base64_encode(force_bytes(raw))


def verify_email_token(token):
    try:
        decoded = urlsafe_base64_decode(token).decode()
        pk, email = decoded.split(':', 1)
        user = User.objects.get(pk=int(pk), email=email)
        return user
    except (ValueError, User.DoesNotExist):
        return None


@extend_schema(
    tags=['auth'],
    request=RegisterSerializer,
    responses={201: UserSerializer, 400: {'description': 'Validation error'}},
    examples=[
        OpenApiExample('Register', value={'email': 'user@example.com', 'password': 'SecurePass123!', 'password_confirm': 'SecurePass123!'}, request_only=True),
    ],
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token = create_email_verification_token(user)
    frontend_url = getattr(settings, 'FRONTEND_URL', request.build_absolute_uri('/').rstrip('/'))
    verify_url = f"{frontend_url}/verify-email?token={token}"
    send_mail(
        'Verify your Picks account',
        f'Click to verify: {verify_url}',
        settings.DEFAULT_FROM_EMAIL or 'noreply@picks.dev',
        [user.email],
        fail_silently=True,
    )
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['auth'],
    request=None,
    responses={
        200: {'type': 'object', 'properties': {'detail': {'type': 'string'}}, 'description': 'Email verified'},
        400: {'type': 'object', 'properties': {'detail': {'type': 'string'}}, 'description': 'Invalid or expired token'},
    },
)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request, token):
    user = verify_email_token(token)
    if not user:
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
    user.is_verified = True
    user.save()
    return Response({'detail': 'Email verified successfully.'})


@extend_schema(
    tags=['auth'],
    request=TwoFactorEnableSerializer,
    responses={200: {'type': 'object', 'properties': {'secret': {'type': 'string'}, 'provisioning_uri': {'type': 'string'}}}, 400: {'description': 'Invalid password or 2FA already enabled'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def two_factor_enable(request):
    serializer = TwoFactorEnableSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    if not request.user.check_password(serializer.validated_data['password']):
        return Response({'password': ['Invalid password.']}, status=status.HTTP_400_BAD_REQUEST)
    if request.user.two_factor_enabled:
        return Response({'detail': '2FA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=request.user.email, issuer_name='Picks')
    request.user.totp_secret = secret
    request.user.save(update_fields=['totp_secret'])
    return Response({
        'secret': secret,
        'provisioning_uri': provisioning_uri,
    })


@extend_schema(tags=['auth'], request=TwoFactorVerifySerializer, responses={200: {'description': '2FA enabled'}, 400: {'description': 'Invalid code'}})
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def two_factor_verify(request):
    serializer = TwoFactorVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = request.user
    if not user.totp_secret:
        return Response({'detail': '2FA not set up. Call enable first.'}, status=status.HTTP_400_BAD_REQUEST)
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(serializer.validated_data['code'], valid_window=1):
        return Response({'code': ['Invalid code.']}, status=status.HTTP_400_BAD_REQUEST)
    user.two_factor_enabled = True
    user.save(update_fields=['two_factor_enabled'])
    return Response({'detail': '2FA enabled successfully.'})


@extend_schema(tags=['auth'], request=TwoFactorDisableSerializer, responses={200: {'description': '2FA disabled'}, 400: {'description': 'Invalid password or code'}})
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def two_factor_disable(request):
    serializer = TwoFactorDisableSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = request.user
    if not user.two_factor_enabled:
        return Response({'detail': '2FA is not enabled.'}, status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(serializer.validated_data['password']):
        return Response({'password': ['Invalid password.']}, status=status.HTTP_400_BAD_REQUEST)
    totp = pyotp.TOTP(user.totp_secret or '')
    if not totp.verify(serializer.validated_data['code'], valid_window=1):
        return Response({'code': ['Invalid code.']}, status=status.HTTP_400_BAD_REQUEST)
    user.two_factor_enabled = False
    user.totp_secret = None
    user.save(update_fields=['two_factor_enabled', 'totp_secret'])
    return Response({'detail': '2FA disabled successfully.'})


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login - returns access and refresh tokens. Accepts email + password."""

    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        tags=['auth'],
        request={'type': 'object', 'properties': {'email': {'type': 'string'}, 'password': {'type': 'string'}}, 'required': ['email', 'password']},
        responses={200: {'type': 'object', 'properties': {'access': {'type': 'string'}, 'refresh': {'type': 'string'}, 'user': {'type': 'object'}}}, 401: {'description': 'Invalid credentials'}},
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = request.data
            username = data.get('username') or data.get('email')
            from django.contrib.auth import authenticate
            user = authenticate(
                request,
                username=username,
                password=data.get('password'),
            )
            if user:
                response.data['user'] = UserSerializer(user).data
        return response


@extend_schema(tags=['auth'], responses={200: UserSerializer})
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
