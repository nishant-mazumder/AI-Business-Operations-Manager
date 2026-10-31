from django.conf import settings
from django.db import models


class Business(models.Model):
    """
    Core business entity supporting multi-tenancy and data isolation.
    """
    name = models.CharField(max_length=255, default='Nexus Operations India')
    business_type = models.CharField(max_length=100, default='Retail & Consumer Electronics')
    currency = models.CharField(max_length=10, default='INR')
    currency_symbol = models.CharField(max_length=5, default='₹')
    timezone = models.CharField(max_length=50, default='Asia/Kolkata')
    fiscal_year_start = models.CharField(max_length=20, default='April')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_businesses'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'businesses'
        verbose_name_plural = 'Businesses'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.currency})"


class BusinessMembership(models.Model):
    """
    Membership association linking users to businesses with role-based access.
    """
    ROLE_CHOICES = (
        ('OWNER', 'Owner / Executive'),
        ('MANAGER', 'Operations Manager'),
        ('ANALYST', 'Inventory & Business Analyst'),
        ('STAFF', 'Store Staff'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='business_memberships'
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='OWNER')
    is_primary = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'businesses'
        unique_together = ('user', 'business')
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.email} - {self.business.name} ({self.role})"


class Store(models.Model):
    """
    Physical store or fulfillment center belonging to a business.
    """
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='stores'
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=100, default='Mumbai')
    state = models.CharField(max_length=100, blank=True, default='Maharashtra')
    address = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    ml_store_id = models.IntegerField(null=True, blank=True, help_text='Mapped integer ID for ML model')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'businesses'
        unique_together = ('business', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.city})"
