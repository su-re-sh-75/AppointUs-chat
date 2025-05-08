import json
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from .models import Message
from django.db.models import Q
from datetime import datetime
import pytz
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

    receiver_user = User.objects.get(username=room_name)

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
    # print(chats)
    return render(request, 'translation/chat.html', {
        'room_name': room_name,
        'receiver_user': receiver_user,
        'chats': chats,
        'users': users,
        'user_last_messages': user_last_messages,
        'search_query': search_query 
    })

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