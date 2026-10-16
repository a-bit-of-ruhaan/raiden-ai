"""
RAIDEN AI — TRUE PIXEL ART SPRITE SHEET & AVATAR GENERATOR
Constructs an authentic, clean, 64x64 pixel grid sprite sheet (4 frames: Idle, Thinking, Talking, Sleeping)
and a 32x32 close-up chat avatar with a strictly limited 16-color palette and 100% transparent PNG background.
"""

import os
from PIL import Image
import numpy as np

PALETTE = {
    'TRANS': (0, 0, 0, 0),
    'BLACK': (12, 16, 23, 255),        # 0C1017 deep black outline
    'FUR_DARK': (20, 26, 36, 255),     # 141A24 cat fur base
    'FUR_MID': (30, 38, 52, 255),      # 1E2634 fur midtone
    'ARMOR_DARK': (40, 50, 70, 255),   # 283246 dark slate armor
    'ARMOR_MID': (65, 80, 108, 255),   # 41506C mid steel plates
    'ARMOR_LIGHT': (95, 115, 148, 255), # 5F7394 steel grey highlight
    'RIM_STEEL': (130, 160, 195, 255), # 82A0C3 light steel blue rim
    'RIM_CYAN': (56, 189, 218, 255),   # 38BDDA cyan edge rim accent
    'CYAN_DEEP': (0, 160, 195, 255),   # 00A0C3 deep cyan glow
    'CYAN_BRIGHT': (0, 240, 255, 255), # 00F0FF pure glowing cyan
    'CYAN_WHITE': (180, 250, 255, 255),# B4FAFF white-cyan highlight
    'WHITE_HOT': (250, 255, 255, 255), # FAFFFF brightest core: eyes & bolt
    'MOUTH_PINK': (220, 65, 100, 255), # DC4164 open mouth
    'DIM_CYAN': (24, 85, 105, 255),    # 185569 sleeping dim glow
    'DIM_BOLT': (45, 125, 145, 255),   # 2D7D91 sleeping dim bolt
}

# ---------------------------------------------------------------------------
# Helper functions for programmatic pixel art rendering
# ---------------------------------------------------------------------------
def new_canvas(w=64, h=64):
    return np.zeros((h, w, 4), dtype=np.uint8)

def set_px(canvas, x, y, col_name):
    if 0 <= x < canvas.shape[1] and 0 <= y < canvas.shape[0]:
        canvas[y, x] = PALETTE[col_name]

def set_rect(canvas, x1, y1, x2, y2, col_name):
    for y in range(y1, y2 + 1):
        for x in range(x1, x2 + 1):
            set_px(canvas, x, y, col_name)

def apply_rim_outline(canvas, rim_col='RIM_STEEL'):
    """Adds a 1-pixel light rim outline around outer silhouette pixels touching transparency."""
    h, w, _ = canvas.shape
    alpha = canvas[:, :, 3] > 0
    outline_coords = []
    for y in range(h):
        for x in range(w):
            if alpha[y, x]:
                # check 4 neighbors
                is_edge = False
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if ny < 0 or ny >= h or nx < 0 or nx >= w or not alpha[ny, nx]:
                        is_edge = True
                        break
                if is_edge:
                    # check current pixel color: if it is black outline, turn into rim outline
                    curr = tuple(canvas[y, x])
                    if curr == PALETTE['BLACK']:
                        outline_coords.append((x, y))
    for x, y in outline_coords:
        canvas[y, x] = PALETTE[rim_col]

# ---------------------------------------------------------------------------
# Character Base Components (Standing Ninja Cat)
# ---------------------------------------------------------------------------
def draw_cat_head(canvas, cx=32, cy=18, mouth_open=False, eyes_open=True, bolt_bright=True):
    # Ears
    # Left Ear
    for y, (x1, x2) in enumerate([(22, 23), (21, 24), (20, 24), (19, 25), (18, 25), (18, 26), (17, 26)], start=10):
        set_rect(canvas, x1, y, x2, y, 'FUR_DARK')
    # Right Ear
    for y, (x1, x2) in enumerate([(41, 42), (40, 43), (40, 44), (39, 45), (39, 46), (38, 46), (38, 47)], start=10):
        set_rect(canvas, x1, y, x2, y, 'FUR_DARK')
        
    # Ear tips & cyan inner accent
    set_px(canvas, 22, 10, 'RIM_CYAN')
    set_px(canvas, 23, 11, 'CYAN_BRIGHT')
    set_px(canvas, 22, 12, 'CYAN_DEEP')
    set_px(canvas, 23, 13, 'FUR_MID')
    
    set_px(canvas, 42, 10, 'RIM_CYAN')
    set_px(canvas, 41, 11, 'CYAN_BRIGHT')
    set_px(canvas, 42, 12, 'CYAN_DEEP')
    set_px(canvas, 41, 13, 'FUR_MID')

    # Head Dome
    set_rect(canvas, 25, 14, 39, 14, 'BLACK')
    set_rect(canvas, 24, 15, 40, 15, 'FUR_DARK')
    set_rect(canvas, 23, 16, 41, 23, 'FUR_DARK')
    set_rect(canvas, 24, 24, 40, 24, 'FUR_DARK')
    set_rect(canvas, 25, 25, 39, 25, 'BLACK')
    
    # Cheek fur flair
    set_px(canvas, 22, 21, 'FUR_MID')
    set_px(canvas, 21, 22, 'FUR_DARK')
    set_px(canvas, 20, 23, 'BLACK')
    set_px(canvas, 42, 21, 'FUR_MID')
    set_px(canvas, 43, 22, 'FUR_DARK')
    set_px(canvas, 44, 23, 'BLACK')

    # Forehead Lightning Bolt Mark (The defining feature)
    bolt_c1 = 'WHITE_HOT' if bolt_bright else 'DIM_BOLT'
    bolt_c2 = 'CYAN_BRIGHT' if bolt_bright else 'DIM_CYAN'
    bolt_c3 = 'CYAN_WHITE' if bolt_bright else 'DIM_BOLT'
    
    set_px(canvas, cx + 1, cy - 5, bolt_c2)
    set_px(canvas, cx, cy - 4, bolt_c1)
    set_px(canvas, cx + 1, cy - 4, bolt_c3)
    set_px(canvas, cx, cy - 3, bolt_c1)
    set_px(canvas, cx - 1, cy - 2, bolt_c2)
    set_px(canvas, cx, cy - 2, bolt_c1)
    set_px(canvas, cx + 1, cy - 2, bolt_c2)
    set_px(canvas, cx, cy - 1, bolt_c1)
    set_px(canvas, cx - 1, cy, bolt_c2)

    # Eyes
    if eyes_open:
        # Left Eye (glowing cyan with white core)
        set_rect(canvas, cx - 7, cy, cx - 3, cy + 2, 'CYAN_DEEP')
        set_rect(canvas, cx - 6, cy, cx - 4, cy + 1, 'CYAN_BRIGHT')
        set_px(canvas, cx - 5, cy, 'WHITE_HOT')
        set_px(canvas, cx - 6, cy + 1, 'CYAN_WHITE')
        set_px(canvas, cx - 4, cy + 1, 'BLACK') # pupil slit
        
        # Right Eye (glowing cyan with white core)
        set_rect(canvas, cx + 3, cy, cx + 7, cy + 2, 'CYAN_DEEP')
        set_rect(canvas, cx + 4, cy, cx + 6, cy + 1, 'CYAN_BRIGHT')
        set_px(canvas, cx + 5, cy, 'WHITE_HOT')
        set_px(canvas, cx + 4, cy + 1, 'CYAN_WHITE')
        set_px(canvas, cx + 6, cy + 1, 'BLACK') # pupil slit
    else:
        # Sleeping closed eye slits
        set_rect(canvas, cx - 6, cy + 1, cx - 3, cy + 1, 'BLACK')
        set_rect(canvas, cx + 3, cy + 1, cx + 6, cy + 1, 'BLACK')

    # Nose & Muzzle
    set_px(canvas, cx, cy + 3, 'BLACK')
    set_px(canvas, cx - 1, cy + 4, 'FUR_MID')
    set_px(canvas, cx + 1, cy + 4, 'FUR_MID')

    # Mouth
    if mouth_open:
        set_rect(canvas, cx - 1, cy + 5, cx + 1, cy + 6, 'BLACK')
        set_px(canvas, cx, cy + 5, 'MOUTH_PINK')
    else:
        set_px(canvas, cx, cy + 5, 'BLACK')


def draw_cat_body_and_legs(canvas, cx=32):
    # Cyber Scarf / Armored Collar
    set_rect(canvas, cx - 6, 26, cx + 6, 27, 'ARMOR_MID')
    set_rect(canvas, cx - 7, 27, cx + 7, 28, 'ARMOR_DARK')
    set_px(canvas, cx - 6, 26, 'RIM_STEEL')
    set_px(canvas, cx + 6, 26, 'RIM_STEEL')
    set_px(canvas, cx, 27, 'CYAN_DEEP') # collar cyber node

    # Armored Chest Plate
    set_rect(canvas, cx - 5, 29, cx + 5, 34, 'ARMOR_DARK')
    set_rect(canvas, cx - 3, 29, cx + 3, 33, 'ARMOR_MID')
    set_px(canvas, cx - 2, 30, 'ARMOR_LIGHT')
    set_px(canvas, cx + 2, 30, 'ARMOR_LIGHT')
    # Glowing Chest Power Core
    set_rect(canvas, cx - 1, 31, cx + 1, 32, 'CYAN_BRIGHT')
    set_px(canvas, cx, 31, 'WHITE_HOT')

    # Segmented Abdominal Armor
    set_rect(canvas, cx - 4, 35, cx + 4, 36, 'ARMOR_MID')
    set_rect(canvas, cx - 3, 37, cx + 3, 38, 'ARMOR_DARK')
    set_rect(canvas, cx - 4, 39, cx + 4, 40, 'ARMOR_MID')
    set_px(canvas, cx, 39, 'CYAN_DEEP')

    # Belt / Waist
    set_rect(canvas, cx - 5, 41, cx + 5, 42, 'BLACK')
    set_rect(canvas, cx - 2, 41, cx + 2, 42, 'ARMOR_LIGHT')

    # Thighs & Greaves
    # Left Leg
    set_rect(canvas, cx - 6, 43, cx - 2, 47, 'ARMOR_DARK')
    set_rect(canvas, cx - 5, 44, cx - 3, 46, 'ARMOR_MID')
    set_rect(canvas, cx - 7, 48, cx - 3, 53, 'ARMOR_DARK')
    set_rect(canvas, cx - 6, 49, cx - 4, 52, 'ARMOR_MID')
    set_rect(canvas, cx - 8, 54, cx - 3, 56, 'BLACK')
    set_rect(canvas, cx - 7, 56, cx - 4, 57, 'BLACK') # paw
    set_px(canvas, cx - 6, 56, 'FUR_MID')
    set_px(canvas, cx - 4, 56, 'FUR_MID')

    # Right Leg
    set_rect(canvas, cx + 2, 43, cx + 6, 47, 'ARMOR_DARK')
    set_rect(canvas, cx + 3, 44, cx + 5, 46, 'ARMOR_MID')
    set_rect(canvas, cx + 3, 48, cx + 7, 53, 'ARMOR_DARK')
    set_rect(canvas, cx + 4, 49, cx + 6, 52, 'ARMOR_MID')
    set_rect(canvas, cx + 3, 54, cx + 8, 56, 'BLACK')
    set_rect(canvas, cx + 4, 56, cx + 7, 57, 'BLACK') # paw
    set_px(canvas, cx + 4, 56, 'FUR_MID')
    set_px(canvas, cx + 6, 56, 'FUR_MID')


def draw_cat_arms_idle(canvas, cx=32):
    # Shoulders
    set_rect(canvas, cx - 9, 29, cx - 6, 33, 'ARMOR_DARK')
    set_rect(canvas, cx - 8, 29, cx - 6, 31, 'ARMOR_LIGHT')
    set_rect(canvas, cx + 6, 29, cx + 9, 33, 'ARMOR_DARK')
    set_rect(canvas, cx + 6, 29, cx + 8, 31, 'ARMOR_LIGHT')

    # Arms hanging at sides in standing stance
    # Left Arm & Paw
    set_rect(canvas, cx - 9, 34, cx - 7, 39, 'FUR_DARK')
    set_rect(canvas, cx - 10, 40, cx - 7, 44, 'BLACK')
    set_px(canvas, cx - 9, 41, 'ARMOR_MID')
    set_px(canvas, cx - 9, 43, 'FUR_MID')

    # Right Arm & Paw
    set_rect(canvas, cx + 7, 34, cx + 9, 39, 'FUR_DARK')
    set_rect(canvas, cx + 7, 40, cx + 10, 44, 'BLACK')
    set_px(canvas, cx + 9, 41, 'ARMOR_MID')
    set_px(canvas, cx + 9, 43, 'FUR_MID')


def draw_cyber_tail(canvas, cx=32, state='idle'):
    # Tail originates from right hip around (cx+5, 44)
    # Curves up gracefully toward (cx+16, 24)
    if state == 'idle':
        # Upright S-curve tail
        points = [
            (cx + 5, 44, 'BLACK'),
            (cx + 6, 43, 'ARMOR_DARK'),
            (cx + 7, 42, 'ARMOR_DARK'),
            (cx + 8, 40, 'CYAN_DEEP'),
            (cx + 9, 38, 'CYAN_DEEP'),
            (cx + 10, 36, 'CYAN_DEEP'),
            (cx + 11, 34, 'CYAN_BRIGHT'),
            (cx + 12, 32, 'CYAN_BRIGHT'),
            (cx + 13, 30, 'CYAN_BRIGHT'),
            (cx + 14, 28, 'CYAN_BRIGHT'),
            (cx + 15, 26, 'CYAN_WHITE'),
            (cx + 15, 24, 'CYAN_WHITE'),
            (cx + 14, 23, 'WHITE_HOT'),
            (cx + 13, 23, 'CYAN_BRIGHT'),
            (cx + 12, 24, 'CYAN_DEEP'),
        ]
        for x, y, col in points:
            set_px(canvas, x, y, col)
            set_px(canvas, x + 1, y, col)
    elif state == 'thinking':
        # Low thoughtful tail oscillation
        points = [
            (cx + 5, 44, 'BLACK'),
            (cx + 7, 43, 'ARMOR_DARK'),
            (cx + 9, 42, 'CYAN_DEEP'),
            (cx + 11, 40, 'CYAN_DEEP'),
            (cx + 13, 38, 'CYAN_BRIGHT'),
            (cx + 14, 35, 'CYAN_BRIGHT'),
            (cx + 14, 32, 'CYAN_WHITE'),
            (cx + 13, 30, 'WHITE_HOT'),
            (cx + 12, 29, 'CYAN_BRIGHT'),
        ]
        for x, y, col in points:
            set_px(canvas, x, y, col)
            set_px(canvas, x + 1, y, col)
    elif state == 'talking':
        # Energized tail glowing brighter with electric discharge
        points = [
            (cx + 5, 44, 'BLACK'),
            (cx + 7, 42, 'ARMOR_DARK'),
            (cx + 9, 40, 'CYAN_BRIGHT'),
            (cx + 11, 37, 'CYAN_BRIGHT'),
            (cx + 13, 34, 'CYAN_WHITE'),
            (cx + 15, 30, 'CYAN_WHITE'),
            (cx + 16, 26, 'WHITE_HOT'),
            (cx + 16, 23, 'WHITE_HOT'),
            (cx + 15, 21, 'CYAN_WHITE'),
            (cx + 13, 20, 'CYAN_BRIGHT'),
        ]
        for x, y, col in points:
            set_rect(canvas, x - 1, y - 1, x + 1, y + 1, col)
        # Electric discharge spark pixels
        set_px(canvas, cx + 18, 22, 'CYAN_WHITE')
        set_px(canvas, cx + 14, 18, 'CYAN_BRIGHT')
        set_px(canvas, cx + 17, 28, 'CYAN_BRIGHT')


# ---------------------------------------------------------------------------
# 1. FRAME 1: IDLE
# ---------------------------------------------------------------------------
def create_frame_idle():
    canvas = new_canvas(64, 64)
    cx = 32
    draw_cyber_tail(canvas, cx, 'idle')
    draw_cat_body_and_legs(canvas, cx)
    draw_cat_arms_idle(canvas, cx)
    draw_cat_head(canvas, cx, cy=18, mouth_open=False, eyes_open=True, bolt_bright=True)
    apply_rim_outline(canvas, 'RIM_STEEL')
    return canvas


# ---------------------------------------------------------------------------
# 2. FRAME 2: THINKING (Holding glowing holographic screen)
# ---------------------------------------------------------------------------
def create_frame_thinking():
    canvas = new_canvas(64, 64)
    cx = 32
    draw_cyber_tail(canvas, cx, 'thinking')
    draw_cat_body_and_legs(canvas, cx)
    
    # Shoulders
    set_rect(canvas, cx - 9, 29, cx - 6, 33, 'ARMOR_DARK')
    set_rect(canvas, cx - 8, 29, cx - 6, 31, 'ARMOR_LIGHT')
    set_rect(canvas, cx + 6, 29, cx + 9, 33, 'ARMOR_DARK')
    set_rect(canvas, cx + 6, 29, cx + 8, 31, 'ARMOR_LIGHT')

    # Arms brought forward holding holographic screen
    set_rect(canvas, cx - 8, 33, cx - 5, 37, 'ARMOR_DARK')
    set_rect(canvas, cx + 5, 33, cx + 8, 37, 'ARMOR_DARK')
    set_rect(canvas, cx - 6, 38, cx - 4, 40, 'BLACK') # left paw
    set_rect(canvas, cx + 4, 38, cx + 6, 40, 'BLACK') # right paw

    # Glowing Holographic Data Screen held in paws
    # Screen Frame
    set_rect(canvas, cx - 4, 32, cx + 4, 38, 'CYAN_DEEP')
    set_rect(canvas, cx - 3, 33, cx + 3, 37, 'CYAN_BRIGHT')
    set_px(canvas, cx - 4, 32, 'WHITE_HOT')
    set_px(canvas, cx + 4, 32, 'WHITE_HOT')
    set_px(canvas, cx - 4, 38, 'WHITE_HOT')
    set_px(canvas, cx + 4, 38, 'WHITE_HOT')
    # Holographic Screen Data Lines
    set_px(canvas, cx - 2, 34, 'WHITE_HOT')
    set_px(canvas, cx - 1, 34, 'CYAN_WHITE')
    set_px(canvas, cx + 1, 34, 'WHITE_HOT')
    set_px(canvas, cx - 2, 36, 'CYAN_WHITE')
    set_px(canvas, cx, 36, 'WHITE_HOT')
    set_px(canvas, cx + 2, 36, 'WHITE_HOT')

    # Floating data particles above screen
    set_px(canvas, cx + 6, 28, 'CYAN_BRIGHT')
    set_px(canvas, cx + 7, 26, 'WHITE_HOT')

    # Head (thoughtful gaze down toward screen)
    draw_cat_head(canvas, cx, cy=18, mouth_open=False, eyes_open=True, bolt_bright=True)
    apply_rim_outline(canvas, 'RIM_STEEL')
    return canvas


# ---------------------------------------------------------------------------
# 3. FRAME 3: TALKING (Mouth open, tail glowing brighter with electric charge)
# ---------------------------------------------------------------------------
def create_frame_talking():
    canvas = new_canvas(64, 64)
    cx = 32
    draw_cyber_tail(canvas, cx, 'talking')
    draw_cat_body_and_legs(canvas, cx)
    
    # Left arm relaxed, Right arm gesturing slightly
    set_rect(canvas, cx - 9, 29, cx - 6, 33, 'ARMOR_DARK')
    set_rect(canvas, cx - 8, 29, cx - 6, 31, 'ARMOR_LIGHT')
    set_rect(canvas, cx - 9, 34, cx - 7, 39, 'FUR_DARK')
    set_rect(canvas, cx - 10, 40, cx - 7, 44, 'BLACK')
    set_px(canvas, cx - 9, 41, 'ARMOR_MID')

    # Gesturing right arm
    set_rect(canvas, cx + 6, 29, cx + 9, 33, 'ARMOR_DARK')
    set_rect(canvas, cx + 6, 29, cx + 8, 31, 'ARMOR_LIGHT')
    set_rect(canvas, cx + 7, 33, cx + 10, 37, 'ARMOR_DARK')
    set_rect(canvas, cx + 8, 38, cx + 11, 41, 'BLACK') # gesturing paw
    set_px(canvas, cx + 9, 38, 'ARMOR_MID')
    set_px(canvas, cx + 10, 40, 'FUR_MID')

    # Head with open mouth
    draw_cat_head(canvas, cx, cy=18, mouth_open=True, eyes_open=True, bolt_bright=True)
    apply_rim_outline(canvas, 'RIM_STEEL')
    return canvas


# ---------------------------------------------------------------------------
# 4. FRAME 4: ERROR / SLEEPING (Curled up cat loaf/ball, dimmer glow)
# ---------------------------------------------------------------------------
def create_frame_sleeping():
    canvas = new_canvas(64, 64)
    cx = 32
    cy = 48 # resting on floor y=57

    # Curled armored body ball
    set_rect(canvas, cx - 11, cy - 8, cx + 13, cy + 9, 'BLACK')
    set_rect(canvas, cx - 10, cy - 7, cx + 12, cy + 8, 'FUR_DARK')
    
    # Armored back plate curve
    set_rect(canvas, cx - 5, cy - 8, cx + 11, cy - 4, 'ARMOR_DARK')
    set_rect(canvas, cx - 3, cy - 7, cx + 9, cy - 5, 'ARMOR_MID')
    set_px(canvas, cx + 2, cy - 7, 'ARMOR_LIGHT')
    set_px(canvas, cx + 6, cy - 7, 'ARMOR_LIGHT')

    # Curled Head (tucked to the left)
    hx = cx - 5
    hy = cy + 1
    set_rect(canvas, hx - 6, hy - 4, hx + 4, hy + 4, 'FUR_DARK')
    set_rect(canvas, hx - 5, hy - 5, hx + 3, hy - 5, 'BLACK')
    
    # Left Ear folded back
    set_rect(canvas, hx - 8, hy - 5, hx - 6, hy - 3, 'BLACK')
    set_px(canvas, hx - 7, hy - 4, 'FUR_MID')
    
    # Right Ear folded
    set_rect(canvas, hx - 2, hy - 7, hx, hy - 5, 'BLACK')
    set_px(canvas, hx - 1, hy - 6, 'FUR_MID')

    # Dimmed Forehead Lightning Bolt
    set_px(canvas, hx - 1, hy - 2, 'DIM_BOLT')
    set_px(canvas, hx, hy - 2, 'DIM_CYAN')
    set_px(canvas, hx - 1, hy - 1, 'DIM_BOLT')
    set_px(canvas, hx - 2, hy, 'DIM_CYAN')

    # Closed Sleeping Eye Slit
    set_rect(canvas, hx - 3, hy + 2, hx - 1, hy + 2, 'BLACK')

    # Tucked Ninja Paws
    set_rect(canvas, hx + 1, hy + 4, hx + 5, hy + 7, 'BLACK')
    set_px(canvas, hx + 2, hy + 5, 'FUR_MID')
    set_px(canvas, hx + 4, hy + 5, 'FUR_MID')

    # Curled Cyber Tail wrapped around paws with dimmer cyan tip
    tail_pts = [
        (cx + 12, cy + 4, 'BLACK'),
        (cx + 11, cy + 6, 'ARMOR_DARK'),
        (cx + 8, cy + 8, 'DIM_CYAN'),
        (cx + 5, cy + 8, 'DIM_CYAN'),
        (cx + 2, cy + 8, 'DIM_BOLT'),
        (cx - 1, cy + 8, 'DIM_CYAN'),
        (cx - 4, cy + 8, 'DIM_CYAN'),
        (cx - 6, cy + 7, 'DIM_BOLT'),
    ]
    for x, y, col in tail_pts:
        set_rect(canvas, x, y, x + 1, y, col)

    apply_rim_outline(canvas, 'RIM_STEEL')
    return canvas


# ---------------------------------------------------------------------------
# 5. CHAT AVATAR: 32x32 HEAD ONLY CLOSE-UP
# ---------------------------------------------------------------------------
def create_avatar_head_32():
    canvas = new_canvas(32, 32)
    cx = 16
    cy = 16

    # Ears (reaching up to y=2)
    # Left Ear
    for y, (x1, x2) in enumerate([(7, 8), (6, 9), (5, 9), (5, 10), (4, 10), (4, 11)], start=3):
        set_rect(canvas, x1, y, x2, y, 'FUR_DARK')
    # Right Ear
    for y, (x1, x2) in enumerate([(23, 24), (22, 25), (22, 26), (21, 26), (21, 27), (20, 27)], start=3):
        set_rect(canvas, x1, y, x2, y, 'FUR_DARK')

    # Ear electric rims & accents
    set_px(canvas, 7, 3, 'RIM_CYAN')
    set_px(canvas, 8, 4, 'CYAN_BRIGHT')
    set_px(canvas, 7, 5, 'CYAN_DEEP')
    set_px(canvas, 8, 6, 'FUR_MID')

    set_px(canvas, 24, 3, 'RIM_CYAN')
    set_px(canvas, 23, 4, 'CYAN_BRIGHT')
    set_px(canvas, 24, 5, 'CYAN_DEEP')
    set_px(canvas, 23, 6, 'FUR_MID')

    # Head Base
    set_rect(canvas, 10, 8, 21, 8, 'BLACK')
    set_rect(canvas, 8, 9, 23, 10, 'FUR_DARK')
    set_rect(canvas, 6, 11, 25, 20, 'FUR_DARK')
    set_rect(canvas, 8, 21, 23, 23, 'FUR_DARK')
    set_rect(canvas, 10, 24, 21, 25, 'BLACK')

    # Cheek flair
    set_px(canvas, 5, 16, 'FUR_MID')
    set_px(canvas, 4, 17, 'BLACK')
    set_px(canvas, 26, 16, 'FUR_MID')
    set_px(canvas, 27, 17, 'BLACK')

    # Forehead Lightning Bolt Mark (Brightest Element)
    set_px(canvas, cx + 1, cy - 6, 'CYAN_BRIGHT')
    set_px(canvas, cx, cy - 5, 'WHITE_HOT')
    set_px(canvas, cx + 1, cy - 5, 'CYAN_WHITE')
    set_px(canvas, cx, cy - 4, 'WHITE_HOT')
    set_px(canvas, cx - 1, cy - 3, 'CYAN_BRIGHT')
    set_px(canvas, cx, cy - 3, 'WHITE_HOT')
    set_px(canvas, cx + 1, cy - 3, 'CYAN_BRIGHT')
    set_px(canvas, cx, cy - 2, 'WHITE_HOT')
    set_px(canvas, cx - 1, cy - 1, 'CYAN_BRIGHT')

    # Glowing Cyan Eyes with White-Hot Core
    # Left Eye
    set_rect(canvas, cx - 8, cy, cx - 3, cy + 3, 'CYAN_DEEP')
    set_rect(canvas, cx - 7, cy + 1, cx - 4, cy + 2, 'CYAN_BRIGHT')
    set_px(canvas, cx - 6, cy + 1, 'WHITE_HOT')
    set_px(canvas, cx - 7, cy + 2, 'CYAN_WHITE')
    set_px(canvas, cx - 4, cy + 2, 'BLACK') # slit pupil

    # Right Eye
    set_rect(canvas, cx + 3, cy, cx + 8, cy + 3, 'CYAN_DEEP')
    set_rect(canvas, cx + 4, cy + 1, cx + 7, cy + 2, 'CYAN_BRIGHT')
    set_px(canvas, cx + 5, cy + 1, 'WHITE_HOT')
    set_px(canvas, cx + 4, cy + 2, 'CYAN_WHITE')
    set_px(canvas, cx + 7, cy + 2, 'BLACK') # slit pupil

    # Nose & Muzzle
    set_px(canvas, cx, cy + 3, 'BLACK')
    set_px(canvas, cx - 1, cy + 4, 'FUR_MID')
    set_px(canvas, cx + 1, cy + 4, 'FUR_MID')
    set_px(canvas, cx, cy + 5, 'BLACK')

    # Armored Collar at bottom
    set_rect(canvas, cx - 7, 26, cx + 7, 28, 'ARMOR_MID')
    set_rect(canvas, cx - 8, 28, cx + 8, 30, 'ARMOR_DARK')
    set_px(canvas, cx - 7, 26, 'RIM_STEEL')
    set_px(canvas, cx + 7, 26, 'RIM_STEEL')
    set_px(canvas, cx, 27, 'CYAN_BRIGHT') # central collar energy node

    apply_rim_outline(canvas, 'RIM_STEEL')
    return canvas


# ---------------------------------------------------------------------------
# Build & Save All Artifacts
# ---------------------------------------------------------------------------
def main():
    print("Generating clean pixel art sprite sheet and avatar...")
    
    # 1. Generate the 4 frames (64x64)
    f1_idle = create_frame_idle()
    f2_thinking = create_frame_thinking()
    f3_talking = create_frame_talking()
    f4_sleeping = create_frame_sleeping()
    
    img_idle = Image.fromarray(f1_idle, 'RGBA')
    img_thinking = Image.fromarray(f2_thinking, 'RGBA')
    img_talking = Image.fromarray(f3_talking, 'RGBA')
    img_sleeping = Image.fromarray(f4_sleeping, 'RGBA')

    # Save individual 64x64 frame PNGs
    os.makedirs('assets/mascot', exist_ok=True)
    img_idle.save('assets/mascot/sprite_idle_64.png')
    img_thinking.save('assets/mascot/sprite_thinking_64.png')
    img_talking.save('assets/mascot/sprite_talking_64.png')
    img_sleeping.save('assets/mascot/sprite_sleeping_64.png')

    # 2. Build 256x64 Single Row Sprite Sheet (4 frames evenly spaced)
    sheet_256x64 = Image.new('RGBA', (256, 64), (0, 0, 0, 0))
    sheet_256x64.paste(img_idle, (0, 0))
    sheet_256x64.paste(img_thinking, (64, 0))
    sheet_256x64.paste(img_talking, (128, 0))
    sheet_256x64.paste(img_sleeping, (192, 0))

    sheet_path_root = 'raiden_spritesheet_clean_64x64.png'
    sheet_path_assets = 'assets/mascot/raiden_spritesheet_clean_64x64.png'
    sheet_256x64.save(sheet_path_root)
    sheet_256x64.save(sheet_path_assets)
    print(f"[OK] Saved 256x64 sprite sheet to {sheet_path_root} and {sheet_path_assets}")

    # 3. Generate 32x32 Head Avatar Close-up
    avatar_32 = create_avatar_head_32()
    img_avatar = Image.fromarray(avatar_32, 'RGBA')
    
    avatar_path_root = 'raiden_avatar_32x32.png'
    avatar_path_assets = 'assets/mascot/avatar_head_32x32.png'
    avatar_chat = 'assets/raiden_avatar.png'
    img_avatar.save(avatar_path_root)
    img_avatar.save(avatar_path_assets)
    img_avatar.save(avatar_chat)
    print(f"[OK] Saved 32x32 chat avatar to {avatar_path_root} and {avatar_path_assets}")

    # 4. Also provide a 2x scaled preview sheet (512x128) and 4x (1024x256) for crisp high-DPI viewing
    sheet_512x128 = sheet_256x64.resize((512, 128), Image.Resampling.NEAREST)
    sheet_512x128.save('assets/mascot/raiden_spritesheet_512x128_preview.png')

    avatar_128 = img_avatar.resize((128, 128), Image.Resampling.NEAREST)
    avatar_128.save('assets/mascot/raiden_avatar_128x128_preview.png')
    
    print("[OK] All sprite sheets and avatars generated with zero anti-aliasing and 100% transparent backgrounds.")

if __name__ == '__main__':
    main()
