"""
Single-page advertisement PDF for the Snake Lab Coding Camp.
Letter size, designed to print on home/office paper.
"""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_LEFT, TA_CENTER

import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "snake-lab-camp.pdf")

# Palette — clean print colors that echo the game's screen palette
GREEN     = HexColor("#22c55e")
GREEN_DK  = HexColor("#15803d")
INK       = HexColor("#0f172a")
INK_MID   = HexColor("#334155")
INK_LIGHT = HexColor("#64748b")
BG_TINT   = HexColor("#f0fdf4")
ACCENT    = HexColor("#fbbf24")  # yellow for the bonus day
BORDER    = HexColor("#e2e8f0")

PAGE_W, PAGE_H = LETTER

c = canvas.Canvas(OUT, pagesize=LETTER)

# ---- Top color band ----
c.setFillColor(GREEN)
c.rect(0, PAGE_H - 1.1*inch, PAGE_W, 1.1*inch, fill=1, stroke=0)

# Snake glyph (drawn from circles)
def draw_snake_icon(x, y, scale=1.0):
    s = scale
    c.setFillColor(HexColor("#16a34a"))
    # body
    for i, (dx, dy) in enumerate([(0,0),(14,0),(28,0),(42,2),(54,10),(60,22),(58,34),(48,42),(34,44),(22,42),(14,36),(12,28)]):
        r = 10*s if i == 0 else 9*s
        c.circle(x + dx*s, y + dy*s, r, fill=1, stroke=0)
    # head highlight (eye)
    c.setFillColor(HexColor("#0f172a"))
    c.circle(x + 6*s, y - 2*s, 1.8*s, fill=1, stroke=0)
    c.circle(x + 6*s, y + 4*s, 1.8*s, fill=1, stroke=0)

draw_snake_icon(0.6*inch, PAGE_H - 0.65*inch, scale=0.9)

# ---- Title ----
c.setFillColor(HexColor("#ffffff"))
c.setFont("Helvetica-Bold", 36)
c.drawString(1.85*inch, PAGE_H - 0.55*inch, "Snake Lab")
c.setFont("Helvetica", 14)
c.drawString(1.85*inch, PAGE_H - 0.85*inch, "Coding Camp for Kids · 3 days + bonus Saturday")

# ---- Hero pitch ----
y = PAGE_H - 1.55*inch
c.setFillColor(INK)
c.setFont("Helvetica-Bold", 18)
c.drawString(0.6*inch, y, "Build, code, and battle your own snake game.")
y -= 0.30*inch

styles = getSampleStyleSheet()
body_style = ParagraphStyle('body', parent=styles['Normal'],
    fontName='Helvetica', fontSize=11, leading=15, textColor=INK_MID,
    alignment=TA_LEFT, leftIndent=0)

hero = Paragraph(
    "In one week, kids go from playing a classic single-player snake "
    "to writing a JavaScript bot that competes head-to-head against "
    "their friends' bots in a tournament. They <b>build with AI</b> "
    "(Claude as a coding partner), <b>think like AI</b> (design strategies as "
    "tunable numbers), and <b>watch AI learn</b> (a tiny bot that gets smarter "
    "every round). Real code. Real servers. Real games they can keep playing at home.",
    body_style)
hero.wrapOn(c, PAGE_W - 1.2*inch, 1.4*inch)
hero.drawOn(c, 0.6*inch, y - 0.95*inch)
y -= 1.20*inch

# ---- Curriculum table ----
c.setFillColor(INK)
c.setFont("Helvetica-Bold", 13)
c.drawString(0.6*inch, y, "What kids learn, day by day")
y -= 0.18*inch
c.setStrokeColor(GREEN); c.setLineWidth(1.5)
c.line(0.6*inch, y, 3.2*inch, y)
y -= 0.20*inch

curriculum = [
    ("Day 1 — Hello Snake",
     "Build a classic snake game. Discover that 'the snake' is just a list in memory; "
     "what a game loop is; how code becomes pixels on screen. Fast warm-up day."),
    ("Day 2 — Snake Arena + Hello, AI",
     "Multiplayer. See what a server is and what a WebSocket carries. "
     "Then meet your AI coding partner — kids ask Claude to read and explain "
     "bot code, find bugs, and write a first draft together."),
    ("Day 3 — Code Your Snake (with strategy & learning)",
     "Morning: tune a strategy bot by hand — food vs safety vs blocking — "
     "and meet the bot that learns by itself (Q-learning, the same idea behind real ML). "
     "Afternoon: tournament. Best bot wins. Parents invited."),
    ("Saturday (bonus) — Family Day",
     "King-mode (snake eats snake) and fog-of-war tournaments. "
     "Parents play too. Kids show off the code they wrote on Day 3."),
]

def draw_day_row(label, desc, label_color):
    """Returns the new y position after drawing."""
    global y
    c.setFillColor(label_color)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.6*inch, y, label)
    desc_style = ParagraphStyle('desc', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=13, textColor=INK_MID)
    p = Paragraph(desc, desc_style)
    w, h = p.wrap(PAGE_W - 1.2*inch, 1*inch)
    p.drawOn(c, 0.6*inch, y - 0.18*inch - h + 0.13*inch)
    y -= 0.16*inch + h + 0.06*inch

# All three weekday rows get GREEN labels; Saturday gets ACCENT
for i, (label, desc) in enumerate(curriculum):
    color = ACCENT if i == 3 else GREEN_DK
    draw_day_row(label, desc, color)

y -= 0.05*inch

# ---- What they leave with ----
c.setFillColor(INK)
c.setFont("Helvetica-Bold", 13)
c.drawString(0.6*inch, y, "What every kid leaves with")
y -= 0.18*inch
c.setStrokeColor(GREEN); c.setLineWidth(1.5)
c.line(0.6*inch, y, 3.2*inch, y)
y -= 0.22*inch

takeaways = [
    "Three games they helped build, live online so they can keep playing at home",
    "A working JavaScript bot they wrote themselves — and one a Q-learning bot 'trained'",
    "Hands-on experience using AI (Claude / ChatGPT) as a coding partner — not as a magic-answer button",
    "Intuition for how AI learns: state, action, reward, repeat. The real loop, demystified.",
    "Confidence that 'code' is something they can write — not just consume",
]
c.setFont("Helvetica", 10.5)
c.setFillColor(INK_MID)
for t in takeaways:
    c.setFillColor(GREEN)
    c.circle(0.72*inch, y + 3, 3, fill=1, stroke=0)
    c.setFillColor(INK_MID)
    c.drawString(0.85*inch, y, t)
    y -= 0.20*inch

y -= 0.05*inch

# ---- Logistics box ----
box_top = y
box_height = 1.45*inch
c.setFillColor(BG_TINT)
c.setStrokeColor(GREEN)
c.setLineWidth(1.5)
c.roundRect(0.6*inch, box_top - box_height, PAGE_W - 1.2*inch, box_height, 8, fill=1, stroke=1)

# Logistics grid — two columns
col1_x = 0.85*inch
col2_x = PAGE_W / 2 + 0.1*inch
row_y = box_top - 0.30*inch

def field(x, y, label, value, value_bold=False):
    c.setFillColor(INK_LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x, y, label.upper())
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold" if value_bold else "Helvetica", 11.5)
    c.drawString(x, y - 0.18*inch, value)

field(col1_x, row_y, "Ages", "9 and up")
field(col2_x, row_y, "Class size", "Up to 8 kids")
row_y -= 0.42*inch
field(col1_x, row_y, "Dates",     "To be announced (first trial run)")
field(col2_x, row_y, "Price",     "$120 – $150 · lunch included", value_bold=True)
row_y -= 0.42*inch
field(col1_x, row_y, "Bring",     "Just an iPad or laptop")
field(col2_x, row_y, "Location",  "TBA")

y = box_top - box_height - 0.20*inch

# ---- "Please note" box ----
note_top = y
note_height = 0.95*inch
NOTE_BG = HexColor("#fefce8")     # very light yellow
NOTE_BORDER = HexColor("#fde68a")
c.setFillColor(NOTE_BG)
c.setStrokeColor(NOTE_BORDER)
c.setLineWidth(1)
c.roundRect(0.6*inch, note_top - note_height, PAGE_W - 1.2*inch, note_height, 6, fill=1, stroke=1)

c.setFillColor(HexColor("#92400e"))
c.setFont("Helvetica-Bold", 10)
c.drawString(0.8*inch, note_top - 0.25*inch, "PLEASE NOTE")

note_style = ParagraphStyle('note', parent=styles['Normal'],
    fontName='Helvetica', fontSize=9.5, leading=12.5, textColor=HexColor("#78350f"))

notes = [
    "This is a <b>small, private kids activity camp</b> organized for friends — not a public program.",
    "Parents sign a simple waiver and provide emergency contact + allergy information.",
    "Spots are limited to keep things safe and manageable.",
]
ny = note_top - 0.42*inch
for n in notes:
    c.setFillColor(HexColor("#a16207"))
    c.circle(0.86*inch, ny + 3, 2, fill=1, stroke=0)
    p = Paragraph(n, note_style)
    w, h = p.wrap(PAGE_W - 1.5*inch, 0.5*inch)
    p.drawOn(c, 0.98*inch, ny - h + 0.10*inch)
    ny -= 0.20*inch

y = note_top - note_height - 0.18*inch

# ---- Sign-up / Footer ----
c.setFillColor(INK)
c.setFont("Helvetica-Bold", 11)
c.drawString(0.6*inch, y, "Interested?")
c.setFont("Helvetica", 10.5)
c.setFillColor(INK_MID)
c.drawString(0.6*inch, y - 0.18*inch, "Email yancyqin@gmail.com to hold a spot or ask questions.")

y -= 0.50*inch

# Footer with URLs
c.setStrokeColor(BORDER)
c.setLineWidth(0.5)
c.line(0.6*inch, y, PAGE_W - 0.6*inch, y)
y -= 0.20*inch

c.setFillColor(INK_LIGHT)
c.setFont("Helvetica", 9)
c.drawString(0.6*inch, y, "Play the games:")
c.setFillColor(GREEN_DK)
c.setFont("Helvetica-Bold", 9)
c.drawString(1.5*inch, y, "yancyqin.github.io/snake-lab")
c.setFillColor(INK_LIGHT)
c.setFont("Helvetica", 9)
c.drawString(0.6*inch, y - 0.14*inch, "Source code:")
c.setFillColor(GREEN_DK)
c.setFont("Helvetica-Bold", 9)
c.drawString(1.5*inch, y - 0.14*inch, "github.com/yancyqin/snake-lab")

# Small "built by" credit on the right
c.setFillColor(INK_LIGHT)
c.setFont("Helvetica-Oblique", 8.5)
c.drawRightString(PAGE_W - 0.6*inch, y - 0.07*inch, "Built by a kid + dad + AI. Same teaching pattern as Lucas Game.")

c.save()
print(f"Wrote {OUT}")
