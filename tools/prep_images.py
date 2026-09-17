# -*- coding: utf-8 -*-
"""מכין תמונה שאושרה למשחק: חיתוך (אם צריך), הקטנה ודחיסה, ושמירה בשם הסופי.

המקור נשאר ב-tools/originals/ ולא נדרס. הדחיסה לפי מה שעבד במשחקים הקודמים:
quality=86, optimize, progressive, subsampling=0. מסך המרצה ודף הטלפון טוענים
תמונה אחת לכל תחנה, ולכן היעד הוא מתחת ל-250KB לתמונה.

הרצה (מתיקיית המשחק):
  python tools/prep_images.py in01.png=st1.jpg in02.png=st2.jpg:b0.05
חיתוך: l/r/t/b ואחריהם שבר מהרוחב או מהגובה שיורד מאותו צד. אפשר כמה, מופרדים בפסיק.
"""
import io, os, sys
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(DIR, "tools", "originals", "inbox")
OUT = os.path.join(DIR, "images")
MAX_W = 1280


def prep(src, dst, crop):
    im = Image.open(os.path.join(INBOX, src)).convert("RGB")
    w, h = im.size
    l, t, r, b = 0, 0, w, h
    for c in filter(None, crop.split(",")):
        side, frac = c[0], float(c[1:])
        if side == "l": l = round(w * frac)
        if side == "r": r = round(w * (1 - frac))
        if side == "t": t = round(h * frac)
        if side == "b": b = round(h * (1 - frac))
    im = im.crop((l, t, r, b))
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, dst)
    im.save(path, "JPEG", quality=86, optimize=True, progressive=True, subsampling=0)
    print(f"{src} -> images/{dst}  {im.width}x{im.height}  {os.path.getsize(path)//1024}KB")


for arg in sys.argv[1:]:
    pair, _, crop = arg.partition(":")
    src, dst = pair.split("=")
    prep(src, dst, crop)
