from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.models import User
from .models import CustomUser

def login_page(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        print(username)
        print(password)
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, 'Login successful!', 'info')
            return redirect(f'/chat/{username}/')
        else:
            messages.error(request, 'Invalid email or password', 'error')

        if request.user.is_authenticated:
            return redirect(f'/chat/{request.user.username}/')
        
    return render(request,'users/login.html')


@login_required
def logout_page(request):
    logout(request)  
    messages.success(request, 'Logged out successfully', 'info') 
    return redirect('/')


def signup_view(request):
    if request.method == 'POST':
        User = get_user_model()
        email = request.POST.get('email')
        username = request.POST.get('username')
        password = request.POST.get('password')
        language = request.POST.get('fav_language')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists', 'error')
            return redirect('users:signup')
        elif User.objects.filter(email=email).exists():
            messages.error(request, 'Email already exists', 'error')
            return redirect('users:signup')
        else:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()

            customuser = CustomUser.objects.create(user=user, fav_language=language or 'en')
            customuser.save()

            messages.success(request, 'Account created successfully', 'info')
            # return redirect('users:login')
        
            login(request, user)
            return redirect(f'/chat/{request.user.username}')
    
    return render(request, 'users/signup.html')

