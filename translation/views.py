from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Message
from django.db.models import Q
from datetime import datetime
from channels.layers import get_channel_layer
from django.http import HttpResponse
from asgiref.sync import async_to_sync
import pytz

kolkata_tz = pytz.timezone("Asia/Kolkata")

def index(request):
    return render(request, "translation/index.html")

@login_required(login_url='users:login')
def chat_room(request, room_name):
    search_query = request.GET.get('search', '') 
    users = User.objects.exclude(id=request.user.id) 
    chats = Message.objects.filter(
        (Q(sender=request.user) & Q(receiver__username=room_name)) |
        (Q(receiver=request.user) & Q(sender__username=room_name))
    )

    if search_query:
        chats = chats.filter(Q(content__icontains=search_query))  

    chats = chats.order_by('timestamp') 
    user_last_messages = []

    for user in users:
        last_message = Message.objects.filter(
            (Q(sender=request.user) & Q(receiver=user)) |
            (Q(receiver=request.user) & Q(sender=user))
        ).order_by('-timestamp').first()
        
        user_last_messages.append({
            'user': user,
            'last_message': last_message
        })
        print(user_last_messages)
    # Sort user_last_messages by the timestamp of the last_message in descending order
    user_last_messages.sort(
        key=lambda x: x['last_message'].timestamp if x['last_message'] else datetime.min.replace(tzinfo=kolkata_tz),
        reverse=True
    )

    return render(request, 'translation/chat.html', {
        'room_name': room_name,
        'chats': chats,
        'users': users,
        'user_last_messages': user_last_messages,
        'search_query': search_query 
    })

def chat_file_upload(request, room_name):
    if request.FILES:
        file = request.FILES['file']
        receiver_user = User.objects.get(username=room_name)
        message = Message.objects.create(
            sender = request.user,
            receiver = receiver_user,
            file = file
        )

        channel_layer = get_channel_layer()
        event = {
            'type': 'message_handler',
            'message_id': message.id
        }
        async_to_sync(channel_layer.group_send)(
            room_name, event
        )
    return HttpResponse()