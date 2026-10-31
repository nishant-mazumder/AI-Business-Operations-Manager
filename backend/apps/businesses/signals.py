from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Business, BusinessMembership, Store

User = get_user_model()


@receiver(post_save, sender=User)
def create_default_business_for_user(sender, instance, created, **kwargs):
    """
    Automatically provision a primary business profile and standard Pan-India stores
    for every newly registered user.
    """
    if created:
        business_name = f"{instance.full_name or instance.username}'s Operations"
        business = Business.objects.create(
            name=business_name,
            business_type='Retail & Consumer Electronics',
            currency='INR',
            currency_symbol='₹',
            timezone='Asia/Kolkata',
            owner=instance,
        )

        BusinessMembership.objects.create(
            user=instance,
            business=business,
            role='OWNER',
            is_primary=True,
        )

        # Provision clean primary store location without arbitrary geographic assumptions
        Store.objects.create(
            business=business,
            name='Main Location',
            code='MAIN-01',
            city='Primary Hub',
            state='',
            ml_store_id=1,
            is_active=True,
        )
