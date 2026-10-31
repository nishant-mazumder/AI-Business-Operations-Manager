from rest_framework import serializers
from .models import Product
from purchases.serializers import SupplierSerializer
from businesses.serializers import StoreSerializer


class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    inventory_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    gross_margin_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'sku',
            'name',
            'category',
            'current_stock',
            'reorder_level',
            'unit_cost',
            'selling_price',
            'supplier',
            'supplier_name',
            'store',
            'store_name',
            'stock_status',
            'inventory_value',
            'gross_margin_percentage',
            'ml_item_id',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'stock_status', 'inventory_value', 'gross_margin_percentage', 'created_at', 'updated_at']


class StockAdjustmentSerializer(serializers.Serializer):
    quantity_change = serializers.IntegerField(required=True, help_text="Positive to add, negative to deduct")
    reason = serializers.CharField(required=False, allow_blank=True, default="Manual adjustment")
