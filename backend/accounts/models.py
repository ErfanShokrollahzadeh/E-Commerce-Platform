"""
Custom User model — Phase 6: Authentication.
Extends AbstractUser with additional profile fields for e-commerce customers.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model that extends Django's AbstractUser.
    Adds e-commerce-specific fields: phone, avatar, date of birth, and address.
    """

    email = models.EmailField(
        unique=True,
        help_text="Required. Used for login and communication.",
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Contact phone number.",
    )

    avatar = models.ImageField(
        upload_to="avatars/%Y/%m/",
        blank=True,
        null=True,
        help_text="Profile picture.",
    )

    date_of_birth = models.DateField(
        blank=True,
        null=True,
        help_text="Customer date of birth.",
    )

    # Shipping address defaults (pre-fill checkout)
    address = models.TextField(
        blank=True,
        default="",
        help_text="Default shipping address.",
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Default shipping city.",
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Default shipping postal code.",
    )

    # Use email as the login field instead of username
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        ordering = ["-date_joined"]
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    @property
    def full_name(self):
        """Returns the user's full name."""
        return self.get_full_name() or self.username
