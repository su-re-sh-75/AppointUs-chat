from django.db import models
from django.contrib.auth.models import User

class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    content = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='files/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(
        max_length=10,
        choices=[("text", "Text"), ("file", "File")],
        default="text"
    )
    def __str__(self):
        if self.file:
            return f"{self.sender} -> {self.receiver}: [File] {self.file.name}"
        return f"{self.sender} -> {self.receiver}: {self.content[:20]}"
