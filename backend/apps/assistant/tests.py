from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from inventory.models import Product
from sales.models import Sale
from expenses.models import Expense

User = get_user_model()


class AssistantTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='aarav.sharma@nexusops.in',
            username='aarav',
            password='Password123@Aarav',
            full_name='Aarav Sharma',
        )
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        business = self.user.owned_businesses.first()

        # Product with low stock
        self.product = Product.objects.create(
            business=business,
            sku='SKU-WEAR-001',
            name='Chronos Apex Smartwatch',
            category='Wearables',
            current_stock=5,
            reorder_level=10,
            unit_cost=10000.00,
            selling_price=18000.00,
        )

        # Sale record
        from django.utils import timezone
        Sale.objects.create(
            business=business,
            product=self.product,
            transaction_id='TXN-TEST-1',
            date=timezone.now().date(),
            quantity_sold=2,
            unit_price=18000.00,
            discount=0.00,
            payment_method='UPI',
        )

        # Expense record
        Expense.objects.create(
            business=business,
            category='Logistics & Shipping',
            amount=Decimal('25000.00'),
            date=timezone.now().date(),
            vendor='BlueDart Express',
        )

        self.query_url = reverse('assistant_query')

    def test_query_revenue_grounded_in_db(self):
        """Test asking about revenue returns calculated PostgreSQL sales figures."""
        response = self.client.post(self.query_url, {'query': 'How much revenue did I generate?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('36,000.00', response.data['text'])
        self.assertIsNotNone(response.data['metric_card'])
        self.assertIn('Total Gross Revenue', response.data['metric_card']['label'])

    def test_query_low_stock_grounded_in_db(self):
        """Test asking about low stock reports Chronos Apex Smartwatch with 5 units left."""
        response = self.client.post(self.query_url, {'query': 'Which products are running low on stock?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Chronos Apex Smartwatch', response.data['text'])
        self.assertIn('5 units left', response.data['text'])

    def test_query_expenses_grounded_in_db(self):
        """Test asking about expenses reports Logistics & Shipping at 25,000.00."""
        response = self.client.post(self.query_url, {'query': 'Which expense category is highest?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Logistics & Shipping', response.data['text'])
        self.assertIn('25,000.00', response.data['text'])
