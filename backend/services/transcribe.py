import sys
import yt_dlp
import whisper
import os
import json
import glob
import warnings
warnings.filterwarnings("ignore")

FFMPEG_DIR = r"D:\ffmpeg\bin"

def download_and_transcribe(url, output_file):
    os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

    ydl_opts = {
        'format': 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio',
        'outtmpl': 'audio_temp.%(ext)s',
        'quiet': True,
        'no_warnings': True,
    }

    downloaded_file = None

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        possible_files = glob.glob("audio_temp.*")
        if not possible_files:
            raise Exception("Download failed — no audio file found")

        downloaded_file = possible_files[0]

        model  = whisper.load_model("base")
        result = model.transcribe(downloaded_file)
        transcript = result["text"].strip()

        # Write result to file instead of stdout
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump({ "success": True, "transcript": transcript }, f)

    except Exception as e:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump({ "success": False, "error": str(e) }, f)

    finally:
        for f in glob.glob("audio_temp.*"):
            try:
                os.remove(f)
            except:
                pass


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: transcribe.py <url> <output_file>")
        sys.exit(1)

    download_and_transcribe(sys.argv[1], sys.argv[2])