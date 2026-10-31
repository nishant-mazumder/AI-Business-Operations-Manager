from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id',
            'category',
            'amount',
            'date',
            'description',
            'vendor',
            'store',
            'store_name',
            'payment_method',
            'receipt_reference',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
