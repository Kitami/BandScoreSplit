import tkinter as tk
from tkinter import filedialog
from tkinter import StringVar
from PIL import Image, ImageTk, ImageOps
import cv2
import numpy as np
import math

class Main:
    edge_Left, edge_Right, edge_Top, edge_Bottom = 0, 0, 0, 0
    VISIBLE_WIDTH = 800  # 這是一個示例值，請替換為實際值
    VISIBLE_HEIGHT = 600  # 這是一個示例值，請替換為實際值
    TO_DEG = 180 / math.pi
    DIFF = 0.055  # 傾斜許容範圍 - 約3度
    HORIZON = math.pi
    VERTICAL_1 = 90 * math.pi / 180
    VERTICAL_2 = 270 * math.pi / 180
    
    def __init__(self, master):
        self.master = master
        self.master.title("樂譜掃描糾偏程序")

        # Get screen width and height
        screen_width = self.master.winfo_screenwidth()
        screen_height = self.master.winfo_screenheight()

        # Calculate window width and height
        window_width = int(screen_height * 1.5)
        window_height = int(screen_height * 0.92)

        # Set window size
        self.master.geometry(f"{window_width}x{window_height}+0+0")  # Width x Height + X offset + Y offset

        # Frame for Buttons
        self.button_frame = tk.Frame(self.master, padx=5, pady=5, bg="white")
        self.button_frame.pack(side=tk.TOP, anchor=tk.W)

        # Load Image Button
        self.load_button = tk.Button(self.button_frame, text="加載圖片", command=self.load_images)
        self.load_button.pack(side=tk.LEFT)

        # Previous Image Button
        self.prev_button = tk.Button(self.button_frame, text="前一頁", command=self.prev_image)
        self.prev_button.pack(side=tk.LEFT)

        # Next Image Button
        self.next_button = tk.Button(self.button_frame, text="后一頁", command=self.next_image)
        self.next_button.pack(side=tk.LEFT)

        # Clear Workspace Button
        self.clear_button = tk.Button(self.button_frame, text="清除工作區", command=self.clear_workspace)
        self.clear_button.pack(side=tk.LEFT)

        # Rotate Image Button
        self.rotate_button = tk.Button(self.button_frame, text="自動糾偏", command=self.rotate_image)
        self.rotate_button.pack(side=tk.LEFT)
        
        # Entry for tilt angle
        self.tilt_angle_var = tk.StringVar()
        self.tilt_angle_var.set("0")  # 初期値を 0 に設定
        self.tilt_angle_entry = tk.Entry(self.button_frame, textvariable=self.tilt_angle_var, width=8)
        self.tilt_angle_entry.pack(side=tk.RIGHT, padx=5)
        self.tilt_angle_var.trace_add("write", self.on_tilt_var_changed)

        # Label for displaying page number
        self.page_label = tk.Label(self.button_frame, text="1/1")
        self.page_label.pack(side=tk.RIGHT)

        # Frame for Canvas
        self.canvas_frame = tk.Frame(self.master)
        self.canvas_frame.pack(side=tk.TOP, anchor=tk.W)

        # Vertical scrollbar for the canvas
        self.v_scrollbar = tk.Scrollbar(self.master, orient=tk.VERTICAL)
        self.v_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Canvas for displaying images with vertical scrollbar
        self.canvas = tk.Canvas(self.master, width=800, height=600, yscrollcommand=self.v_scrollbar.set)
        self.canvas.pack(fill=tk.BOTH, expand=True)
        self.v_scrollbar.config(command=self.canvas.yview)

        # Bind mouse wheel event to scrollbar
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)
        
        # Add LSD Button
        self.lsd_button = tk.Button(self.button_frame, text="LSD 檢測", command=self.detect_lines)
        self.lsd_button.pack(side=tk.LEFT)
        
        self.image_index = 0
        self.images = []
        self.image_path = ""
        self.angle = 0
        
    # Bind arrow keys to tilt entry
        self.tilt_angle_entry.bind("<Up>", self.increase_tilt)
        self.tilt_angle_entry.bind("<Down>", self.decrease_tilt)

    def increase_tilt(self, event):
        current_value = float(self.tilt_angle_var.get())
        new_value = round(current_value + 0.25, 2)
        self.tilt_angle_var.set(new_value)
        self.rotate_image()

    def decrease_tilt(self, event):
        current_value = float(self.tilt_angle_var.get())
        new_value = round(current_value - 0.25, 2)
        self.tilt_angle_var.set(new_value)
        self.rotate_image()

    def on_tilt_var_changed(self, *args):
        # Callback function for tilt_angle_var change
        try:
            tilt_angle = float(self.tilt_angle_var.get())
            self.rotate_image(tilt_angle)
        except ValueError:
            pass  # Ignore non-numeric input

    def _on_mousewheel(self, event):
        # Respond to mouse wheel event
        delta = -event.delta // 120  # Normalize the delta value
        self.canvas.yview_scroll(delta, "units")
        
    def load_images(self):
        file_paths = filedialog.askopenfilenames(title="選擇圖片文件", filetypes=[("圖片文件", "*.png;*.jpg;*.jpeg")])
        if file_paths:
            self.images = [Image.open(file_path) for file_path in file_paths]
            self.image_index = 0
            self.display_image()
            
            # 自動檢測傾斜角度
            # self.block_analysis()

    def display_image(self):
        image = self.images[self.image_index]

        # Check if image width exceeds canvas width limit
        canvas_width_limit = self.master.winfo_width() // 2
        if image.width > canvas_width_limit:
            # Resize image to fit canvas width limit
            aspect_ratio = image.width / canvas_width_limit
            new_width = canvas_width_limit
            new_height = int(image.height / aspect_ratio)
            image = image.resize((new_width, new_height), Image.ANTIALIAS)

        photo = ImageTk.PhotoImage(image=image)

        self.canvas.config(scrollregion=(0, 0, photo.width(), photo.height()))
        self.canvas.create_image(0, 0, anchor=tk.NW, image=photo)
        self.canvas.image = photo

        # Update page number label
        total_pages = len(self.images)
        self.page_label.config(text=f"{self.image_index + 1}/{total_pages}")

        self.lines = []  # 添加全局變量 lines
        
    def detect_lines(self):
        if not self.images:
            return
        image = self.images[self.image_index]
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        self.lines = cv2.createLineSegmentDetector().detect(gray_image)[0]

        lines_image = cv_image.copy()
        for line in self.lines:
            x1, y1, x2, y2 = map(int, line.flatten())
            cv2.line(lines_image, (x1, y1), (x2, y2), (0, 0, 255), 2)

        lines_pil = Image.fromarray(cv2.cvtColor(lines_image, cv2.COLOR_BGR2RGB))
        self.display_image_with_lines(lines_pil)

    def display_image_with_lines(self, image):
        # Resize the image to fit the canvas while maintaining aspect ratio
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()
        aspect_ratio = image.width / image.height
        target_width = min(canvas_width // 2, image.width)
        target_height = int(target_width / aspect_ratio)
        image = image.resize((target_width, target_height), Image.LANCZOS)
        photo = ImageTk.PhotoImage(image=image)
        self.canvas.config(scrollregion=(0, 0, photo.width(), photo.height()))
        self.canvas.create_image(0, 0, anchor=tk.NW, image=photo)
        self.canvas.image = photo
        
    def draw_div_box(self, left, top, width, height):
        # 繪製邊緣框
        self.canvas.create_rectangle(left, top, left + width, top + height, outline="red", width=2)

    def prev_image(self):
        if self.image_index > 0:
            self.image_index -= 1
            self.display_image()

    def next_image(self):
        if self.image_index < len(self.images) - 1:
            self.image_index += 1
            self.display_image()

    def clear_workspace(self):
        self.images = []
        self.image_index = 0
        self.image_path = ""
        self.canvas.delete("all")
        self.page_label.config(text="1/1")

    def rotate_image(self):
        original_image = self.images[self.image_index]
        angle = -float(self.tilt_angle_var.get())  # 讀取文本框的值並轉換為浮點數
        pil_image = original_image.rotate(angle, resample=Image.BICUBIC)
        rotated_image = ImageTk.PhotoImage(pil_image)
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor=tk.NW, image=rotated_image)
        self.canvas.image = rotated_image

            
    @staticmethod
    def is_horizontal(angle):
        a = abs(angle)
        return (0 < a < Main.DIFF) or (Main.HORIZON - Main.DIFF < a < Main.HORIZON + Main.DIFF)

    @staticmethod
    def is_vertical(angle):
        a = abs(angle)
        return (Main.VERTICAL_1 - Main.DIFF < a < Main.VERTICAL_1 + Main.DIFF) or \
            (Main.VERTICAL_2 - Main.DIFF < a < Main.VERTICAL_2 + Main.DIFF)

    @staticmethod
    def calc_tilt_angle(a):
        tilt = 0
        if -Main.DIFF < a < Main.DIFF:
            tilt = a
        elif Main.HORIZON - Main.DIFF < a < Main.HORIZON + Main.DIFF:
            tilt = a - math.pi
        elif 0 - Main.HORIZON - Main.DIFF < a < 0 - Main.HORIZON + Main.DIFF:
            tilt = a + math.pi
        return tilt

    @staticmethod
    def top_n(arr, N=0.5):
        arr_new = [item for item in arr if item]
        target = int(len(arr_new) * N)
        temp = sorted(arr_new, reverse=True)
        return temp[target]

    @staticmethod
    def find_edge(a, start, end):
        calc_a = a[:]
        index = 0
        if start < end:
            for i in range(len(calc_a)):
                if calc_a[i] and i > end:
                    calc_a[i] = 0
        else:
            for i in range(len(calc_a)):
                if calc_a[i] and i < end:
                    calc_a[i] = 0
        threshold = Main.top_n(calc_a, 0.5)
        increase = 1 if start < end else -1
        for i in range(start, end, increase):
            if calc_a[i] and calc_a[i] >= threshold:
                index = i
                break
        return index

    def block_analysis(self):
        h_map_array = []
        v_map_array = []
        self.detect_lines()

        for line in self.lines:
            x1, y1, x2, y2 = map(int, line.flatten())
            angle = math.atan2(y1 - y2, x1 - x2)
            length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            count = 0

            if length > 0.02 * self.VISIBLE_WIDTH:
                if self.is_horizontal(angle):
                    self.increase(h_map_array, y1, length)
                    sum_tilt_angle += self.calc_tilt_angle(angle)
                    count += 1
                elif self.is_vertical(angle):
                    self.increase(v_map_array, x1, length)
         
        #糾正傾斜           
        if count > 0:
            v_angle_radians = sum_tilt_angle / count
            v_angle_degree = v_angle_radians * self.TO_DEG

            # 更新文本輸入框的值
            self.tilt_angle_var.set(-v_angle_degree)
            self.rotate_image(-v_angle_radians)

        self.edge_Left = self.find_edge(v_map_array, 0, self.VISIBLE_WIDTH / 2)
        self.edge_Right = self.find_edge(v_map_array, self.VISIBLE_WIDTH, self.VISIBLE_WIDTH * 0.85)
        self.edge_Top = self.find_edge(h_map_array, 1, self.VISIBLE_HEIGHT / 2)
        self.edge_Bottom = self.find_edge(h_map_array, self.VISIBLE_HEIGHT, self.VISIBLE_HEIGHT / 2)

        # 在檢測到的範圍內創建邊緣框
        edge_w = self.edge_Right - self.edge_Left
        edge_h = self.edge_Bottom - self.edge_Top

        # 繪製邊緣框
        self.draw_div_box(self.edge_Left, self.edge_Top, edge_w, edge_h)

if __name__ == "__main__":
    root = tk.Tk()
    app = Main(root)
    root.mainloop()
