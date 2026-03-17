from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        attrs.pop('password_confirm')
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data.get('username', validated_data['email'].split('@')[0]),
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'is_verified', 'kyc_status', 'vip_level', 'two_factor_enabled', 'created_at')
        read_only_fields = fields


class TwoFactorEnableSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)


class TwoFactorVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)


class TwoFactorDisableSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    code = serializers.CharField(max_length=6, min_length=6)


class TwoFactorVerifyLoginSerializer(serializers.Serializer):
    """Serializer for 2FA verification at login. Accepts email, password, code."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    code = serializers.CharField(max_length=6, min_length=6)
