import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from .models import Message
from asgiref.sync import sync_to_async
from datetime import datetime
from django.utils.timezone import now
import pytz
from django.utils.timezone import localtime

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

            kolkata_tz = pytz.timezone("Asia/Kolkata")
            sent_time = data.get("senttime")

            if sent_time:
                sent_time = datetime.fromisoformat(sent_time).astimezone(kolkata_tz).isoformat()
            else:
                sent_time = localtime().astimezone(kolkata_tz).isoformat()

            message = data.get("message", "")
            username = data.get("username", "")
            room_name = data.get("room_name", "")
            sender = self.scope['user']  
            receiver = await self.get_receiver_user() 

            await self.save_message(sender, receiver, message)

            print(f"Received: message={message}, username={username}, room_name={room_name}, senttime={sent_time}")

            # Broadcast to group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message,
                    'sender': sender.username,
                    'receiver': receiver.username,
                    "username": username,
                    "room_name": room_name,
                    "senttime": sent_time,
                }
            )
        except json.JSONDecodeError:
            print("Invalid JSON received.")

    async def chat_message(self, event):
        print(f"Sending: {event}")

        # Send full event data back to WebSocket client
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "username": event["username"],
            "room_name": event["room_name"],
            "senttime": event["senttime"],
            'sender': event['sender'],
            'receiver': event['receiver'],
        }))


    @sync_to_async
    def save_message(self, sender, receiver, message):
        Message.objects.create(sender=sender, receiver=receiver, content=message)

    @sync_to_async
    def get_receiver_user(self):
        return User.objects.get(username=self.room_name)


