from django.urls import path
from . import views
from django.conf.urls.static import static
from django.conf import settings
import os 

app_name = "translation"
urlpatterns = [
    path('', views.index, name='home'),
    path('chat/<str:room_name>/', views.chat_room, name='chat'),
    path("update-language/", views.update_language, name="update_language"),
]
