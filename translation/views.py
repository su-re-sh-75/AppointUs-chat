import json
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from .models import Message
from django.db.models import Q
from datetime import datetime
from channels.layers import get_channel_layer
from django.http import HttpResponse
from asgiref.sync import async_to_sync
import pytz
from django.contrib import messages
from users.models import CustomUser
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse

User = get_user_model()

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

    chats = chats.order_by('sent_time') 
    user_last_messages = []

    for user in users:
        last_message = Message.objects.filter(
            (Q(sender=request.user) & Q(receiver=user)) |
            (Q(receiver=request.user) & Q(sender=user))
        ).order_by('-sent_time').first()
        
        user_last_messages.append({
            'user': user,
            'last_message': last_message
        })
        print(user_last_messages)
    # Sort user_last_messages by the sent_time of the last_message in descending order
    user_last_messages.sort(
        key=lambda x: x['last_message'].sent_time if x['last_message'] else datetime.min.replace(tzinfo=kolkata_tz),
        reverse=True
    )
    print(chats)
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
            message_file = file
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

@csrf_protect
def update_language(request):
    if request.method == 'POST':
        user = request.user
        data = json.loads(request.body)
        new_lang = data.get('language')
    
        if user.is_authenticated and new_lang:
            user.customuser.fav_language = new_lang
            user.customuser.save()
            print(f"{user.customuser.fav_language} is set as favourite language for {user.username}")
            return JsonResponse({"message": "Language updated successfully"}, status=200)
        
        return JsonResponse({"error": "User not authenticated"}, status=401)
    
    return JsonResponse({"error": "Invalid request"}, status=400)