"""
Snake Lab 编程营 1 页招生宣传单 — 中文(简体)版。
Letter 尺寸,与 make_flyer.py 共用同一套版式。

字体说明:
  - 使用 reportlab 内置的 STSong-Light(CIDFont)显示中文,无需额外安装字体。
  - STSong-Light 没有官方的粗体变体,因此正文里的重点用深绿色突出,而非加粗。
  - 标题 "Snake Lab" 保留英文(Helvetica-Bold)作为品牌字标。
"""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "snake-lab-camp-zh.pdf")

# 注册内置中文字体(简体宋体)
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
CN = "STSong-Light"

# 与英文版完全一致的配色
GREEN     = HexColor("#22c55e")
GREEN_DK  = HexColor("#15803d")
INK       = HexColor("#0f172a")
INK_MID   = HexColor("#334155")
INK_LIGHT = HexColor("#64748b")
BG_TINT   = HexColor("#f0fdf4")
ACCENT    = HexColor("#fbbf24")  # 周六(加场日)用的金黄色
BORDER    = HexColor("#e2e8f0")
HILIGHT   = HexColor("#15803d")  # 正文里的中文「粗体」用深绿色代替

PAGE_W, PAGE_H = LETTER

c = canvas.Canvas(OUT, pagesize=LETTER)

# ---- 顶部色带 ----
c.setFillColor(GREEN)
c.rect(0, PAGE_H - 1.1*inch, PAGE_W, 1.1*inch, fill=1, stroke=0)

# 蛇形图标(由圆形拼出来)
def draw_snake_icon(x, y, scale=1.0):
    s = scale
    c.setFillColor(HexColor("#16a34a"))
    for i, (dx, dy) in enumerate([(0,0),(14,0),(28,0),(42,2),(54,10),(60,22),(58,34),(48,42),(34,44),(22,42),(14,36),(12,28)]):
        r = 10*s if i == 0 else 9*s
        c.circle(x + dx*s, y + dy*s, r, fill=1, stroke=0)
    c.setFillColor(HexColor("#0f172a"))
    c.circle(x + 6*s, y - 2*s, 1.8*s, fill=1, stroke=0)
    c.circle(x + 6*s, y + 4*s, 1.8*s, fill=1, stroke=0)

draw_snake_icon(0.6*inch, PAGE_H - 0.65*inch, scale=0.9)

# ---- 标题 ----
c.setFillColor(HexColor("#ffffff"))
c.setFont("Helvetica-Bold", 36)
c.drawString(1.85*inch, PAGE_H - 0.55*inch, "Snake Lab")
c.setFont(CN, 14)
c.drawString(1.85*inch, PAGE_H - 0.85*inch, "儿童编程营 — 3 天 + 周六加场")

# ---- 主推语 ----
y = PAGE_H - 1.55*inch
c.setFillColor(INK)
c.setFont(CN, 18)
c.drawString(0.6*inch, y, "动手打造、亲笔编写、并在赛场上对战属于你的贪吃蛇。")
y -= 0.30*inch

styles = getSampleStyleSheet()
body_style = ParagraphStyle('body', parent=styles['Normal'],
    fontName=CN, fontSize=11, leading=16, textColor=INK_MID,
    alignment=TA_LEFT, leftIndent=0, wordWrap='CJK')

hero = Paragraph(
    '一周时间,孩子们从玩经典单人贪吃蛇,到亲手用 JavaScript 编写自己的机器人,'
    '在赛场上与小伙伴的机器人正面对战。他们会 '
    f'<font color="#15803d">用 AI 共同编程</font>(把 Claude 当成编程伙伴)、'
    f'<font color="#15803d">像 AI 一样思考</font>(用可调参数设计游戏策略)、'
    f'<font color="#15803d">看 AI 自主学习</font>(一个每局都会变聪明的小机器人)。'
    '真代码、真服务器、真比赛 —— 回家之后还能继续玩。',
    body_style)
hero.wrapOn(c, PAGE_W - 1.2*inch, 1.6*inch)
hero.drawOn(c, 0.6*inch, y - 1.20*inch)
y -= 1.40*inch

# ---- 课程表 ----
c.setFillColor(INK)
c.setFont(CN, 13)
c.drawString(0.6*inch, y, "每天学什么")
y -= 0.18*inch
c.setStrokeColor(GREEN); c.setLineWidth(1.5)
c.line(0.6*inch, y, 2.4*inch, y)
y -= 0.20*inch

curriculum = [
    ('第 1 天 — 打基础',
     '上午:打造一个经典贪吃蛇 —— 发现「蛇」其实只是内存里的一个列表,'
     '认识游戏循环。下午:多人对战 —— 认识服务器、WebSocket、机器人的「大脑」。'
     '小伙伴上线的消息会实时滚过老师的终端。'),
    ('第 2 天 — 机器人 + AI',
     '上午 — Hello, AI:认识你的编程伙伴(Claude / ChatGPT)。'
     '孩子让 AI 解释代码、找出 Bug,并协同写出第一版机器人。'
     '下午 — 策略:用四个权重(食物、安全、阻拦、空间)亲手调试一个真正的策略机器人。'),
    ('第 3 天 — 自主学习 + 锦标赛',
     '上午:观察一个会自我学习的机器人,一局比一局变聪明'
     '(Q-learning —— 真正的强化学习思想)。下午:锦标赛,最强机器人获胜。家长受邀观赛。'),
    ('周六加场 — 家庭日',
     '国王模式(大蛇吃小蛇)与战争迷雾模式锦标赛。'
     '家长一起上场,孩子展示第 3 天写的代码。'),
]

def draw_day_row(label, desc, label_color):
    global y
    c.setFillColor(label_color)
    c.setFont(CN, 11)
    c.drawString(0.6*inch, y, label)
    desc_style = ParagraphStyle('desc', parent=styles['Normal'],
        fontName=CN, fontSize=10, leading=14, textColor=INK_MID, wordWrap='CJK')
    p = Paragraph(desc, desc_style)
    w, h = p.wrap(PAGE_W - 1.2*inch, 1.2*inch)
    p.drawOn(c, 0.6*inch, y - 0.18*inch - h + 0.13*inch)
    y -= 0.16*inch + h + 0.06*inch

for i, (label, desc) in enumerate(curriculum):
    color = ACCENT if i == 3 else GREEN_DK
    draw_day_row(label, desc, color)

y -= 0.05*inch

# ---- 孩子带回家什么 ----
c.setFillColor(INK)
c.setFont(CN, 13)
c.drawString(0.6*inch, y, "每个孩子带回家的收获")
y -= 0.18*inch
c.setStrokeColor(GREEN); c.setLineWidth(1.5)
c.line(0.6*inch, y, 2.8*inch, y)
y -= 0.22*inch

takeaways = [
    "三款亲手打造的游戏,部署在网上,回家也能继续玩。",
    "一个亲手写的 JavaScript 机器人,以及一个用 Q-learning 训练出来的机器人。",
    "亲身体验把 AI(Claude / ChatGPT)当作编程伙伴 —— 不是「一键出答案」的魔法按钮。",
    "对 AI 如何学习建立直觉:状态、动作、奖励、循环 —— 真正的学习闭环,不再神秘。",
    "明白「代码」是自己能写出来的东西,不只是用来消费的。",
]
c.setFont(CN, 10.5)
c.setFillColor(INK_MID)
for t in takeaways:
    c.setFillColor(GREEN)
    c.circle(0.72*inch, y + 3, 3, fill=1, stroke=0)
    c.setFillColor(INK_MID)
    c.setFont(CN, 10.5)
    c.drawString(0.85*inch, y, t)
    y -= 0.20*inch

y -= 0.05*inch

# ---- 营地信息(浅绿色框) ----
box_top = y
box_height = 1.45*inch
c.setFillColor(BG_TINT)
c.setStrokeColor(GREEN)
c.setLineWidth(1.5)
c.roundRect(0.6*inch, box_top - box_height, PAGE_W - 1.2*inch, box_height, 8, fill=1, stroke=1)

col1_x = 0.85*inch
col2_x = PAGE_W / 2 + 0.1*inch
row_y = box_top - 0.30*inch

def field(x, y, label, value, value_bold=False):
    c.setFillColor(INK_LIGHT)
    c.setFont(CN, 9)
    c.drawString(x, y, label)
    c.setFillColor(INK)
    # STSong-Light 没有粗体;用同字体描两遍模拟微弱加粗,或仅放大颜色对比即可
    c.setFont(CN, 11.5)
    c.drawString(x, y - 0.18*inch, value)

field(col1_x, row_y, "年龄",       "9 岁及以上")
field(col2_x, row_y, "班级人数",   "最多 8 名孩子")
row_y -= 0.42*inch
field(col1_x, row_y, "日期",       "2026 年 6 月 24 – 26 日(周三 – 周五)", value_bold=True)
field(col2_x, row_y, "费用",       "$120 – $150,含午餐", value_bold=True)
row_y -= 0.42*inch
field(col1_x, row_y, "需要携带",   "一台 iPad 或笔记本即可")
field(col2_x, row_y, "地点",       "Yancy 家")

y = box_top - box_height - 0.20*inch

# ---- 「请留意」提示框 ----
note_top = y
note_height = 1.00*inch
NOTE_BG = HexColor("#fefce8")
NOTE_BORDER = HexColor("#fde68a")
c.setFillColor(NOTE_BG)
c.setStrokeColor(NOTE_BORDER)
c.setLineWidth(1)
c.roundRect(0.6*inch, note_top - note_height, PAGE_W - 1.2*inch, note_height, 6, fill=1, stroke=1)

c.setFillColor(HexColor("#92400e"))
c.setFont(CN, 10)
c.drawString(0.8*inch, note_top - 0.25*inch, "请留意")

note_style = ParagraphStyle('note', parent=styles['Normal'],
    fontName=CN, fontSize=9.5, leading=13, textColor=HexColor("#78350f"), wordWrap='CJK')

notes = [
    '这是一个<font color="#92400e">面向朋友家孩子的小型私人活动营</font>,不对外公开招生。',
    "家长会被请签一份简单的免责同意书,并提供紧急联系人与过敏信息。",
    "为保证活动安全有序,名额十分有限。",
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

# ---- 报名 / 页脚 ----
c.setFillColor(INK)
c.setFont(CN, 11)
c.drawString(0.6*inch, y, "感兴趣?")
c.setFont(CN, 10.5)
c.setFillColor(INK_MID)
c.drawString(0.6*inch, y - 0.18*inch, "发邮件到 yancyqin@gmail.com 预约名额或咨询。")

y -= 0.50*inch

# 页脚分隔线
c.setStrokeColor(BORDER)
c.setLineWidth(0.5)
c.line(0.6*inch, y, PAGE_W - 0.6*inch, y)
y -= 0.20*inch

c.setFillColor(INK_LIGHT)
c.setFont(CN, 9)
c.drawString(0.6*inch, y, "在线试玩:")
c.setFillColor(GREEN_DK)
c.setFont("Helvetica-Bold", 9)
c.drawString(1.5*inch, y, "yancyqin.github.io/snake-lab")
c.setFillColor(INK_LIGHT)
c.setFont(CN, 9)
c.drawString(0.6*inch, y - 0.14*inch, "源代码:")
c.setFillColor(GREEN_DK)
c.setFont("Helvetica-Bold", 9)
c.drawString(1.5*inch, y - 0.14*inch, "github.com/yancyqin/snake-lab")

# 右侧署名
c.setFillColor(INK_LIGHT)
c.setFont(CN, 8.5)
c.drawRightString(PAGE_W - 0.6*inch, y - 0.07*inch, "由一个孩子 + 爸爸 + AI 共同打造。沿用 Lucas Game 的教学方法。")

c.save()
print(f"Wrote {OUT}")
