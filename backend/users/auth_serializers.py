from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that accepts 'email' instead of 'username'.
    Enforces 2FA: if user has 2FA enabled, login returns requires_2fa instead of tokens.
    """

    def validate(self, attrs):
        email = attrs.get('email') or attrs.get('username')
        attrs['username'] = email
        user = authenticate(
            self.context['request'],
            username=email,
            password=attrs.get('password'),
        )
        if user is None:
            return super().validate(attrs)  # Let parent raise invalid credentials
        if user.two_factor_enabled:
            raise serializers.ValidationError({
                'requires_2fa': True,
                'email': user.email,
            })
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        return token
