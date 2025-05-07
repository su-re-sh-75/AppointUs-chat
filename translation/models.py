from django.db import models
import os
from django.contrib.auth.models import User
import subprocess
from django.conf import settings

class Message(models.Model):
    LANGUAGE_CHOICES = [
        ("hi", "Hindi"), ("kn", "Kannada"), ("ml", "Malayalam"),
        ("ta", "Tamil"), ("te", "Telugu"), ("en", "English")
    ]

    MESSAGE_TYPE_CHOICES = [
        ("text", "Text"),
        ("file", "File"),
        ("voice", "Voice"),
    ]
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    sender_msg = models.TextField(blank=True, null=True)
    receiver_msg = models.TextField(blank=True, null=True)
    transcribed_text = models.TextField(blank=True, null=True)      # for voice msg
    translated_text = models.TextField(blank=True, null=True)       # for voice msg
    message_file = models.FileField(upload_to='uploads/', blank=True, null=True)
    sender_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="en")
    receiver_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="en")
    sent_time = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default="text")

    @property
    def filename(self):
        return os.path.basename(self.message_file.name) if self.message_file else None

    @property
    def is_image(self):
        return self.filename and self.filename.lower().endswith(('.jpeg', '.jpg', '.svg', '.png', '.gif', '.webp', '.avif'))

    @property
    def file_extension(self):
        return os.path.splitext(self.filename)[-1][1:] if self.message_file else None

    @property
    def file_size(self):
        if self.message_file and self.message_file.size:
            size_bytes = self.message_file.size
            if size_bytes < 1024:
                return f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                return f"{size_bytes / 1024:.2f} KB"
            elif size_bytes < 1024 * 1024 * 1024:
                return f"{size_bytes / (1024 * 1024):.2f} MB"
        return None

    @property
    def voice_duration(self):
        if self.message_type == "voice" and self.message_file:
            try:
                filepath = os.path.join(settings.MEDIA_ROOT, self.message_file.name)
                result = subprocess.run(
                    [
                        "ffprobe",
                        "-v", "error",
                        "-show_entries", "format=duration",
                        "-of", "default=noprint_wrappers=1:nokey=1",
                        filepath
                    ],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT
                )
                duration = float(result.stdout.decode().strip())
                minutes = int(duration // 60)
                seconds = int(duration % 60)
                return f"{minutes}:{seconds:02d}"
            except Exception as e:
                print(f"FFprobe failed: {e}")
                return "0:00"
        return "0:00"
    
    def __str__(self):
        if self.message_file:
            return f"{self.sender} -> {self.receiver}: [File] {self.filename}"
        return f"{self.sender} -> {self.receiver}: {self.sender_msg[:20], self.receiver_msg[:20]}"

    class Meta:
        ordering = ['-sent_time']
