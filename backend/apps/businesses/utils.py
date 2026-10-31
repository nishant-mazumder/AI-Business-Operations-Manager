from rest_framework.exceptions import PermissionDenied, NotFound
from .models import Business, BusinessMembership


def get_user_business(user):
    """
    Retrieve the current active or primary business for the authenticated user.
    """
    membership = BusinessMembership.objects.filter(user=user, is_primary=True).first()
    if not membership:
        membership = BusinessMembership.objects.filter(user=user).first()
    if not membership:
        # Fallback to owned business
        business = Business.objects.filter(owner=user).first()
        if business:
            return business
        raise NotFound("No active business profile associated with this account.")
    return membership.business


class BusinessScopedMixin:
    """
    DRF View/ViewSet mixin ensuring that:
    1. Querysets are strictly scoped to the user's authorized business.
    2. Model instances are saved with the user's business on creation.
    3. Cross-business data access attempts are blocked at the server level.
    """
    def get_business(self):
        if not hasattr(self, '_cached_business'):
            self._cached_business = get_user_business(self.request.user)
        return self._cached_business

    def get_queryset(self):
        qs = super().get_queryset()
        business = self.get_business()
        return qs.filter(business=business)

    def perform_create(self, serializer):
        business = self.get_business()
        serializer.save(business=business)
