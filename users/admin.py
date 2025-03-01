from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Preferences", {"fields": ("fav_language",)}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
