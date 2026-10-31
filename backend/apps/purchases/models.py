from decimal import Decimal
from django.db import models
from businesses.models import Business


class Supplier(models.Model):
    """
    Vendor supplying inventory items to the business.
    """
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='suppliers'
    )
    supplier_code = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    payment_terms = models.CharField(max_length=100, default='Net 30')
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=Decimal('4.8'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'purchases'
        unique_together = ('business', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.city or 'India'})"


class PurchaseOrder(models.Model):
    """
    Purchase order sent to suppliers.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('IN_TRANSIT', 'In Transit / Shipped'),
        ('RECEIVED', 'Received & Stocked'),
        ('CANCELLED', 'Cancelled'),
    )

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='purchase_orders'
    )
    order_number = models.CharField(max_length=100, db_index=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='orders'
    )
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_cost = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    expected_delivery = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'purchases'
        unique_together = ('business', 'order_number')
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.order_number} - {self.supplier.name} ({self.status})"


class PurchaseItem(models.Model):
    """
    Line item inside a purchase order.
    """
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.CASCADE,
        related_name='purchase_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        app_label = 'purchases'

    def save(self, *args, **kwargs):
        self.total_cost = Decimal(self.quantity) * self.unit_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} @ {self.unit_cost}"
