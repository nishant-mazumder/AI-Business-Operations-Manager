import uuid
from django.conf import settings
from django.db import models
from businesses.models import Business


class ImportBatch(models.Model):
    """
    Tracks CSV/Excel file import history, validation summaries, and row-level audits.
    """
    DATASET_TYPES = (
        ('suppliers', 'Suppliers Directory'),
        ('inventory', 'Inventory & Products'),
        ('purchases', 'Purchases & Orders'),
        ('sales', 'Sales & Transactions'),
        ('expenses', 'Operating Expenses'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending Validation'),
        ('VALIDATED', 'Validated & Ready'),
        ('PROCESSING', 'Importing Records'),
        ('COMPLETED', 'Completed Successfully'),
        ('PARTIAL', 'Completed with Errors/Skipped Rows'),
        ('FAILED', 'Validation or Import Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='import_batches'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_imports'
    )
    file_name = models.CharField(max_length=255)
    dataset_type = models.CharField(max_length=50, choices=DATASET_TYPES)
    file_size_bytes = models.BigIntegerField(default=0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    total_rows = models.PositiveIntegerField(default=0)
    imported_rows = models.PositiveIntegerField(default=0)
    skipped_rows = models.PositiveIntegerField(default=0)
    failed_rows = models.PositiveIntegerField(default=0)
    error_summary = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = 'imports'
        ordering = ['-created_at']
        verbose_name_plural = 'Import Batches'

    def __str__(self):
        return f"{self.file_name} [{self.dataset_type.upper()}] - {self.status} ({self.imported_rows}/{self.total_rows})"
