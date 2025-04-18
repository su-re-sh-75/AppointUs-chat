import io
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
from .translate import translate_text
from channels.db import database_sync_to_async
from django.conf import settings
from .transcribe import convert_ogg_to_wav, convert_ogg_to_wav_from_memory,  transcribe_wav

User = get_user_model()

async def get_user(username):
    return await sync_to_async(User.objects.get)(username=username)


async def get_fav_language(user):
    if user.is_authenticated:
        return await database_sync_to_async(lambda: user.customuser.fav_language)()
    return None

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
                print("Received: ", data)
                sender_lang = await get_fav_language(sender)
                receiver_lang = await get_fav_language(receiver)

                message = data.get("message", "")

                if sender_lang != receiver_lang:
                    translated_message = await translate_text(data["message"], receiver_lang)
                else:
                    translated_message = message

                await self.save_message(sender, receiver, message, translated_message, sender_lang, receiver_lang) 

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "text",
                        "message": message,
                        "translated_message": translated_message,
                        "sender": sender.username,
                        "receiver": receiver.username,
                        "username": username,
                        "room_name": room_name,
                        "senttime": sent_time,
                    }
                )

            elif message_type == "files":  # New handling for multiple files
                await self.save_files(data["files"], sender, receiver, room_name, sent_time)
            elif message_type == "voice":
                await self.handle_voice_message(data)

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
            file_message = await sync_to_async(Message.objects.create)(
                sender=sender,
                receiver=receiver,
                message_file=f"uploads/{file_name}",
                message_type="file"
            )

            # Send WebSocket event
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "file",
                    "file_url": f"/media/uploads/{file_name}",
                    "file_name": file_name,
                    "file_size": file_message.file_size,  
                    "file_extension": file_message.file_extension,
                    "sender": sender.username,
                    "receiver": receiver.username,
                    "username": sender.username,
                    "room_name": room_name,
                    "senttime": sent_time,
                }
            )

    async def handle_voice_message(self, data):
        lang_map = {
            "hi": "hindi",
            "kn": "kannada",
            "ml": "malayalam",
            "ta": "tamil",
            "te": "telugu",
            "en": "english"
        }
        base64_audio = data['voice_file'].split(',')[1]
        filename = data['voice_filename']
        sender = data['sender']
        receiver = data['receiver']
        senttime = data['senttime']
        room_name = data['room_name']
        sender_lang = await get_fav_language(sender)
        receiver_lang = await get_fav_language(receiver)

        # Decode audio and save
        audio_data = base64.b64decode(base64_audio)
        audio_file = io.BytesIO(audio_data)
        audio_dir = 'media/uploads/voice'
        os.makedirs(audio_dir, exist_ok=True)
        wav_filename = filename.replace('.ogg', '.wav')
        wav_path = os.path.join(audio_dir, wav_filename)

        convert_ogg_to_wav_from_memory(audio_data, wav_path)

        transcribed_text = await sync_to_async(transcribe_wav)(wav_path, lang_map[sender_lang])
        translated_text = transcribed_text

        # Save to DB
        print("Received Voice Message from Client:\n", data)
        voice_msg = await sync_to_async(Message.objects.create)(
            sender=sender,
            receiver=receiver,
            message_file=f'uploads/voice/{wav_filename}',
            transcribed_text=transcribed_text,
            translated_text=transcribed_text,
            message_type='voice',
            sender_language=sender_lang,
            receiver_language=receiver_lang
        )

        # Send back to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "voice",
                "voice_file_url": f"/media/uploads/voice/{wav_filename}",
                "voice_filename": wav_filename,
                "voice_filesize": voice_msg.file_size,
                "voice_file_extension": voice_msg.file_extension,
                "sender": sender.username,
                "receiver": receiver.username,
                "username": sender.username,
                "transcribed_text": transcribed_text,
                "translated_text": translated_text,
                "room_name": room_name,
                "senttime": senttime
            }
        )


    async def text(self, event):
        await self.send(text_data=json.dumps({
            "type": "text",
            "message": event["message"],
            "translated_message": event["translated_message"],
            "sender": event["sender"],
            "receiver": event["receiver"],
            "username": event["username"],
            "room_name": event["room_name"],
            "senttime": event["senttime"],
        }))
    
    async def file(self, event):
        await self.send(text_data=json.dumps({
            "type": "file",
            "file_url": event.get("file_url", ""),
            "file_name": event.get("file_name", ""),
            "file_size": event.get("file_size", ""),
            "file_extension": event.get("file_extension", ""),
            "sender": event.get("sender", "UnknownSender"), 
            "receiver": event.get("receiver", "UnknownReceiver"),
            "username": event.get("username", ""),
            "room_name": event.get("room_name", ""),
            "senttime": event.get("senttime", ""),
        }))

    async def voice(self, event):
        await self.send(text_data=json.dumps({
            "type": "voice",
            "voice_file_url": event.get("voice_file_url", ""),
            "voice_filename": event.get("voice_filename", ""),
            "voice_filesize": event.get("voice_filesize", ""),
            "voice_file_extension": event.get("voice_file_extension", ""),
            "sender": event.get("sender", "UnknownSender"), 
            "receiver": event.get("receiver", "UnknownReceiver"),
            "username": event.get("username", ""),
            "transcribed_text": event.get("transcribed_text", ""),
            "translated_text": event.get("translated_text", ""),
            "room_name": event.get("room_name", ""),
            "senttime": event.get("senttime", ""),
        }))


    @sync_to_async
    def save_message(self, sender, receiver, sender_message, receiver_message, sender_language, receiver_language):
        Message.objects.create(sender=sender, receiver=receiver, sender_msg=sender_message, receiver_msg=receiver_message, sender_language=sender_language, receiver_language=receiver_language)

    @sync_to_async
    def get_receiver_user(self):
        return User.objects.get(username=self.room_name)
