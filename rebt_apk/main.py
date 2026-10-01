import os
import random
import sqlite3

from kivy.app import App
from kivy.core.window import Window
from kivy.metrics import dp
from kivy.graphics import Color, RoundedRectangle
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
from kivy.uix.screenmanager import Screen, ScreenManager, SlideTransition
from kivy.uix.scrollview import ScrollView
from kivy.uix.widget import Widget

Window.clearcolor = (0.96, 0.97, 0.98, 1)

DARK = (0.07, 0.12, 0.16, 1)
WHITE = (1, 1, 1, 1)
INK = (0.10, 0.14, 0.18, 1)
MUTED = (0.40, 0.44, 0.49, 1)
GREEN = (0.10, 0.68, 0.30, 1)
BLUE = (0.08, 0.47, 0.94, 1)

CATEGORIES = [
    ("Todas las categorias", "Repaso general del REBT", (0.22,0.27,0.30,1), "Todas"),
    ("1. Reglamento y generalidades", "RD 842/2002, terminologia y documentacion", (0.95,0.20,0.20,1), "General"),
    ("2. Redes y acometidas", "ITC-BT-06 a ITC-BT-11", (0.98,0.45,0.08,1), "Redes"),
    ("3. Instalaciones de enlace", "CGP, LGA, contadores y derivaciones", (0.98,0.70,0.05,1), "Enlace"),
    ("4. Protecciones y puesta a tierra", "ITC-BT-18, 22, 23 y 24", (0.05,0.66,0.34,1), "Tierra"),
    ("5. Instalaciones interiores", "ITC-BT-19 a 27", (0.05,0.48,0.95,1), "Viviendas"),
    ("6. Locales especiales", "Publica concurrencia, humedos y especiales", (0.50,0.20,0.88,1), "Especiales"),
    ("7. Receptores e instalaciones especiales", "Motores, transformadores y receptores", (0.52,0.30,0.16,1), "Receptores"),
    ("8. Vehiculo electrico", "ITC-BT-52", (0.02,0.66,0.60,1), "VE"),
]

QUESTIONS = [
    ("General","RD 842/2002","Que Real Decreto aprueba el Reglamento Electrotecnico para Baja Tension?",
     ["RD 842/2002","RD 314/2006","RD 1215/1997","RD 1627/1997"],0,
     "El REBT fue aprobado por el Real Decreto 842/2002, de 2 de agosto."),
    ("Redes","ITC-BT-06","Que ITC trata las redes aereas para distribucion en baja tension?",
     ["ITC-BT-06","ITC-BT-07","ITC-BT-11","ITC-BT-18"],0,
     "La ITC-BT-06 corresponde a redes aereas para distribucion en baja tension."),
    ("Redes","ITC-BT-07","Que ITC trata las redes subterraneas para distribucion en baja tension?",
     ["ITC-BT-09","ITC-BT-07","ITC-BT-08","ITC-BT-12"],1,
     "La ITC-BT-07 regula las redes subterraneas para distribucion en baja tension."),
    ("Redes","ITC-BT-11","Que ITC esta dedicada a las acometidas?",
     ["ITC-BT-10","ITC-BT-11","ITC-BT-13","ITC-BT-15"],1,
     "La ITC-BT-11 esta dedicada a las acometidas."),
    ("Enlace","ITC-BT-13","Que ITC regula las Cajas Generales de Proteccion?",
     ["ITC-BT-12","ITC-BT-13","ITC-BT-14","ITC-BT-16"],1,
     "Las Cajas Generales de Proteccion se tratan en la ITC-BT-13."),
    ("Enlace","ITC-BT-14","Que ITC corresponde a la Linea General de Alimentacion?",
     ["ITC-BT-14","ITC-BT-15","ITC-BT-16","ITC-BT-17"],0,
     "La Linea General de Alimentacion se regula en la ITC-BT-14."),
    ("Enlace","ITC-BT-15","Que ITC corresponde a las derivaciones individuales?",
     ["ITC-BT-13","ITC-BT-14","ITC-BT-15","ITC-BT-17"],2,
     "Las derivaciones individuales corresponden a la ITC-BT-15."),
    ("Tierra","ITC-BT-18","Cual es un objetivo esencial de la puesta a tierra?",
     ["Aumentar la potencia disponible","Limitar tensiones peligrosas y facilitar protecciones","Reducir el consumo","Mejorar el factor de potencia"],1,
     "La puesta a tierra limita tensiones peligrosas y favorece la actuacion de las protecciones."),
    ("Viviendas","ITC-BT-19","Que ITC contiene prescripciones generales para instalaciones interiores o receptoras?",
     ["ITC-BT-18","ITC-BT-19","ITC-BT-20","ITC-BT-25"],1,
     "La ITC-BT-19 contiene las prescripciones generales para instalaciones interiores o receptoras."),
    ("Viviendas","ITC-BT-26","Que esquema de distribucion se considera para viviendas alimentadas por red publica de BT?",
     ["TN-C","IT","TT","TN-S obligatorio"],2,
     "La ITC-BT-26 considera el esquema TT en viviendas alimentadas por red publica de baja tension."),
    ("Viviendas","ITC-BT-26","Que tension se considera para una vivienda con alimentacion monofasica?",
     ["127 V","230 V","400 V","500 V"],1,
     "La tension considerada para alimentacion monofasica es 230 V."),
    ("Viviendas","ITC-BT-26","Que tension se considera para alimentacion trifasica de viviendas?",
     ["127/220 V","230/400 V","400/690 V","500/866 V"],1,
     "La tension considerada para alimentacion trifasica es 230/400 V."),
    ("VE","ITC-BT-52","Que ITC regula la infraestructura para la recarga de vehiculos electricos?",
     ["ITC-BT-40","ITC-BT-44","ITC-BT-51","ITC-BT-52"],3,
     "La infraestructura de recarga de vehiculos electricos esta regulada por la ITC-BT-52."),
]

def lab(text, size=18, bold=False, color=INK):
    x = Label(text=text, font_size=dp(size), bold=bold, color=color,
              halign="left", valign="middle", size_hint_y=None)
    x.bind(width=lambda w,v: setattr(w, "text_size", (v, None)))
    x.bind(texture_size=lambda w,v: setattr(w, "height", max(dp(34), v[1] + dp(8))))
    return x

class FlatButton(Button):
    def __init__(self, bg=(1,1,1,1), **kw):
        super().__init__(background_normal="", background_down="", background_color=bg, **kw)

class DB:
    def __init__(self, path):
        self.path = path
        with sqlite3.connect(self.path) as con:
            con.execute("CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY, answered INTEGER, correct INTEGER, best INTEGER)")
            con.execute("INSERT OR IGNORE INTO stats VALUES (1,0,0,0)")
    def get(self):
        with sqlite3.connect(self.path) as con:
            a,c,b = con.execute("SELECT answered,correct,best FROM stats WHERE id=1").fetchone()
        return a,c,b
    def add(self, correct, streak):
        a,c,b = self.get()
        with sqlite3.connect(self.path) as con:
            con.execute("UPDATE stats SET answered=?,correct=?,best=? WHERE id=1",
                        (a+1, c+(1 if correct else 0), max(b,streak)))
    def reset(self):
        with sqlite3.connect(self.path) as con:
            con.execute("UPDATE stats SET answered=0,correct=0,best=0 WHERE id=1")

class Header(BoxLayout):
    def __init__(self, **kw):
        super().__init__(orientation="vertical", size_hint_y=None, height=dp(112), **kw)
        top = BoxLayout(size_hint_y=None, height=dp(64), padding=(dp(10),dp(6)))
        top.add_widget(Label(text="☰", font_size=dp(28), color=WHITE, size_hint_x=.14))
        top.add_widget(Label(text="REBT Cuestionados", font_size=dp(24), bold=True, color=WHITE))
        top.add_widget(Label(text="⚙", font_size=dp(25), color=WHITE, size_hint_x=.14))
        self.add_widget(top)
        self.add_widget(Label(text="Reglamento Electrotecnico de Baja Tension", font_size=dp(14), color=(.8,.84,.88,1)))
        with self.canvas.before:
            Color(*DARK)
            self.bg = RoundedRectangle(pos=self.pos, size=self.size)
        self.bind(pos=self.sync, size=self.sync)
    def sync(self,*_):
        self.bg.pos=self.pos; self.bg.size=self.size

class Home(Screen):
    def __init__(self, app, **kw):
        super().__init__(name="home", **kw)
        root=BoxLayout(orientation="vertical")
        root.add_widget(Header())
        sc=ScrollView()
        box=GridLayout(cols=1, padding=dp(14), spacing=dp(9), size_hint_y=None)
        box.bind(minimum_height=box.setter("height"))
        box.add_widget(lab("SIMULACRO",26,True))
        start=FlatButton(text="Simulacro de examen\nPreguntas de todas las categorias",
                         bg=(.88,.95,1,1), color=INK, bold=True, font_size=dp(18),
                         halign="left", size_hint_y=None, height=dp(82))
        start.bind(size=lambda w,v:setattr(w,"text_size",(v[0]-dp(28),None)))
        start.bind(on_release=lambda *_:app.start_quiz("Todas"))
        box.add_widget(start)
        box.add_widget(lab("CATEGORIAS",26,True))
        for title, sub, color, key in CATEGORIES:
            b=FlatButton(text=f"[b]{title}[/b]\n[size=13sp]{sub}[/size]", markup=True,
                         bg=color, color=WHITE, font_size=dp(17), halign="left",
                         valign="middle", size_hint_y=None, height=dp(76))
            b.bind(size=lambda w,v:setattr(w,"text_size",(v[0]-dp(26),None)))
            b.bind(on_release=lambda _b,k=key:app.start_quiz(k))
            box.add_widget(b)
        sc.add_widget(box); root.add_widget(sc); self.add_widget(root)

class Quiz(Screen):
    def __init__(self, app, **kw):
        super().__init__(name="quiz", **kw); self.app=app
        root=BoxLayout(orientation="vertical")
        root.add_widget(Header())
        sc=ScrollView()
        self.box=GridLayout(cols=1,padding=dp(16),spacing=dp(11),size_hint_y=None)
        self.box.bind(minimum_height=self.box.setter("height"))
        self.meta=lab("Selecciona una categoria",14,True,MUTED)
        self.q=lab("",23,True)
        self.box.add_widget(self.meta); self.box.add_widget(self.q)
        self.answers=GridLayout(cols=1,spacing=dp(9),size_hint_y=None)
        self.answers.bind(minimum_height=self.answers.setter("height"))
        self.box.add_widget(self.answers)
        self.exp=lab("",15,False,INK); self.box.add_widget(self.exp)
        self.next=FlatButton(text="Siguiente pregunta",bg=BLUE,color=WHITE,bold=True,size_hint_y=None,height=dp(55),disabled=True,opacity=0)
        self.next.bind(on_release=lambda *_:app.next_question())
        self.box.add_widget(self.next)
        back=FlatButton(text="Volver a categorias",bg=(.78,.81,.84,1),color=INK,bold=True,size_hint_y=None,height=dp(50))
        back.bind(on_release=lambda *_:app.go("home")); self.box.add_widget(back)
        sc.add_widget(self.box); root.add_widget(sc); self.add_widget(root)
    def render(self, q, pos, total):
        self.meta.text=f"{q[0]} · {q[1]}       Pregunta {pos} de {total}"
        self.q.text=q[2]; self.answers.clear_widgets(); self.exp.text=""
        self.next.disabled=True; self.next.opacity=0
        for i,a in enumerate(q[3]):
            b=FlatButton(text=f"{chr(65+i)})  {a}",bg=WHITE,color=INK,font_size=dp(16),
                         halign="left",valign="middle",size_hint_y=None,height=dp(62))
            b.bind(size=lambda w,v:setattr(w,"text_size",(v[0]-dp(22),None)))
            b.bind(on_release=lambda btn,idx=i:self.app.answer(idx))
            self.answers.add_widget(b)
    def reveal(self, ok, chosen, explanation, ref):
        buttons=list(reversed(self.answers.children))
        for i,b in enumerate(buttons):
            b.disabled=True
            if i==ok: b.background_color=(.16,.72,.35,1); b.color=WHITE
            elif i==chosen: b.background_color=(.87,.20,.17,1); b.color=WHITE
        self.exp.text=f"[b]Explicacion[/b]\n{explanation}\n\n[b]Referencia normativa:[/b] {ref}"
        self.exp.markup=True
        self.next.disabled=False; self.next.opacity=1

class Stats(Screen):
    def __init__(self, app, **kw):
        super().__init__(name="stats", **kw); self.app=app
        root=BoxLayout(orientation="vertical"); root.add_widget(Header())
        box=GridLayout(cols=1,padding=dp(18),spacing=dp(12))
        box.add_widget(lab("PROGRESO",28,True))
        self.a=lab("",24,True); self.c=lab("",24,True); self.p=lab("",24,True); self.b=lab("",24,True)
        for x in (self.a,self.c,self.p,self.b): box.add_widget(x)
        r=FlatButton(text="Reiniciar estadisticas",bg=(.82,.18,.18,1),color=WHITE,bold=True,size_hint_y=None,height=dp(52))
        r.bind(on_release=lambda *_:self.do_reset()); box.add_widget(r); box.add_widget(Widget())
        root.add_widget(box); self.add_widget(root)
    def refresh(self):
        a,c,b=self.app.db.get(); p=round(c*100/a) if a else 0
        self.a.text=f"Respondidas: {a}"; self.c.text=f"Acertadas: {c}"; self.p.text=f"Porcentaje: {p}%"; self.b.text=f"Mejor racha: {b}"
    def do_reset(self):
        self.app.db.reset(); self.app.streak=0; self.refresh()

class REBTApp(App):
    title="REBT Cuestionados"
    def build(self):
        self.db=DB(os.path.join(self.user_data_dir,"rebt.db"))
        self.pool=[]; self.pos=0; self.locked=False; self.streak=0
        self.sm=ScreenManager(transition=SlideTransition(duration=.12))
        self.home=Home(self); self.quiz=Quiz(self); self.stats=Stats(self)
        self.sm.add_widget(self.home); self.sm.add_widget(self.quiz); self.sm.add_widget(self.stats)
        return self.sm
    def go(self,name):
        if name=="stats": self.stats.refresh()
        self.sm.current=name
    def start_quiz(self,cat):
        self.pool=QUESTIONS[:] if cat=="Todas" else [q for q in QUESTIONS if q[0]==cat]
        random.shuffle(self.pool); self.pos=0; self.locked=False
        self.sm.current="quiz"; self.render_question()
    def render_question(self):
        if not self.pool:
            self.quiz.meta.text="Sin preguntas"; self.quiz.q.text="Todavia no hay preguntas en esta categoria."; self.quiz.answers.clear_widgets(); return
        if self.pos>=len(self.pool): self.go("stats"); return
        self.locked=False; self.quiz.render(self.pool[self.pos],self.pos+1,len(self.pool))
    def answer(self,chosen):
        if self.locked: return
        self.locked=True; q=self.pool[self.pos]; correct=chosen==q[4]
        self.streak=self.streak+1 if correct else 0
        self.db.add(correct,self.streak)
        self.quiz.reveal(q[4],chosen,q[5],q[1])
    def next_question(self):
        self.pos+=1; self.render_question()

if __name__=="__main__":
    REBTApp().run()
