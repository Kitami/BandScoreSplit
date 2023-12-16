import tkinter as tk
from tkinter import filedialog
from tkinter import StringVar
from PIL import Image, ImageTk, ImageOps
import cv2
import numpy as np
import math

class Main:
    edge_Left, edge_Right, edge_Top, edge_Bottom = 0, 0, 0, 0
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
        self.master.geometry(f"{window_width}x{window_height}+0+0")  # width x height + X offset + Y offset

        # Frame for Buttons
        self.button_frame = tk.Frame(self.master)
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
        self.rotate_button = tk.Button(self.button_frame, text="檢測邊框", command=self.block_analysis)
        self.rotate_button.pack(side=tk.LEFT)
        
        # Add LSD Button
        self.lsd_button = tk.Button(self.button_frame, text="LSD 檢測", command=self.detect_lines)
        self.lsd_button.pack(side=tk.LEFT)
        
        # Entry for tilt angle
        self.tilt_angle_var = tk.StringVar()
        self.tilt_angle_var.set("0")  # 初期値を 0 に設定
        self.tilt_angle_entry = tk.Entry(self.button_frame, textvariable=self.tilt_angle_var, width=8)
        self.tilt_angle_entry.pack(side=tk.RIGHT, padx=5)
        self.tilt_angle_var.trace_add("write", self.rotate_image)
        self.tilt_angle_entry.bind("<Return>", self.rotate_image)

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
        
        self.image_index = 0
        self.images = []
        self.image = None
        self.edit_image = None
        self.image_path = ""
        self.angle = 0
        self.aspect_ratio = 1
        self.bounding_box = None
        
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

    def _on_mousewheel(self, event):
        # Respond to mouse wheel event
        delta = -event.delta // 120  # Normalize the delta value
        self.canvas.yview_scroll(delta, "units")
        
    def load_images(self):
        file_paths = filedialog.askopenfilenames(title="select files")
        if file_paths:
            self.images = [Image.open(file_path) for file_path in file_paths]
            self.image_index = 0
            self.display_image()

    def display_image(self):
        image = self.images[self.image_index]
        self.image = image

        canvas_width_limit = self.master.winfo_width() // 2
        if image.width > canvas_width_limit:
            # Resize image to fit canvas width limit
            self.aspect_ratio = image.width / canvas_width_limit
            new_width = canvas_width_limit
            new_height = int(image.height / self.aspect_ratio)
            image = image.resize((new_width, new_height))

        photo = ImageTk.PhotoImage(image=image)

        self.canvas.config(scrollregion=(0, 0, photo.width(), photo.height()))
        self.canvas_image = self.canvas.create_image(0, 0, anchor=tk.NW, image=photo)
        self.canvas.image = photo

        # Update page number label
        total_pages = len(self.images)
        self.page_label.config(text=f"{self.image_index + 1}/{total_pages}")
        self.lines = []  # 添加全局變量 lines

        # 解析圖片
        self.block_analysis()
        
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
        
    # 繪製邊緣框
    def draw_edge_box(self):
        left = self.edge_Left / self.aspect_ratio
        top = self.edge_Top / self.aspect_ratio
        right = self.edge_Right / self.aspect_ratio
        bottom = self.edge_Bottom / self.aspect_ratio
        
        # 如果是第一次創建，使用 create_rectangle 創建並保存 ID
        if self.bounding_box is None:
            self.bounding_box = self.canvas.create_rectangle(left, top, right, bottom, outline="red", width=2)

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
        self.bounding_box = None

    def rotate_image(self, event=None):
        try:
            angle = -float(self.tilt_angle_var.get())
            pil_image = self.image.rotate(angle, resample=Image.BICUBIC)
            new_width = self.image.width / self.aspect_ratio
            new_height = self.image.height / self.aspect_ratio
            resized_image = pil_image.resize((int(new_width), int(new_height)))
            rotated_image = ImageTk.PhotoImage(resized_image)

            # 更新畫布上的現有圖像
            self.canvas.itemconfig(self.canvas_image, image=rotated_image)
            self.canvas.image = rotated_image

            # 更新畫布上的邊界框
            if self.bounding_box is not None:
                self.draw_edge_box()
                
        except ValueError:
            print("無效的角度值")

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
        
        try:
            return temp[target]
        except IndexError:
            print("IndexError occurred!")
            return None

    @staticmethod
    def find_edge(a, start, end):
        start = int(start)
        end = int(end)
        calc_a = a[:]
        index = 0

        # 確保 start 和 end 在合理的範圍內
        start = max(0, min(start, len(calc_a)))
        end = max(0, min(end, len(calc_a)))

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

        # 進行索引的有效性檢查
        for i in range(start, end, increase):
            if 0 <= i < len(calc_a) and calc_a[i] and calc_a[i] >= threshold:
                index = i
                break

        return index

    def increase(self, array, i, e):
        # 确保数组足够长
        if len(array) <= i:
            # 将数组扩展到足够的长度，你可以根据需要调整
            array.extend([0] * (i - len(array) + 1))
            
        if array[i]:
            array[i] += e
        else:
            array[i] = e

    def block_analysis(self):
        h_map_array = []
        v_map_array = []
        sum_tilt_angle = 0
        count = 0
        
        self.detect_lines()

        for line in self.lines:
            x1, y1, x2, y2 = map(int, line.flatten())
            angle = math.atan2(y1 - y2, x1 - x2)
            length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

            if length > 0.02 * self.image.width:
                if self.is_horizontal(angle):
                    self.increase(h_map_array, y1, length)
                    sum_tilt_angle += self.calc_tilt_angle(angle)
                    count += 1
                elif self.is_vertical(angle):
                    self.increase(v_map_array, x1, length)
        
        # 糾正傾斜
        if count > 0:
            v_angle_radians = sum_tilt_angle / count
            v_angle_degree = -v_angle_radians * self.TO_DEG
            print("v_angle_degree:", v_angle_degree)

            # 更新文本輸入框的值
            v_angle_degree = "{:.4f}".format(v_angle_degree)
            self.tilt_angle_var.set(str(v_angle_degree))
            self.rotate_image()

        self.edge_Left = self.find_edge(v_map_array, 0, self.image.width / 2)
        self.edge_Right = self.find_edge(v_map_array, self.image.width, self.image.width * 0.85)
        self.edge_Top = self.find_edge(h_map_array, 1, self.image.height / 2)
        self.edge_Bottom = self.find_edge(h_map_array, self.image.height, self.image.height / 2)

        # 調試輸出
        print("edge_Left:", self.edge_Left)
        print("edge_Right:", self.edge_Right)
        print("edge_Top:", self.edge_Top)
        print("edge_Bottom:", self.edge_Bottom)

        # 繪製邊緣框
        self.draw_edge_box()


if __name__ == "__main__":
    root = tk.Tk()
    app = Main(root)
    root.mainloop()
