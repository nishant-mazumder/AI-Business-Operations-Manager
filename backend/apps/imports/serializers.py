from rest_framework import serializers
from .models import ImportBatch


class ImportBatchSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.CharField(source='uploaded_by.email', read_only=True)

    class Meta:
        model = ImportBatch
        fields = [
            'id',
            'file_name',
            'dataset_type',
            'file_size_bytes',
            'status',
            'total_rows',
            'imported_rows',
            'skipped_rows',
            'failed_rows',
            'error_summary',
            'uploaded_by_email',
            'created_at',
            'completed_at',
        ]
        read_only_fields = fields
