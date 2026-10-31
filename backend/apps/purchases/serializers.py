from django.db.models import Sum
from rest_framework import serializers
from .models import Supplier, PurchaseOrder, PurchaseItem


class SupplierSerializer(serializers.ModelSerializer):
    total_spend = serializers.SerializerMethodField()
    active_orders = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id',
            'supplier_code',
            'name',
            'contact_name',
            'email',
            'phone',
            'city',
            'payment_terms',
            'rating',
            'total_spend',
            'active_orders',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_spend(self, obj):
        total = obj.orders.aggregate(total=Sum('total_cost'))['total']
        return float(total or 0.0)

    def get_active_orders(self, obj):
        return obj.orders.filter(status__in=['PENDING', 'IN_TRANSIT']).count()


class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = PurchaseItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'quantity',
            'unit_cost',
            'total_cost',
        ]
        read_only_fields = ['id', 'total_cost']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    items = PurchaseItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id',
            'order_number',
            'supplier',
            'supplier_name',
            'date',
            'status',
            'total_cost',
            'expected_delivery',
            'notes',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
