"""
Account Tests — Phase 6: Authentication.
Tests for user registration, login, logout, and profile endpoints.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import User


class RegisterViewTests(TestCase):
    """Tests for POST /api/auth/register/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("accounts:register")

    def test_register_success(self):
        """A valid registration creates a user and returns JWT tokens."""
        data = {
            "email": "newuser@example.com",
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "newuser@example.com")

        # Verify user was created in DB
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())

    def test_register_password_mismatch(self):
        """Registration fails when passwords don't match."""
        data = {
            "email": "newuser@example.com",
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "StrongPass123!",
            "password_confirm": "WrongPass456!",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        """Registration fails with a duplicate email."""
        User.objects.create_user(
            username="existing",
            email="existing@example.com",
            password="ExistingPass1!",
        )
        data = {
            "email": "existing@example.com",
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTests(TestCase):
    """Tests for POST /api/auth/login/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("accounts:login")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPass123!",
            first_name="Test",
            last_name="User",
        )

    def test_login_success(self):
        """Valid credentials return JWT tokens and user profile."""
        data = {"email": "test@example.com", "password": "TestPass123!"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "test@example.com")

    def test_login_wrong_password(self):
        """Wrong password returns 400."""
        data = {"email": "test@example.com", "password": "WrongPass!"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_email(self):
        """Non-existent email returns 400."""
        data = {"email": "noone@example.com", "password": "SomePass1!"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileViewTests(TestCase):
    """Tests for GET/PUT /api/auth/profile/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("accounts:profile")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPass123!",
            first_name="Test",
            last_name="User",
        )

    def _get_token(self):
        """Helper to get an access token."""
        login_url = reverse("accounts:login")
        response = self.client.post(
            login_url,
            {"email": "test@example.com", "password": "TestPass123!"},
            format="json",
        )
        return response.data["tokens"]["access"]

    def test_profile_get_authenticated(self):
        """Authenticated user can view their profile."""
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "test@example.com")

    def test_profile_get_unauthenticated(self):
        """Unauthenticated request returns 401."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_update(self):
        """Authenticated user can update their profile."""
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.patch(
            self.url,
            {"phone": "+1234567890", "city": "New York"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["phone"], "+1234567890")
        self.assertEqual(response.data["city"], "New York")


class LogoutViewTests(TestCase):
    """Tests for POST /api/auth/logout/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("accounts:logout")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPass123!",
        )

    def test_logout_success(self):
        """Logout blacklists the refresh token."""
        # Login first
        login_url = reverse("accounts:login")
        login_response = self.client.post(
            login_url,
            {"email": "test@example.com", "password": "TestPass123!"},
            format="json",
        )
        access_token = login_response.data["tokens"]["access"]
        refresh_token = login_response.data["tokens"]["refresh"]

        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.post(
            self.url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_unauthenticated(self):
        """Unauthenticated logout returns 401."""
        response = self.client.post(
            self.url,
            {"refresh": "fake-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
