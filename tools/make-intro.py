# -*- coding: utf-8 -*-
"""בונה את סרטון הפתיחה ללובי של מסך המרצה.

שלושה שוטים, כל אחד זום-אאוט איטי מתקריב על פרט אמיתי בתמונה אל התמונה המלאה:
קומת העמודים, הממ"ק בקומה, והממ"ד בדירה. חיתוך ישיר בין השוטים, בלי מעברים.

הזום נעשה מקומית על התמונות עצמן ולא במודל וידאו. הסיבה מעשית: המודל מוסיף תנועה
יפה יותר אבל גם ממציא פרטים, וכאן כל פרט באיור הוא גם נקודה במשחק. כשהזום מקומי,
אף פיקסל לא משתנה.

הרצה (מתיקיית המשחק):  python tools/make-intro.py
פלט: images/intro.mp4 (1280x720, בלי אודיו) ו-images/intro-poster.jpg
"""
import os
import subprocess
import sys

import imageio_ffmpeg

sys.stdout.reconfigure(encoding="utf-8")
DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = imageio_ffmpeg.get_ffmpeg_exe()
OUT = os.path.join(DIR, "images", "intro.mp4")
TMP = os.path.join(DIR, "tools", "originals", "intro-parts")

W, H, FPS = 1280, 720, 30
# (קובץ מקור, שניות, מרכז התקריב באחוזים, רוחב התקריב כשבר מרוחב התמונה)
SHOTS = [
    ("st1.jpg", 3.6, 0.55, 0.47, 0.55),
    ("st4.jpg", 3.4, 0.58, 0.45, 0.55),
    ("st5.jpg", 3.6, 0.55, 0.52, 0.55),
]


def run(args):
    p = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y"] + args)
    if p.returncode:
        raise SystemExit("ffmpeg failed: " + " ".join(args))


def main():
    os.makedirs(TMP, exist_ok=True)
    parts = []
    for i, (src, secs, cx, cy, fw) in enumerate(SHOTS):
        frames = int(round(secs * FPS))
        part = os.path.join(TMP, f"part{i}.mp4")
        # zoompan עובד על תמונה מוגדלת פי 4, אחרת הזום מקפץ בין פיקסלים שלמים
        big_w, big_h = W * 4, H * 4
        zoom_start = 1.0 / fw
        # x,y מקבעים את מרכז התקריב, ומתכנסים למרכז התמונה ככל שהזום קטן
        expr = (
            f"zoompan=z='max({zoom_start}-(on/{frames - 1})*({zoom_start}-1),1)':"
            f"x='(iw-iw/zoom)*({cx}-0.5)*(zoom-1)/({zoom_start}-1)+(iw-iw/zoom)/2':"
            f"y='(ih-ih/zoom)*({cy}-0.5)*(zoom-1)/({zoom_start}-1)+(ih-ih/zoom)/2':"
            f"d=1:s={W}x{H}:fps={FPS}"
        )
        run([
            "-loop", "1", "-i", os.path.join(DIR, "images", src),
            "-frames:v", str(frames),
            "-vf", f"scale={big_w}:{big_h}:flags=lanczos,{expr},setsar=1,format=yuv420p",
            "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-preset", "slow", part,
        ])
        parts.append(part)

    lst = os.path.join(TMP, "list.txt")
    with open(lst, "w", encoding="utf-8") as f:
        for p in parts:
            f.write("file '" + p.replace("\\", "/") + "'\n")
    run(["-f", "concat", "-safe", "0", "-i", lst, "-c:v", "libx264", "-crf", "23",
         "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", OUT])
    run(["-i", OUT, "-frames:v", "1", os.path.join(DIR, "images", "intro-poster.jpg")])
    print("images/intro.mp4", os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
