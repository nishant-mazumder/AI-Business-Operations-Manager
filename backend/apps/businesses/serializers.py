from rest_framework import serializers
from .models import Business, BusinessMembership, Store


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = [
            'id',
            'name',
            'code',
            'city',
            'state',
            'address',
            'is_active',
            'ml_store_id',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class BusinessSerializer(serializers.ModelSerializer):
    stores = StoreSerializer(many=True, read_only=True)
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'id',
            'name',
            'business_type',
            'currency',
            'currency_symbol',
            'timezone',
            'fiscal_year_start',
            'user_role',
            'stores',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = BusinessMembership.objects.filter(business=obj, user=request.user).first()
            if membership:
                return membership.role
        return 'OWNER'
