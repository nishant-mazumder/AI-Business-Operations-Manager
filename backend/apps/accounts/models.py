from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of usernames.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('An email address is required.')
        email = self.normalize_email(email)
        # Ensure a username is assigned if not provided
        if 'username' not in extra_fields or not extra_fields['username']:
            extra_fields['username'] = email.split('@')[0]
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model for NexusOps AI.
    Uses email as the unique login credential.
    """
    email = models.EmailField(unique=True, db_index=True, verbose_name='Email Address')
    full_name = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=100, default='Director of Operations')
    avatar_initials = models.CharField(max_length=5, blank=True, default='AS')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def save(self, *args, **kwargs):
        # Automatically generate avatar initials from full_name if available
        if self.full_name and not self.avatar_initials:
            parts = self.full_name.strip().split()
            if len(parts) >= 2:
                self.avatar_initials = f"{parts[0][0]}{parts[-1][0]}".upper()
            elif len(parts) == 1:
                self.avatar_initials = parts[0][:2].upper()
        elif not self.avatar_initials:
            self.avatar_initials = self.email[:2].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.full_name or self.username})"
