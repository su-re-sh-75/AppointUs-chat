import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from .models import Message
from asgiref.sync import sync_to_async
from datetime import datetime
from django.utils.timezone import now
import pytz
from django.utils.timezone import localtime
import base64
import os
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()

async def get_user(username):
    return await sync_to_async(User.objects.get)(username=username)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        user1 = self.scope['user'].username 
        user2 = self.room_name
        self.room_group_name = f"chat_{''.join(sorted([user1, user2]))}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            kolkata_tz = pytz.timezone("Asia/Kolkata")
            sent_time = data.get("senttime")

            if sent_time:
                sent_time = datetime.fromisoformat(sent_time).astimezone(kolkata_tz).isoformat()
            else:
                sent_time = localtime().astimezone(kolkata_tz).isoformat()

            username = data.get("username", "")
            room_name = data.get("room_name", "")
            sender = self.scope['user']
            receiver = await self.get_receiver_user()
            data['sender'] = sender
            data['receiver'] = receiver

            if message_type == "text":
                message = data.get("message", "")
                await self.save_message(sender, receiver, message)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "text",
                        "message": message,
                        "sender": sender.username,
                        "receiver": receiver.username,
                        "username": username,
                        "room_name": room_name,
                        "senttime": sent_time,
                    }
                )

            elif message_type == "files":  # New handling for multiple files
                await self.save_files(data["files"], sender, receiver, room_name, sent_time)

        except json.JSONDecodeError:
            print("Invalid JSON received.")

    async def save_files(self, files, sender, receiver, room_name, sent_time):
        upload_dir = "media/uploads/"
        os.makedirs(upload_dir, exist_ok=True)

        for file_data in files:
            file_name = file_data["file_name"]
            decoded_file = base64.b64decode(file_data["file"])
            save_path = os.path.join(upload_dir, file_name)

            try:
                with open(save_path, "wb") as f:
                    f.write(decoded_file)
                print(f'File saved successfully: {save_path}')
            except Exception as e:
                print(f"Error saving file: {e}")

            # Save to the database
            await sync_to_async(Message.objects.create)(
                sender=sender,
                receiver=receiver,
                file=f"uploads/{file_name}",
                message_type="file"
            )

            # Send WebSocket event
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "file",
                    "file_url": f"/media/uploads/{file_name}",
                    "file_name": file_name,
                    "sender": sender.username,
                    "receiver": receiver.username,
                    "username": sender.username,
                    "room_name": room_name,
                    "senttime": sent_time,
                }
            )


    async def text(self, event):
        await self.send(text_data=json.dumps(event))
    
    async def file(self, event):
        await self.send(text_data=json.dumps({
            "type": "file",
            "file_url": event.get("file_url", ""),
            "file_name": event.get("file_name", ""),
            "sender": event.get("sender", "UnknownSender"), 
            "receiver": event.get("receiver", "UnknownReceiver"),
            "username": event.get("username", ""),
            "room_name": event.get("room_name", ""),
            "senttime": event.get("senttime", ""),
        }))


    @sync_to_async
    def save_message(self, sender, receiver, message):
        Message.objects.create(sender=sender, receiver=receiver, content=message)

    @sync_to_async
    def get_receiver_user(self):
        return User.objects.get(username=self.room_name)
