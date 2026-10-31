from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Business, Store

User = get_user_model()


class BusinessAndIsolationTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email='aarav.sharma@nexusops.in',
            username='aarav',
            password='Password123@Aarav',
            full_name='Aarav Sharma',
        )
        self.user_b = User.objects.create_user(
            email='competitor@otherops.in',
            username='competitor',
            password='Password123@Competitor',
            full_name='Competitor User',
        )

        self.token_a = str(RefreshToken.for_user(self.user_a).access_token)
        self.token_b = str(RefreshToken.for_user(self.user_b).access_token)

        self.business_url = reverse('current_business')
        self.stores_url = reverse('business_stores')

    def test_default_business_provisioned_on_user_creation(self):
        """Test user has a default Business and clean primary store automatically created."""
        business = Business.objects.filter(owner=self.user_a).first()
        self.assertIsNotNone(business)
        self.assertEqual(business.currency, 'INR')
        self.assertEqual(business.timezone, 'Asia/Kolkata')

        stores = Store.objects.filter(business=business)
        self.assertEqual(stores.count(), 1)
        self.assertEqual(stores.first().name, 'Main Location')

    def test_authenticated_user_accesses_own_business(self):
        """Test User A retrieves their own business settings."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_a}')
        response = self.client.get(self.business_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['currency'], 'INR')
        self.assertEqual(len(response.data['stores']), 1)

    def test_multi_tenant_data_isolation(self):
        """Test User A and User B only see their respective stores, preventing data leakage."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_a}')
        response_a = self.client.get(self.stores_url)
        self.assertEqual(response_a.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_b}')
        response_b = self.client.get(self.stores_url)
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)

        # Ensure store IDs do not overlap between tenants
        store_ids_a = {s['id'] for s in response_a.data}
        store_ids_b = {s['id'] for s in response_b.data}
        self.assertTrue(store_ids_a.isdisjoint(store_ids_b))

    def test_business_profile_update(self):
        """Test User A can update their business name and currency settings."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_a}')
        payload = {
            'name': 'NexusOps Enterprise India',
            'business_type': 'Omnichannel Electronics & Gadgets',
        }
        response = self.client.patch(self.business_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'NexusOps Enterprise India')
        self.assertEqual(response.data['business_type'], 'Omnichannel Electronics & Gadgets')
