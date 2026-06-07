"""Account app URL configuration."""

from django.urls import path

from .views import (
    ChangePasswordView,
    CustomTokenRefreshView,
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token-refresh"),
]
