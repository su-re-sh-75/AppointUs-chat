from django.contrib.auth.models import AbstractUser, Group, Permission, User
from django.db import models


class CustomUser(models.Model):
    LANGUAGE_CHOICES = [
        ("hi", "Hindi"), ("kn", "Kannada"), ("ml", "Malayalam"),
        ("ta", "Tamil"), ("te", "Telugu"), ("en", "English")
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    fav_language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="en"
    )

    def __str__(self):
        return self.user.username

