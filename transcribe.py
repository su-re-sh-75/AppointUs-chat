from google.cloud import speech_v1 as speech
import os
import subprocess

client = speech.SpeechClient.from_service_account_file('appointus-chat-translation-c03f51a6c75d.json')

def print_response(response: speech.RecognizeResponse):
    for result in response.results:
        print_result(result)

def print_result(result: speech.SpeechRecognitionResult):
    best_alternative = result.alternatives[0]
    print("-" * 80)
    print(f"language_code: {result.language_code}")
    print(f"transcript:    {best_alternative.transcript}")
    print(f"confidence:    {best_alternative.confidence:.0%}")

def convert_ogg_to_wav(input_path, output_path):
    """
    Converts OGG/Opus file to 16kHz mono WAV using ffmpeg.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    subprocess.run([
        r"C:\ffmpeg\bin\ffmpeg.exe",
        '-y',
        '-i', input_path,
        '-acodec', 'pcm_s16le',
        '-ac', '1',               # mono
        '-ar', '16000',           # 16kHz
        output_path
    ])
    print(f"Converted {input_path} -> {output_path}")


def transcribe_wav(file_path):
    """
    Transcribes a LINEAR16 WAV file using Google Speech-to-Text.
    """
    with open(file_path, 'rb') as audio_file:
        content = audio_file.read()
        audio = speech.RecognitionAudio(content=content)

        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="en-US",
        )

        response = client.recognize(config=config, audio=audio)

        for result in response.results:
            print(f"Transcript: {result.alternatives[0].transcript}")
            print(f"Confidence: {result.alternatives[0].confidence}")

        return response


# if __name__ == '__main__':
#     input_ogg = "voice_suresh_karthi_18Apr2025191302.ogg"
#     output_wav = "converted_audio/voice_suresh_karthi_18Apr2025191302.wav"

#     convert_ogg_to_wav(input_ogg, output_wav)
#     response = transcribe_wav(output_wav)