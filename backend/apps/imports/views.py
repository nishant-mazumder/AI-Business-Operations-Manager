import io
from decimal import Decimal
from django.db.models import Sum
from django.http import HttpResponse
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import get_user_business, BusinessScopedMixin
from sales.models import Sale
from expenses.models import Expense
from inventory.models import Product
from purchases.models import Supplier, PurchaseOrder, PurchaseItem
from .models import ImportBatch
from .serializers import ImportBatchSerializer
from .services import MultiFileValidator, BatchImporter, detect_dataset_type, sync_local_datasets

TEMPLATE_ROWS = {
    'suppliers': (
        "supplier_id,supplier_name,contact_name,email,phone,city,payment_terms\n"
        "SUP-001,Synapse Tech India,Rajesh Nair,procurement@synapsetech.in,+91 98201 11223,Bengaluru,Net 30\n"
        "SUP-002,Silicon Matrix India,Vikram Malhotra,orders@siliconmatrix.in,+91 98112 33445,Mumbai,Net 45\n"
    ),
    'inventory': (
        "product_id,product_name,current_stock,reorder_level,unit_cost,selling_price,category,supplier_id,store_id,ml_item_id\n"
        "SKU-AUDIO-001,Titan Pro Wireless ANC Headphones,45,15,8500.00,14999.00,Audio,SUP-001,MUM-BKC,1\n"
        "SKU-WEAR-003,Chronos Apex Smartwatch (AMOLED),28,10,11000.00,18999.00,Wearables,SUP-002,BLR-IND,3\n"
    ),
    'purchases': (
        "order_number,date,product_id,quantity_purchased,unit_cost,supplier_id,status,expected_delivery\n"
        "PO-2026-001,2026-10-01,SKU-AUDIO-001,50,8500.00,SUP-001,RECEIVED,2026-10-05\n"
        "PO-2026-002,2026-10-03,SKU-WEAR-003,30,11000.00,SUP-002,RECEIVED,2026-10-08\n"
    ),
    'sales': (
        "date,product_id,quantity_sold,unit_price,store_id,transaction_id,discount,payment_method\n"
        "2026-10-20,SKU-AUDIO-001,2,14999.00,MUM-BKC,TXN-90210,500.00,UPI\n"
        "2026-10-20,SKU-WEAR-003,1,18999.00,BLR-IND,TXN-90211,0.00,RAZORPAY\n"
    ),
    'expenses': (
        "date,category,amount,description,store_id,vendor,receipt_reference\n"
        "2026-10-01,Rent & Facilities,125000.00,Monthly commercial showroom lease,MUM-BKC,BKC Real Estate,REC-2026-081\n"
        "2026-10-05,Logistics & Shipping,45000.00,Express freight deliveries,BLR-IND,BlueDart Express,BD-789012\n"
    ),
}


class MultiFilePreviewView(APIView):
    """
    Upload and preview multiple CSV/Excel files before committing them to the database.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        files = request.FILES.getlist('files') or list(request.FILES.values())
        if not files:
            return Response({'error': 'No files uploaded. Provide at least one CSV or Excel file.'}, status=status.HTTP_400_BAD_REQUEST)

        previews = []
        for f in files:
            override = request.POST.get(f"dataset_type_{f.name}")
            preview = MultiFileValidator.validate_file(f, dataset_type_override=override)
            previews.append(preview)

        all_valid = all(p['is_valid'] for p in previews)
        return Response({
            'total_files': len(previews),
            'all_valid': all_valid,
            'files': previews,
        }, status=status.HTTP_200_OK)


class MultiFileCommitView(APIView):
    """
    Commit uploaded CSV/Excel files into PostgreSQL with relational dependency ordering.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        files = request.FILES.getlist('files') or list(request.FILES.values())
        if not files:
            return Response({'error': 'No files provided for import.'}, status=status.HTTP_400_BAD_REQUEST)

        business = get_user_business(request.user)
        file_dict = {}

        for f in files:
            # Check if user specified a dataset type override
            override = request.POST.get(f"dataset_type_{f.name}")
            if not override:
                preview = MultiFileValidator.validate_file(f)
                dtype = preview['detected_type']
            else:
                dtype = override

            if dtype in ('suppliers', 'inventory', 'purchases', 'sales', 'expenses'):
                file_dict[dtype] = f
            f.seek(0)

        if not file_dict:
            return Response({'error': 'None of the provided files matched a known dataset schema.'}, status=status.HTTP_400_BAD_REQUEST)

        importer = BatchImporter(business=business, user=request.user)
        summary = importer.import_batch(file_dict)

        return Response({
            'message': 'Batch import completed successfully.',
            'batch_results': summary,
        }, status=status.HTTP_200_OK)


class ImportHistoryView(BusinessScopedMixin, generics.ListAPIView):
    """
    List previous import batches and audit summaries for the current business.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ImportBatchSerializer
    queryset = ImportBatch.objects.all()


class TemplateDownloadView(APIView):
    """
    Download compliant CSV templates with headers and sample records.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, dataset_type):
        dtype = dataset_type.lower()
        if dtype not in TEMPLATE_ROWS:
            return Response(
                {'error': f"Invalid template type '{dtype}'. Choose from: {', '.join(TEMPLATE_ROWS.keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        content = TEMPLATE_ROWS[dtype]
        response = HttpResponse(content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{dtype}_template.csv"'
        return response


class SyncLocalDatasetsView(APIView):
    """
    Synchronize data directly from the local `datasets/` CSV folder into PostgreSQL for the current business.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        business = get_user_business(request.user)
        force = bool(request.data.get('force', False)) if hasattr(request, 'data') else False
        result = sync_local_datasets(business=business, user=request.user, force=force)
        return Response(result, status=status.HTTP_200_OK)

    def get(self, request):
        business = get_user_business(request.user)
        result = sync_local_datasets(business=business, user=request.user, force=False)
        return Response(result, status=status.HTTP_200_OK)


class DatasetsStatusView(APIView):
    """
    Returns live storage and record statistics for all uploaded datasets of the business.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = get_user_business(request.user)

        # Sales
        sales_qs = Sale.objects.filter(business=business)
        sales_count = sales_qs.count()
        sales_total = sales_qs.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        sales_latest = sales_qs.order_by('-date').values_list('date', flat=True).first()

        # Expenses
        exp_qs = Expense.objects.filter(business=business)
        exp_count = exp_qs.count()
        exp_total = exp_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        exp_latest = exp_qs.order_by('-date').values_list('date', flat=True).first()

        # Inventory
        prod_qs = Product.objects.filter(business=business)
        prod_count = prod_qs.count()
        total_units = prod_qs.aggregate(total=Sum('current_stock'))['total'] or 0
        inventory_value = sum((p.current_stock * p.unit_cost for p in prod_qs), Decimal('0.00'))

        # Purchases
        po_qs = PurchaseOrder.objects.filter(business=business)
        po_count = po_qs.count()
        po_total = po_qs.aggregate(total=Sum('total_cost'))['total'] or Decimal('0.00')

        # Suppliers
        sup_count = Supplier.objects.filter(business=business).count()

        # Batches
        batches = ImportBatch.objects.filter(business=business).order_by('-created_at')[:10]
        batches_data = ImportBatchSerializer(batches, many=True).data

        return Response({
            'datasets': {
                'sales': {
                    'name': 'Sales & Transactions',
                    'file': 'sales.csv',
                    'record_count': sales_count,
                    'total_amount': sales_total,
                    'latest_date': str(sales_latest) if sales_latest else None,
                },
                'expenses': {
                    'name': 'Operating Expenses',
                    'file': 'expenses.csv',
                    'record_count': exp_count,
                    'total_amount': exp_total,
                    'latest_date': str(exp_latest) if exp_latest else None,
                },
                'inventory': {
                    'name': 'Inventory & Products Catalog',
                    'file': 'inventory.csv',
                    'record_count': prod_count,
                    'total_units': total_units,
                    'total_amount': inventory_value,
                    'latest_date': None,
                },
                'purchases': {
                    'name': 'Purchase Orders',
                    'file': 'purchases.csv',
                    'record_count': po_count,
                    'total_amount': po_total,
                    'latest_date': None,
                },
                'suppliers': {
                    'name': 'Suppliers Directory',
                    'file': 'suppliers.csv',
                    'record_count': sup_count,
                    'total_amount': None,
                    'latest_date': None,
                },
            },
            'recent_batches': batches_data,
        }, status=status.HTTP_200_OK)


class PurgeDatasetsView(APIView):
    """
    Purge one or all uploaded datasets and associated records for the current business.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        business = get_user_business(request.user)
        dtype = request.data.get('dataset_type', 'all').lower().strip()

        deleted_counts = {}

        if dtype in ('all', 'sales'):
            sales_del, _ = Sale.objects.filter(business=business).delete()
            ImportBatch.objects.filter(business=business, dataset_type='sales').delete()
            deleted_counts['sales'] = sales_del

        if dtype in ('all', 'expenses'):
            exp_del, _ = Expense.objects.filter(business=business).delete()
            ImportBatch.objects.filter(business=business, dataset_type='expenses').delete()
            deleted_counts['expenses'] = exp_del

        if dtype in ('all', 'purchases'):
            PurchaseItem.objects.filter(purchase_order__business=business).delete()
            po_del, _ = PurchaseOrder.objects.filter(business=business).delete()
            ImportBatch.objects.filter(business=business, dataset_type='purchases').delete()
            deleted_counts['purchase_orders'] = po_del

        if dtype in ('all', 'inventory'):
            if dtype == 'inventory':
                Sale.objects.filter(business=business).delete()
                PurchaseItem.objects.filter(purchase_order__business=business).delete()
            prod_del, _ = Product.objects.filter(business=business).delete()
            ImportBatch.objects.filter(business=business, dataset_type='inventory').delete()
            deleted_counts['products'] = prod_del

        if dtype in ('all', 'suppliers'):
            PurchaseItem.objects.filter(purchase_order__business=business).delete()
            PurchaseOrder.objects.filter(business=business).delete()
            Product.objects.filter(business=business).update(supplier=None)
            sup_del, _ = Supplier.objects.filter(business=business).delete()
            ImportBatch.objects.filter(business=business, dataset_type='suppliers').delete()
            deleted_counts['suppliers'] = sup_del

        if dtype == 'all':
            ImportBatch.objects.filter(business=business).delete()

        return Response({
            'message': f"Successfully purged '{dtype}' dataset records.",
            'deleted': deleted_counts,
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        return self.post(request)
