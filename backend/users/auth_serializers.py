from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that accepts 'email' instead of 'username'."""

    def validate(self, attrs):
        email = attrs.get('email') or attrs.get('username')
        attrs['username'] = email
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        return token
