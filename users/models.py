from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    LANGUAGE_CHOICES = [
        ("as", "Assamese"), ("bn", "Bengali"), ("gu", "Gujarati"),
        ("hi", "Hindi"), ("kn", "Kannada"), ("ml", "Malayalam"),
        ("mr", "Marathi"), ("or", "Odia"), ("pa", "Punjabi"),
        ("ta", "Tamil"), ("te", "Telugu"), ("ur", "Urdu"),
        ("en", "English"), ("es", "Spanish"), ("fr", "French"),
        ("de", "German"), ("zh-cn", "Chinese (Simplified)"),
        ("zh-tw", "Chinese (Traditional)"), ("ja", "Japanese"),
        ("ko", "Korean"), ("ru", "Russian"), ("it", "Italian"),
        ("pt", "Portuguese"), ("ar", "Arabic"),
    ]
    fav_language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="en"
    )

    objects = CustomUserManager() 

    def __str__(self):
        return self.username

