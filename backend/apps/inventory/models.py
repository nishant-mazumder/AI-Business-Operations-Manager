from decimal import Decimal
from django.db import models
from businesses.models import Business, Store
from purchases.models import Supplier


class Product(models.Model):
    """
    Product SKU managed in inventory.
    """
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='products'
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    sku = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, db_index=True)
    current_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    ml_item_id = models.IntegerField(null=True, blank=True, help_text='Mapped integer item ID for XGBoost forecasting')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'inventory'
        unique_together = ('business', 'sku')
        ordering = ['name']
        indexes = [
            models.Index(fields=['business', 'category']),
            models.Index(fields=['business', 'sku']),
        ]

    @property
    def stock_status(self):
        if self.current_stock <= 0:
            return 'out_of_stock'
        elif self.current_stock <= self.reorder_level:
            return 'low_stock'
        return 'in_stock'

    @property
    def inventory_value(self):
        return Decimal(self.current_stock) * self.unit_cost

    @property
    def gross_margin_percentage(self):
        if self.selling_price and self.selling_price > 0:
            margin = ((self.selling_price - self.unit_cost) / self.selling_price) * 100
            return round(margin, 2)
        return Decimal('0.00')

    def __str__(self):
        return f"{self.name} ({self.sku}) - Stock: {self.current_stock}"
