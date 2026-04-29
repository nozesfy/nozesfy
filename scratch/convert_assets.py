from PIL import Image
import os

def convert_assets():
    input_dir = "public"
    output_dir = os.path.join("tkinter", "public")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Convert logo.webp to logo.png
    logo_path = os.path.join(input_dir, "logo.webp")
    if os.path.exists(logo_path):
        img = Image.open(logo_path)
        img.save(os.path.join(output_dir, "logo.png"), "PNG")
        print(f"Converted {logo_path} to logo.png")
    
    # Convert favicon.webp to favicon.ico
    favicon_path = os.path.join(input_dir, "favicon.webp")
    if os.path.exists(favicon_path):
        img = Image.open(favicon_path)
        # For .ico, we usually want multiple sizes or at least 256x256
        img.save(os.path.join(output_dir, "favicon.ico"), format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
        print(f"Converted {favicon_path} to favicon.ico")

if __name__ == "__main__":
    convert_assets()
