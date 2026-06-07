"""
Account Views — Phase 6: Authentication.
JWT-based auth endpoints: register, login, logout, profile, token refresh.
Handles guest-to-user cart merging on login/register.
"""

import logging

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as JWTTokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from cart.services import CartService
from .models import User
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

logger = logging.getLogger(__name__)


def _get_tokens_for_user(user: User) -> dict:
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def _merge_guest_cart(request, user: User) -> None:
    """
    Merge guest session cart into the authenticated user's cart.
    Called after successful login or registration.
    """
    session_key = request.session.session_key
    if session_key:
        try:
            cart_service = CartService()
            cart_service.merge_carts(session_key, user.id)
        except Exception as e:
            # Don't fail login/register if cart merge fails
            logger.warning("Cart merge failed for user %s: %s", user.id, str(e))


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Create a new user account and return JWT tokens.
    Merges any guest cart items into the new user's cart.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Merge guest cart into user cart
        _merge_guest_cart(request, user)

        tokens = _get_tokens_for_user(user)
        profile = UserProfileSerializer(user).data

        return Response(
            {
                "user": profile,
                "tokens": tokens,
                "message": "Account created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate a user and return JWT tokens.
    Merges any guest cart items into the user's cart.
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # Merge guest cart into user cart
        _merge_guest_cart(request, user)

        tokens = _get_tokens_for_user(user)
        profile = UserProfileSerializer(user).data

        return Response(
            {
                "user": profile,
                "tokens": tokens,
                "message": "Login successful.",
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token to invalidate the session.
    Body: { "refresh": "<refresh_token>" }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token is already blacklisted or invalid — treat as success
            pass

        return Response(
            {"message": "Logout successful."},
            status=status.HTTP_200_OK,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/profile/ — Retrieve current user's profile.
    PUT  /api/auth/profile/ — Update current user's profile.
    PATCH /api/auth/profile/ — Partial update current user's profile.
    """

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Change the authenticated user's password.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class CustomTokenRefreshView(JWTTokenRefreshView):
    """
    POST /api/auth/token/refresh/
    Refresh an access token using a valid refresh token.
    Extends the default view to maintain API consistency.
    """

    permission_classes = [AllowAny]
