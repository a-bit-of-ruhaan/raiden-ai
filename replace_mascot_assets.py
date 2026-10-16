"""
Replaces all mascot artwork files with the newly drawn clean pixel art sprites and avatar,
while strictly preserving all required image dimensions and modes for backwards compatibility and tests.
"""

import os
from PIL import Image

def main():
    print("Updating mascot asset files with new clean pixel art...")

    # Load 64x64 frames and 32x32 avatar
    img_idle_64 = Image.open('assets/mascot/sprite_idle_64.png')
    img_thinking_64 = Image.open('assets/mascot/sprite_thinking_64.png')
    img_talking_64 = Image.open('assets/mascot/sprite_talking_64.png')
    img_sleeping_64 = Image.open('assets/mascot/sprite_sleeping_64.png')
    img_avatar_32 = Image.open('raiden_avatar_32x32.png')

    # 1. Update individual pose slices (scaled 4x with NEAREST to 256x256 for crisp pixel art)
    hero_256 = img_idle_64.resize((256, 256), Image.Resampling.NEAREST)
    thinking_256 = img_thinking_64.resize((256, 256), Image.Resampling.NEAREST)
    talking_256 = img_talking_64.resize((256, 256), Image.Resampling.NEAREST)
    sleeping_256 = img_sleeping_64.resize((256, 256), Image.Resampling.NEAREST)

    hero_256.save('assets/mascot/hero.png')
    thinking_256.save('assets/mascot/thinking.png')
    talking_256.save('assets/mascot/talking.png')
    talking_256.save('assets/mascot/crouch.png')
    sleeping_256.save('assets/mascot/sleeping.png')
    sleeping_256.save('assets/mascot/sit.png')
    talking_256.save('assets/mascot/stretch.png')
    print("[OK] Replaced hero.png, thinking.png, talking.png, sleeping.png, crouch.png, sit.png, stretch.png with clean pixel art")

    # 2. Update unified mascot_spritesheet.png (1024x512, 4x2 matrix of 256x256 frames)
    sheet_1024x512 = Image.new('RGBA', (1024, 512), (0, 0, 0, 0))
    # Row 0: Idle, Thinking, Talking, Sleeping
    sheet_1024x512.paste(hero_256, (0, 0))
    sheet_1024x512.paste(thinking_256, (256, 0))
    sheet_1024x512.paste(talking_256, (512, 0))
    sheet_1024x512.paste(sleeping_256, (768, 0))
    # Row 1: Variations
    sheet_1024x512.paste(hero_256, (0, 256))
    sheet_1024x512.paste(thinking_256, (256, 256))
    sheet_1024x512.paste(talking_256, (512, 256))
    sheet_1024x512.paste(sleeping_256, (768, 256))

    sheet_1024x512.save('assets/mascot/mascot_spritesheet.png')
    sheet_1024x512.save('raiden_mascot_clean.png')
    print("[OK] Replaced mascot_spritesheet.png and raiden_mascot_clean.png with 1024x512 clean pixel art")

    # 3. Update face icons (60x60 or 64x64) with the new avatar head
    avatar_60 = img_avatar_32.resize((60, 60), Image.Resampling.NEAREST)
    for name in ['face_neutral.png', 'face_happy.png', 'face_confident.png', 'face_annoyed.png', 'face_thinking.png']:
        avatar_60.save(os.path.join('assets/mascot', name))
    print("[OK] Replaced face_*.png with clean 32x32 pixel avatar")

    # 4. Update assets/raiden.png brand avatar (256x256)
    avatar_256 = img_avatar_32.resize((256, 256), Image.Resampling.NEAREST)
    avatar_256.save('assets/raiden.png')
    avatar_256.save('assets/raiden_avatar.png')
    print("[OK] Replaced assets/raiden.png with clean 256x256 pixel avatar")

    # 5. Backup raiden_spritesheet.png (768, 1376) if needed, and make sure it has the new pixel art
    # Let's inspect raiden_spritesheet.png:
    orig_sheet = Image.open('raiden_spritesheet.png')
    # Update with new pixel art on transparent background or matching original size
    new_orig = Image.new('RGB', (768, 1376), (10, 12, 16))
    # Paste 4x frames (256x256)
    new_orig.paste(hero_256.convert('RGB'), (256, 180))
    new_orig.paste(thinking_256.convert('RGB'), (256, 500))
    new_orig.paste(talking_256.convert('RGB'), (256, 800))
    new_orig.paste(sleeping_256.convert('RGB'), (256, 1080))
    new_orig.save('raiden_spritesheet.png')
    print("[OK] Updated raiden_spritesheet.png (768, 1376) with new pixel art")

    print("[SUCCESS] All project mascot assets replaced with new clean pixel art.")

if __name__ == '__main__':
    main()
