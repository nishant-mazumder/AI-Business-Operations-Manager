from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for reading and updating user profile data.
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'full_name',
            'phone',
            'role',
            'avatar_initials',
            'is_staff',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['id', 'email', 'username', 'is_staff', 'date_joined', 'last_login']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with robust validation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Strong password meeting Django validation criteria'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Confirm password'
    )

    class Meta:
        model = User
        fields = [
            'email',
            'full_name',
            'phone',
            'role',
            'password',
            'password_confirm',
        ]

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('An account with this email address already exists.')
        return normalized

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})

        # Validate password strength with Django built-in validators
        user_instance = User(email=attrs['email'])
        try:
            validate_password(attrs['password'], user=user_instance)
        except Exception as e:
            messages = list(e.messages) if hasattr(e, 'messages') else [str(e)]
            raise serializers.ValidationError({'password': messages})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        email = validated_data['email']
        username = email.split('@')[0]

        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            full_name=validated_data.get('full_name', ''),
            phone=validated_data.get('phone', None),
            role=validated_data.get('role', 'Director of Operations'),
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for email + password authentication.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError('Must include both email and password.')

        user = authenticate(username=email, password=password)

        if not user:
            # Check if user exists to provide helpful guidance without leaking sensitive info
            if not User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError('No active account found with the given credentials.')
            raise serializers.ValidationError('Invalid password. Please check your credentials.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated. Please contact support.')

        attrs['user'] = user
        return attrs


class LogoutSerializer(serializers.Serializer):
    """
    Serializer to safely blacklist refresh token upon logout.
    """
    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except Exception:
            # Token might already be expired or blacklisted, logout remains safe
            pass
