# Generated by Django 5.1.6 on 2025-04-06 10:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='fav_language',
            field=models.CharField(choices=[('hi', 'Hindi'), ('kn', 'Kannada'), ('ml', 'Malayalam'), ('ta', 'Tamil'), ('te', 'Telugu'), ('en', 'English')], default='en', max_length=10),
        ),
    ]
