from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')
        self.logout_url = reverse('auth_logout')
        self.refresh_url = reverse('auth_token_refresh')
        self.profile_url = reverse('auth_profile')

        self.valid_user_data = {
            'email': 'aarav.sharma@nexusops.in',
            'full_name': 'Aarav Sharma',
            'role': 'Director of Operations',
            'phone': '+91 98200 12345',
            'password': 'StrongPassword@2026',
            'password_confirm': 'StrongPassword@2026',
        }

    def test_user_registration_success(self):
        """Test successful user registration returns 201 and JWT tokens."""
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], 'aarav.sharma@nexusops.in')
        self.assertEqual(response.data['user']['full_name'], 'Aarav Sharma')
        self.assertEqual(response.data['user']['avatar_initials'], 'AS')

        # Verify password is encrypted in database
        user = User.objects.get(email='aarav.sharma@nexusops.in')
        self.assertTrue(user.check_password('StrongPassword@2026'))
        self.assertNotEqual(user.password, 'StrongPassword@2026')

    def test_duplicate_email_registration_fails(self):
        """Test duplicate registration with same email (even with case differences) fails."""
        self.client.post(self.register_url, self.valid_user_data, format='json')

        duplicate_data = self.valid_user_data.copy()
        duplicate_data['email'] = 'AARAV.SHARMA@NEXUSOPS.IN'
        response = self.client.post(self.register_url, duplicate_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_password_mismatch_fails(self):
        """Test registration with mismatched passwords fails."""
        data = self.valid_user_data.copy()
        data['password_confirm'] = 'DifferentPassword@2026'
        response = self.client.post(self.register_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', response.data)

    def test_weak_password_fails(self):
        """Test registration with short/weak password fails Django validation."""
        data = self.valid_user_data.copy()
        data['password'] = '123'
        data['password_confirm'] = '123'
        response = self.client.post(self.register_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_login_success(self):
        """Test login with valid credentials returns JWT tokens."""
        self.client.post(self.register_url, self.valid_user_data, format='json')

        login_payload = {
            'email': 'aarav.sharma@nexusops.in',
            'password': 'StrongPassword@2026',
        }
        response = self.client.post(self.login_url, login_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], 'aarav.sharma@nexusops.in')

    def test_login_invalid_password_fails(self):
        """Test login with wrong password fails with 400."""
        self.client.post(self.register_url, self.valid_user_data, format='json')

        login_payload = {
            'email': 'aarav.sharma@nexusops.in',
            'password': 'WrongPassword@999',
        }
        response = self.client.post(self.login_url, login_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_authenticated_access(self):
        """Test authenticated user can access and update their profile."""
        reg_response = self.client.post(self.register_url, self.valid_user_data, format='json')
        access_token = reg_response.data['tokens']['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'aarav.sharma@nexusops.in')

        # Test updating profile
        update_response = self.client.patch(
            self.profile_url,
            {'full_name': 'Aarav Sharma Updated', 'phone': '+91 99999 88888'},
            format='json'
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['full_name'], 'Aarav Sharma Updated')
        self.assertEqual(update_response.data['phone'], '+91 99999 88888')

    def test_profile_unauthenticated_fails(self):
        """Test accessing profile without Bearer token returns 401."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        """Test refreshing access token using valid refresh token."""
        reg_response = self.client.post(self.register_url, self.valid_user_data, format='json')
        refresh_token = reg_response.data['tokens']['refresh']

        refresh_response = self.client.post(
            self.refresh_url,
            {'refresh': refresh_token},
            format='json'
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_logout_blacklists_token(self):
        """Test logging out blacklists the refresh token."""
        reg_response = self.client.post(self.register_url, self.valid_user_data, format='json')
        access_token = reg_response.data['tokens']['access']
        refresh_token = reg_response.data['tokens']['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_response = self.client.post(
            self.logout_url,
            {'refresh': refresh_token},
            format='json'
        )
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # Attempting to use the blacklisted refresh token now must fail
        reuse_response = self.client.post(
            self.refresh_url,
            {'refresh': refresh_token},
            format='json'
        )
        self.assertEqual(reuse_response.status_code, status.HTTP_401_UNAUTHORIZED)
