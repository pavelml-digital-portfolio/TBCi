from pathlib import Path
import re,html,subprocess,json
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn
O=Path(__file__).resolve().parents[1]/'docs/specification';B=O.parent/'brand'
for n,f in [('OS','Regular'),('OSS','Semibold'),('OSB','Bold')]:pdfmetrics.registerFont(TTFont(n,str(B/f'fonts/OpenSans-{f}.ttf')))
pdfmetrics.registerFont(TTFont('DVS','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
from fontTools.ttLib import TTFont as FFont
cmap=FFont(str(B/'fonts/OpenSans-Regular.ttf')).getBestCmap()
styles={'p':ParagraphStyle('p',fontName='OS',fontSize=10,leading=15.3,spaceAfter=9,textColor=HexColor('#102441')),'h1':ParagraphStyle('h1',fontName='OSS',fontSize=25,leading=33,spaceAfter=19,textColor=HexColor('#102441')),'h2':ParagraphStyle('h2',fontName='OSS',fontSize=16,leading=22,spaceBefore=18,spaceAfter=10,keepWithNext=True,textColor=HexColor('#0B3559')),'h3':ParagraphStyle('h3',fontName='OSS',fontSize=12,leading=18,spaceBefore=13,spaceAfter=9,keepWithNext=True,textColor=HexColor('#0B3559')),'cell':ParagraphStyle('cell',fontName='OS',fontSize=8.0,leading=11.5,textColor=HexColor('#102441')),'bullet':ParagraphStyle('bullet',fontName='OS',fontSize=10,leading=15.3,leftIndent=13,firstLineIndent=-10,spaceAfter=7,textColor=HexColor('#102441')),'code':ParagraphStyle('code',fontName='OS',fontSize=8,leading=12,spaceAfter=7,textColor=HexColor('#0B3559'))}
def inline(s):
 s=html.escape(s);s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'\1',s);s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s);s=re.sub(r'`([^`]+)`',r'\1',s)
 return ''.join('<font name="DVS">'+ch+'</font>' if ord(ch)>32 and ord(ch) not in cmap and ch not in '<>' else ch for ch in s)
class Doc(SimpleDocTemplate):
 def afterFlowable(self,f):
  if isinstance(f,Paragraph) and f.style.name in ['h2','h3']:
   level=0 if f.style.name=='h2' else 1;key=f'toc-{getattr(f,"_anchor",id(f))}';self.canv.bookmarkPage(key);self.canv.addOutlineEntry(f.getPlainText(),key,level);self.notify('TOCEntry',(level,f.getPlainText(),self.page,key))
W,H=A4

def footer(c,d):
 if d.page==1:return
 c.setStrokeColor(HexColor('#A8BBD2'));c.line(48,37,W-48,37);c.setFillColor(HexColor('#37546C'));c.setFont('OS',8);c.drawString(48,24,'TBCi / техническое задание v2.0 / 30.10.2026');c.drawRightString(W-48,24,str(d.page))
def cover(c,d):
 c.setFillColor(HexColor('#070A22'));c.rect(0,0,W,H,fill=1,stroke=0);c.setFillColor(HexColor('#F2F7FB'));c.setFont('OSB',52);c.drawString(48,H-120,'TBC');c.setFillColor(HexColor('#00CDEB'));c.drawString(48+pdfmetrics.stringWidth('TBC','OSB',52)-2,H-120,'i');c.setFillColor(HexColor('#F2F7FB'));c.setFont('OS',30);c.drawString(48,H-267,'Техническое задание');c.drawString(48,H-309,'на разработку сервиса');c.setFillColor(HexColor('#00CDEB'));c.setFont('OSS',13);c.drawString(48,H-373,'v2.0 / проект / 30 октября 2026');c.setFillColor(HexColor('#A8BBD2'));c.setFont('OS',11)
 for i,t in enumerate(['Индекс и рыночные данные. Личный кабинет.','Кошельки и учёт. Покупка, продажа, эмиссия и погашение.','Экранные требования, расчёты, эксплуатация и приёмка.']):c.drawString(48,H-433-i*24,t)
 c.setFont('OS',10);c.drawString(48,110,'21 исходный экран / 184 требования / 50 критериев');c.drawString(48,86,'Визуальная основа: TBCI.rar / 12 публичных + 9 ЛК')
story=[Spacer(1,100),PageBreak(),Paragraph('Содержание',styles['h1'])]
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc0',fontName='OS',fontSize=9.7,leading=15.2,spaceBefore=4,leftIndent=0,firstLineIndent=0),ParagraphStyle('toc1',fontName='OS',fontSize=8.5,leading=13,leftIndent=15,spaceBefore=1)];story += [toc,PageBreak()]
lines=(O/'TECHNICAL_SPEC.md').read_text().splitlines();i=0;anchor=0
while i<len(lines):
 s=lines[i].strip()
 if not s:i+=1;continue
 if s.startswith('# '):i+=1;continue
 if s.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].strip().startswith('|'):
   vals=[x.strip() for x in lines[i].strip().strip('|').split('|')]
   if not all(re.fullmatch(r'[:\-\s]+',x) for x in vals):rows.append(vals)
   i+=1
  n=len(rows[0]);ids=rows[0][0] in ['ID']
  if n==2:widths=[.31,.69]
  elif n==3:widths=[.13,.45,.42] if ids else [.24,.38,.38]
  elif n==4:widths=[.10,.24,.41,.25] if ids else [.20,.23,.28,.29]
  else:widths=[1/n]*n
  data=[[Paragraph(inline(v),styles['cell']) for v in r] for r in rows]
  t=Table(data,colWidths=[x*(W-96) for x in widths],repeatRows=1,hAlign='LEFT')
  t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),HexColor('#E5F2F7')),('GRID',(0,0),(-1,-1),.3,HexColor('#A8BBD2')),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));story += [t,Spacer(1,9)];continue
  
 if s.startswith('### '):st='h3';s=s[4:]
 elif s.startswith('## '):st='h2';s=s[3:]
 elif s.startswith('- '):st='bullet';s='• '+s[2:]
 else:st='p'
 q=Paragraph(inline(s),styles[st]);q._anchor=anchor;anchor+=1;story.append(q);i+=1
from reportlab.platypus import Image as PDFImage
from PIL import Image as PILImage
for screen in json.loads((O/'screens.json').read_text()):
 story += [PageBreak(),Paragraph(screen['id']+' — '+screen['title'],styles['h2']),Paragraph(inline(screen['source']+' / '+screen['route']),styles['p'])]
 pic=O/screen['image'];iw,ih=PILImage.open(pic).size;scale=min((W-110)/iw,(H-230)/ih)
 story.append(PDFImage(str(pic),width=iw*scale,height=ih*scale));story.append(Spacer(1,8));story.append(Paragraph('Канонический исходный JPG; не браузерная реализация.',styles['cell']))
Doc(str(O/'TBCi-Technical-Specification.pdf'),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=45,bottomMargin=52,title='TBCi — техническое задание v2.0',author='TBCi').multiBuild(story,onFirstPage=cover,onLaterPages=footer)
# Editable Word document with actual Open Sans styles.
subprocess.run(['pandoc',str(O/'TECHNICAL_SPEC.md'),'-f','gfm','--toc','--toc-depth=2','-o',str(O/'TBCi-Technical-Specification.docx')],check=True)
d=Document(O/'TBCi-Technical-Specification.docx')
for st in d.styles:
 if st.type not in [1,2]:continue
 st.font.name='Open Sans';rp=st.element.get_or_add_rPr();rf=rp.find(qn('w:rFonts'))
 if rf is not None:
  for k in ['ascii','hAnsi','cs','eastAsia']:rf.set(qn('w:'+k),'Open Sans')
 if st.name=='Normal':st.font.size=Pt(10.5)
 if st.name.startswith('Heading'):st.font.bold=True
for table in d.tables:
 for row in table.rows:
  for cell in row.cells:
   for par in cell.paragraphs:
    for run in par.runs:run.font.name='Open Sans';run.font.size=Pt(8.5)
from docx.shared import Inches
for screen in json.loads((O/'screens.json').read_text()):
 d.add_page_break();d.add_paragraph(screen['id']+' — '+screen['title'],style=next(st for st in d.styles if st.style_id=='Heading1'));d.add_paragraph(screen['source']+' / '+screen['route']);pic=O/screen['image'];iw,ih=PILImage.open(pic).size;scale=min(6/iw,8/ih);d.add_picture(str(pic),width=Inches(iw*scale),height=Inches(ih*scale))
d.save(O/'TBCi-Technical-Specification.docx')
for name in ['TECHNICAL_SPEC','DATA_MODEL','ARCHITECTURE']:
 body=subprocess.check_output(['pandoc',str(O/(name+'.md')),'-f','gfm','-t','html5','--toc','--toc-depth=2','--wrap=none'],text=True)
 body=re.sub(r'(<table(?:\s[^>]*)?>)',r'<div class="table-wrap" tabindex="0" role="region" aria-label="Таблица">\1',body).replace('</table>','</table></div>')
 body=body.replace('href="DATA_MODEL.md"','href="DATA_MODEL.html"').replace('href="ARCHITECTURE.md"','href="ARCHITECTURE.html"')
 (O/(name+'.html')).write_text('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TBCi — '+name+'</title><link rel="stylesheet" href="../brand/theme.css"><style>main{min-width:0;overflow-wrap:anywhere}.table-wrap{width:100%;max-width:100%;min-width:0}nav{min-width:0}nav a{max-width:100%;overflow-wrap:anywhere}</style></head><body><nav><a href="../index.html">Комплект</a><a href="index.html">Техническое задание</a><a href="TBCi-Technical-Specification.pdf">PDF</a><a href="openapi.yaml">OpenAPI</a></nav><main>'+body+'</main></body></html>')
print('PDF, DOCX, HTML exported')
