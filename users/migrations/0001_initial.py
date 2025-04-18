# Generated by Django 5.1.6 on 2025-03-02 07:05

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fav_language', models.CharField(choices=[('as', 'Assamese'), ('bn', 'Bengali'), ('gu', 'Gujarati'), ('hi', 'Hindi'), ('kn', 'Kannada'), ('ml', 'Malayalam'), ('mr', 'Marathi'), ('or', 'Odia'), ('pa', 'Punjabi'), ('ta', 'Tamil'), ('te', 'Telugu'), ('ur', 'Urdu'), ('en', 'English'), ('es', 'Spanish'), ('fr', 'French'), ('de', 'German'), ('zh-cn', 'Chinese (Simplified)'), ('zh-tw', 'Chinese (Traditional)'), ('ja', 'Japanese'), ('ko', 'Korean'), ('ru', 'Russian'), ('it', 'Italian'), ('pt', 'Portuguese'), ('ar', 'Arabic')], default='en', max_length=10)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
