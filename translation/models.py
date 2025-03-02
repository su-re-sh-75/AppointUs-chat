from django.db import models
import os
from django.contrib.auth.models import User

class Message(models.Model):
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
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    content = models.TextField(blank=True, null=True)
    content_language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="en"
    )
    file = models.FileField(upload_to='uploads/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(
        max_length=10,
        choices=[("text", "Text"), ("file", "File")],
        default="text"
    )

    @property
    def filename(self):
        if self.file:
            return os.path.basename(self.file.name)
        else:
            return None
    
    @property
    def is_image(self):
        return self.filename.lower().endswith(('.jpeg', '.jpg', '.svg', '.png', '.gif', '.webp', '.avif'))
    
    @property
    def file_extension(self):
        if self.file:
            return os.path.splitext(self.filename)[-1][1:]
        return None

    @property
    def file_size(self):
        if self.file and self.file.size:
            size_bytes = self.file.size
            if size_bytes < 1024:
                return f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                return f"{size_bytes / 1024:.2f} KB"
            elif size_bytes < 1024 * 1024 * 1024:
                return f"{size_bytes / (1024 * 1024):.2f} MB"   
        return None

    def __str__(self):
        if self.file:
            return f"{self.sender} -> {self.receiver}: [File] {self.filename}"
        return f"{self.sender} -> {self.receiver}: {self.content[:20]}"

    class Meta:
        ordering = ['-timestamp']