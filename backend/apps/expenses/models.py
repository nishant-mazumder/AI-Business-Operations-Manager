from decimal import Decimal
from django.db import models
from businesses.models import Business, Store


class Expense(models.Model):
    """
    Operating expense (OPEX) record.
    """
    CATEGORY_CHOICES = (
        ('Logistics & Shipping', 'Logistics & Shipping'),
        ('Rent & Facilities', 'Rent & Facilities'),
        ('Salaries & Payroll', 'Salaries & Payroll'),
        ('Utilities & Power', 'Utilities & Power'),
        ('Marketing & Ads', 'Marketing & Ads'),
        ('Software & Cloud Services', 'Software & Cloud Services'),
        ('Packaging & Supplies', 'Packaging & Supplies'),
        ('Maintenance & Repairs', 'Maintenance & Repairs'),
        ('Legal & Professional', 'Legal & Professional'),
        ('Miscellaneous', 'Miscellaneous'),
    )

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses'
    )
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, db_index=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField(db_index=True)
    description = models.TextField(blank=True, default='')
    vendor = models.CharField(max_length=255, blank=True, default='')
    payment_method = models.CharField(max_length=50, default='NEFT/RTGS')
    receipt_reference = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'expenses'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['business', 'date']),
            models.Index(fields=['business', 'category']),
        ]

    def __str__(self):
        return f"{self.category}: ₹{self.amount} ({self.date}) - {self.vendor}"
