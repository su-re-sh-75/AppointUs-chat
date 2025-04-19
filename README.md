# APPOINTUS: REAL TIME MULTILINGUAL TRANSLATION CHAT

### Installation & Execution

1. Virtual env:
    1. `python -m venv env`
    2. `activate` or `env\Scripts\activate`

2. Dependencies Installation:
    1. `pip install requirements.txt`
    2. `npm install`
    3. Install `ffmpeg` latest ([Follow this](https://phoenixnap.com/kb/ffmpeg-windows)).
3. Create an API key  from a service account in [google cloud console](https://console.cloud.google.com/). (Automatically downloads as json).

4. DB Migrations:
    1. `python manage.py makemigrations`
    2. `python manage.py migrate`

5. Run Server `python manage.py runserver`

<details>
    <summary>Existing Users</summary>
    1. superuser: suresh, password: admin123 <br>
    2. user: karthi, password: karthi
</details>
