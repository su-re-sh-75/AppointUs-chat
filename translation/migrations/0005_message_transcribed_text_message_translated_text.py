# Generated by Django 5.1.6 on 2025-04-18 14:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('translation', '0004_alter_message_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='transcribed_text',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='message',
            name='translated_text',
            field=models.TextField(blank=True, null=True),
        ),
    ]
