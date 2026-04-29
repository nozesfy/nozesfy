import webview # Biblioteca para criar janelas de navegador (WebView)
import tkinter as tk # Biblioteca para interface gráfica nativa do Python (usada na Splash Screen)
from PIL import Image, ImageTk # Biblioteca para processamento e exibição de imagens
import os # Biblioteca para manipulação de caminhos e sistema de arquivos
import sys # Biblioteca para parâmetros e funções específicas do sistema
import ctypes # Biblioteca para chamar funções de bibliotecas C (usada para DPI no Windows)
import platform # Biblioteca para identificar o sistema operacional

# Configuração para evitar que a janela e o ícone fiquem borrados no Windows (DPI Awareness)
if platform.system() == 'Windows':
    try:
        # Tenta definir a consciência de DPI para versões modernas do Windows
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        # Fallback para versões mais antigas do Windows
        ctypes.windll.user32.SetProcessDPIAware()

def resource_path(relative_path):
    """ Obtém o caminho absoluto para recursos, funcionando para dev e PyInstaller """
    try:
        # Quando o PyInstaller empacota o app, ele extrai os arquivos para uma pasta temporária (_MEIPASS)
        base_path = sys._MEIPASS
    except Exception:
        # Em modo de desenvolvimento (executando o .py direto), usa o diretório pai do arquivo atual
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Retorna o caminho completo unindo a base ao caminho relativo solicitado
    return os.path.join(base_path, relative_path)

class NozesfyApp:
    def __init__(self):
        # Define o título da janela principal da aplicação
        self.title = "Nozesfy - Gerenciador de Estoque"
        # Define a URL do sistema que será carregado no WebView
        self.url = "http://localhost:3000/login-desktop"
        
        # Define o caminho para o ícone da aplicação
        self.icon_path = resource_path("tkinter/public/favicon.ico")
        # Define o caminho para a logo que aparece na Splash Screen
        self.logo_path = resource_path("tkinter/public/logo.png")
        
        # Define a largura padrão da janela principal
        self.width = 1280
        # Define a altura padrão da janela principal
        self.height = 720

    def get_screen_center(self, width, height):
        """ Calcula as coordenadas para centralizar uma janela de tamanho (width, height) """
        if platform.system() == 'Windows':
            try:
                # Pega a resolução física do monitor principal
                phys_w = ctypes.windll.user32.GetSystemMetrics(0)
                phys_h = ctypes.windll.user32.GetSystemMetrics(1)
                
                # Detecta o fator de escala do Windows (DPI)
                dc = ctypes.windll.user32.GetDC(0)
                dpi = ctypes.windll.gdi32.GetDeviceCaps(dc, 88) # 88 = LOGPIXELSX
                ctypes.windll.user32.ReleaseDC(0, dc)
                scale = dpi / 96.0
                
                # Converte para pixels lógicos
                screen_w = phys_w / scale
                screen_h = phys_h / scale
            except Exception:
                screen_w, screen_h = 1280, 720 # Fallback básico
        else:
            # Fallback para outros sistemas usando Tkinter temporário
            root = tk.Tk()
            root.withdraw()
            screen_w = root.winfo_screenwidth()
            screen_h = root.winfo_screenheight()
            root.destroy()
        
        pos_x = int((screen_w - width) / 2)
        pos_y = int((screen_h - height) / 2)
        return max(0, pos_x), max(0, pos_y)

    def run_splash(self):
        """ Cria e exibe a Splash Screen quadrada e centralizada """
        splash = tk.Tk()
        splash.overrideredirect(True) # Remove bordas
        splash.configure(bg="#ffffff")
        
        # Define o tamanho quadrado (400x400)
        s_width, s_height = 400, 400
        
        # Centralização robusta na tela
        screen_w = splash.winfo_screenwidth()
        screen_h = splash.winfo_screenheight()
        pos_x = int((screen_w - s_width) / 2)
        pos_y = int((screen_h - s_height) / 2)
        splash.geometry(f"{s_width}x{s_height}+{pos_x}+{pos_y}")

        # Frame central para agrupar logo e texto sem sobras
        container = tk.Frame(splash, bg="#ffffff")
        container.place(relx=0.5, rely=0.5, anchor="center")

        try:
            if os.path.exists(self.logo_path):
                img = Image.open(self.logo_path)
                # Logo um pouco maior para o formato quadrado
                max_size = (280, 280) 
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                logo_img = ImageTk.PhotoImage(img)
                
                logo_label = tk.Label(container, image=logo_img, bg="#ffffff")
                logo_label.image = logo_img
                logo_label.pack()
            
            # Texto logo abaixo da logo, dentro do container centralizado
            tk.Label(container, text="Gerenciador de Estoque", font=("Helvetica", 12, "bold"), bg="#ffffff", fg="#2D3436").pack(pady=(15, 0))

        except Exception as e:
            print(f"Erro na splash: {e}")
            tk.Label(container, text="Carregando Nozesfy...", bg="#ffffff", font=("Arial", 14)).pack()

        splash.after(3000, splash.destroy)
        splash.mainloop()

    def start_webview(self):
        """ Inicia a janela do PyWebView já na posição correta """
        # Calcula a posição centralizada (considerando escala de DPI)
        pos_x, pos_y = self.get_screen_center(self.width, self.height)
        
        # Cria a janela principal já com as coordenadas definidas
        window = webview.create_window(
            title=self.title,
            url=self.url,
            width=self.width,
            height=self.height,
            x=pos_x,
            y=pos_y,
            resizable=True,
            min_size=(800, 600),
            confirm_close=True,
            background_color='#ffffff'
        )
        
        # Define o diretório de dados do usuário para persistir cookies e sessões
        # No Windows: %APPDATA%/Nozesfy, Outros: ~/.nozesfy
        storage_path = os.path.join(os.getenv('APPDATA') or os.path.expanduser('~'), 'Nozesfy')
        
        if not os.path.exists(storage_path):
            os.makedirs(storage_path)
            
        # Inicia o motor do WebView com persistência de dados (cookies, localStorage, etc)
        webview.start(icon=self.icon_path, debug=False, private_mode=False, storage_path=storage_path)

# Verifica se o script está sendo executado diretamente (não importado)
if __name__ == "__main__":
    app = NozesfyApp() # Instancia a classe principal da aplicação
    app.run_splash() # Executa a tela de carregamento inicial
    app.start_webview() # Após a splash fechar, inicia a janela principal do sistema