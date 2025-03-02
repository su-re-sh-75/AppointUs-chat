from django.contrib.auth.models import AbstractUser, Group, Permission, User
from django.db import models


class CustomUser(models.Model):
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
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    fav_language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="en"
    )

    def __str__(self):
        return self.user.username

