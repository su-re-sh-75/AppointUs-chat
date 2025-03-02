from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import CustomUser

class CustomUserInline(admin.StackedInline):
    model = CustomUser
    can_delete = False
    verbose_name_plural = 'CustomUsers'

class CustomUserAdmin(UserAdmin):
    # fieldsets = UserAdmin.fieldsets + (
    #     ("Preferences", {"fields": ("fav_language",)}),
    # )
    inlines = (CustomUserInline, )

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(CustomUser)