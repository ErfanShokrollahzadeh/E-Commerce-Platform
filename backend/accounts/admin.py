"""
Custom admin configuration for the User model.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Extended UserAdmin with custom fields."""

    list_display = [
        "email",
        "username",
        "first_name",
        "last_name",
        "phone",
        "is_active",
        "is_staff",
        "date_joined",
    ]
    list_filter = ["is_active", "is_staff", "is_superuser", "date_joined"]
    search_fields = ["email", "username", "first_name", "last_name", "phone"]
    ordering = ["-date_joined"]

    # Add custom fields to the admin form
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Profile Information",
            {
                "fields": (
                    "phone",
                    "avatar",
                    "date_of_birth",
                    "address",
                    "city",
                    "postal_code",
                ),
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Profile Information",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone",
                ),
            },
        ),
    )
