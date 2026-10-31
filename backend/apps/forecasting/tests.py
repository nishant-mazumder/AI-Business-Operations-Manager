from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from inventory.models import Product
from .models import ForecastRun

User = get_user_model()


class ForecastingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='aarav.sharma@nexusops.in',
            username='aarav',
            password='Password123@Aarav',
            full_name='Aarav Sharma',
        )
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create a product in user's business
        business = self.user.owned_businesses.first()
        self.product = Product.objects.create(
            business=business,
            sku='SKU-AUDIO-001',
            name='Titan Pro Wireless Headphones',
            category='Audio',
            current_stock=50,
            reorder_level=15,
            unit_cost=8000.00,
            selling_price=14999.00,
            ml_item_id=1,
        )

        self.generate_url = reverse('forecasting_generate')
        self.history_url = reverse('forecasting_history')

    def test_xgboost_forecast_generation(self):
        """Test XGBoost model executes 7-day demand predictions using 10 lag/rolling features."""
        payload = {
            'product_id': self.product.id,
            'horizon_days': 7,
        }
        response = self.client.post(self.generate_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_predicted_units', response.data)
        self.assertIn('forecast_series', response.data)
        self.assertEqual(len(response.data['forecast_series']), 7)
        self.assertIn('peak_day', response.data)
        self.assertIn('estimated_revenue', response.data)
        self.assertEqual(response.data['model_metrics']['mae'], 3.84)

        # Verify ForecastRun was persisted
        self.assertEqual(ForecastRun.objects.count(), 1)
        run = ForecastRun.objects.first()
        self.assertEqual(run.product, self.product)
        self.assertEqual(run.points.count(), 7)

    def test_forecast_history_retrieval(self):
        """Test retrieving forecast execution history."""
        self.test_xgboost_forecast_generation()
        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['product_sku'], 'SKU-AUDIO-001')
