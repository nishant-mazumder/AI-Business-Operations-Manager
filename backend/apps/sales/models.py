from decimal import Decimal
from django.db import models
from businesses.models import Business, Store
from inventory.models import Product


class Sale(models.Model):
    """
    Sales transaction record.
    """
    PAYMENT_METHODS = (
        ('UPI', 'UPI (GPay / PhonePe / QR)'),
        ('RAZORPAY', 'Razorpay POS Terminal'),
        ('CARD', 'Credit / Debit Card (RuPay/Visa)'),
        ('NETBANKING', 'Net Banking (HDFC/ICICI)'),
        ('CASH', 'Cash on Delivery / Cash'),
    )

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='sales'
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='sales'
    )
    transaction_id = models.CharField(max_length=100, db_index=True)
    date = models.DateField(db_index=True)
    quantity_sold = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS, default='UPI')
    customer_name = models.CharField(max_length=255, blank=True, default='')
    customer_phone = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'sales'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['business', 'date']),
            models.Index(fields=['business', 'product']),
            models.Index(fields=['business', 'transaction_id']),
        ]

    def save(self, *args, **kwargs):
        # Enforce exact total_amount calculation with safe Decimal casting
        unit_price_dec = Decimal(str(self.unit_price)) if self.unit_price is not None else Decimal('0.00')
        discount_dec = Decimal(str(self.discount)) if self.discount is not None else Decimal('0.00')
        calculated = (Decimal(self.quantity_sold) * unit_price_dec) - discount_dec
        self.total_amount = max(Decimal('0.00'), calculated)
        super().save(*args, **kwargs)

    @property
    def cost_of_goods_sold(self):
        return Decimal(self.quantity_sold) * self.product.unit_cost

    @property
    def gross_profit(self):
        return self.total_amount - self.cost_of_goods_sold

    def __str__(self):
        return f"{self.transaction_id} - {self.product.name} ({self.quantity_sold} units @ ₹{self.total_amount})"
