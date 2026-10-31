import time
from decimal import Decimal
from rest_framework import serializers
from .models import Sale
from inventory.models import Product
from businesses.models import Store


class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    category = serializers.CharField(source='product.category', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    gross_profit = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id',
            'transaction_id',
            'product',
            'product_name',
            'product_sku',
            'category',
            'store',
            'store_name',
            'date',
            'quantity_sold',
            'unit_price',
            'discount',
            'total_amount',
            'payment_method',
            'customer_name',
            'customer_phone',
            'gross_profit',
            'created_at',
        ]
        read_only_fields = ['id', 'gross_profit', 'created_at']


class RecordSaleSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity_sold = serializers.IntegerField(min_value=1, default=1)
    store = serializers.PrimaryKeyRelatedField(queryset=Store.objects.all(), required=False, allow_null=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    payment_method = serializers.ChoiceField(choices=Sale.PAYMENT_METHODS, default='UPI')
    customer_name = serializers.CharField(required=False, allow_blank=True, default='')
    customer_phone = serializers.CharField(required=False, allow_blank=True, default='')
    date = serializers.DateField(required=False)

    def create(self, validated_data):
        product = validated_data['product']
        business = self.context['business']

        if product.business != business:
            raise serializers.ValidationError({"product": "Product does not belong to your business."})

        qty = validated_data['quantity_sold']
        unit_price = validated_data.get('unit_price') or product.selling_price
        discount = validated_data.get('discount', Decimal('0.00'))
        date_val = validated_data.get('date')

        txn_id = f"TXN-{int(time.time() * 1000)}"[-10:]

        from django.utils import timezone
        if not date_val:
            date_val = timezone.now().date()

        sale = Sale.objects.create(
            business=business,
            store=validated_data.get('store') or product.store,
            product=product,
            transaction_id=txn_id,
            date=date_val,
            quantity_sold=qty,
            unit_price=unit_price,
            discount=discount,
            payment_method=validated_data.get('payment_method', 'UPI'),
            customer_name=validated_data.get('customer_name', ''),
            customer_phone=validated_data.get('customer_phone', ''),
        )

        # Update stock
        product.current_stock = max(0, product.current_stock - qty)
        product.save(update_fields=['current_stock'])

        return sale
