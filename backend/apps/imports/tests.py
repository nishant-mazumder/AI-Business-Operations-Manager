import io
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from inventory.models import Product
from purchases.models import Supplier, PurchaseOrder
from sales.models import Sale
from expenses.models import Expense
from .models import ImportBatch

User = get_user_model()


class MultiFileImportTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='aarav.sharma@nexusops.in',
            username='aarav',
            password='Password123@Aarav',
            full_name='Aarav Sharma',
        )
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.preview_url = reverse('import_preview')
        self.commit_url = reverse('import_commit')
        self.history_url = reverse('import_history')
        self.template_url = reverse('import_template', kwargs={'dataset_type': 'inventory'})

        # Sample CSV files
        self.suppliers_csv = SimpleUploadedFile(
            'suppliers.csv',
            (
                b"supplier_id,supplier_name,contact_name,email,phone,city,payment_terms\n"
                b"SUP-001,Synapse Tech India,Rajesh Nair,proc@synapse.in,+91 98200 11111,Bengaluru,Net 30\n"
            ),
            content_type='text/csv'
        )

        self.inventory_csv = SimpleUploadedFile(
            'inventory.csv',
            (
                b"product_id,product_name,current_stock,reorder_level,unit_cost,selling_price,category,supplier_id,store_id,ml_item_id\n"
                b"SKU-AUDIO-001,Titan Pro Wireless ANC,20,10,8000.00,14000.00,Audio,SUP-001,MUM-BKC,1\n"
            ),
            content_type='text/csv'
        )

        self.purchases_csv = SimpleUploadedFile(
            'purchases.csv',
            (
                b"order_number,date,product_id,quantity_purchased,unit_cost,supplier_id,status,expected_delivery\n"
                b"PO-1001,2026-10-01,SKU-AUDIO-001,10,8000.00,SUP-001,RECEIVED,2026-10-05\n"
            ),
            content_type='text/csv'
        )

        self.sales_csv = SimpleUploadedFile(
            'sales.csv',
            (
                b"date,product_id,quantity_sold,unit_price,store_id,transaction_id,discount,payment_method\n"
                b"2026-10-20,SKU-AUDIO-001,3,14000.00,MUM-BKC,TXN-5555,0.00,UPI\n"
            ),
            content_type='text/csv'
        )

        self.expenses_csv = SimpleUploadedFile(
            'expenses.csv',
            (
                b"date,category,amount,description,store_id,vendor,receipt_reference\n"
                b"2026-10-05,Logistics & Shipping,5000.00,Courier,MUM-BKC,BlueDart,REC-01\n"
            ),
            content_type='text/csv'
        )

    def test_download_template(self):
        """Test downloading a compliant CSV template."""
        response = self.client.get(self.template_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('product_id', response.content.decode('utf-8'))

    def test_multi_file_preview(self):
        """Test uploading multiple files to get validation and preview summaries."""
        response = self.client.post(
            self.preview_url,
            {'files': [self.suppliers_csv, self.inventory_csv]},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_files'], 2)
        self.assertTrue(response.data['all_valid'])
        detected = [f['detected_type'] for f in response.data['files']]
        self.assertIn('suppliers', detected)
        self.assertIn('inventory', detected)

    def test_multi_file_commit_with_dependency_order(self):
        """
        Test committing all 5 files in arbitrary order.
        Backend must process suppliers -> inventory -> purchases -> sales -> expenses.
        """
        # Uploading in reverse order to verify dependency resolution
        files = [
            self.sales_csv,
            self.expenses_csv,
            self.purchases_csv,
            self.inventory_csv,
            self.suppliers_csv,
        ]

        response = self.client.post(
            self.commit_url,
            {'files': files},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        batch_results = response.data['batch_results']

        self.assertEqual(batch_results['suppliers']['imported_rows'], 1)
        self.assertEqual(batch_results['inventory']['imported_rows'], 1)
        self.assertEqual(batch_results['purchases']['imported_rows'], 1)
        self.assertEqual(batch_results['sales']['imported_rows'], 1)
        self.assertEqual(batch_results['expenses']['imported_rows'], 1)

        # Verify stock calculation:
        # Initial: 20, Received Purchase: +10, Sale: -3 => Final Stock = 27
        product = Product.objects.get(sku='SKU-AUDIO-001')
        self.assertEqual(product.current_stock, 27)

        # Verify database records
        self.assertTrue(Supplier.objects.filter(name='Synapse Tech India').exists())
        self.assertTrue(PurchaseOrder.objects.filter(order_number='PO-1001').exists())
        self.assertTrue(Sale.objects.filter(transaction_id='TXN-5555').exists())
        self.assertTrue(Expense.objects.filter(category='Logistics & Shipping').exists())
        self.assertEqual(ImportBatch.objects.count(), 5)

    def test_import_history_endpoint(self):
        """Test retrieving past import audit records."""
        self.test_multi_file_commit_with_dependency_order()
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
