from googletrans import Translator
from google.cloud import translate_v2 as translate

client = translate.Client.from_service_account_json("appointus-chat-translation-c03f51a6c75d.json")

async def translate_text(text, target_language):
    async with Translator() as translator:
        result = await translator.translate(text, dest=target_language)   
        return result.text

def google_translate(text: str, target_language: str) -> str:
    result = client.translate(text, target_language)
    return result['translatedText']

if __name__ == '__main__':
    google_translate("Hello How are you?", "ta")