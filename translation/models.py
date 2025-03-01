from django.db import models
import os
from django.conf import settings

class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_messages")
    content = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='files/', blank=True, null=True)
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