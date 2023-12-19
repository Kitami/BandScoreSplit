import tkinter as tk
from tkinter import filedialog
from tkinter import StringVar
from PIL import Image, ImageTk, ImageOps
import cv2
import numpy as np
import math,os

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
        window_height = int(screen_height)

        # Set window size
        self.master.geometry(f"{window_width}x{window_height}+0+0")  # width x height + X offset + Y offset

        # --------------------------------GUI--------------------------------
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
        self.lsd_button = tk.Button(self.button_frame, text="反映變更", command=self.make_new_image)
        self.lsd_button.pack(side=tk.LEFT)
        
        # Label for age number
        self.tilt_label = tk.Label(self.button_frame, text="頁數:")
        self.tilt_label.pack(side=tk.LEFT, padx=5)

        # Label for displaying page number
        self.page_label = tk.Label(self.button_frame, text="1/1")
        self.page_label.pack(side=tk.LEFT)

        # Label for age number
        self.tilt_label = tk.Label(self.button_frame, text="傾斜角度:")
        self.tilt_label.pack(side=tk.LEFT, padx=5)

        # Entry for tilt angle
        self.tilt_angle_var = tk.DoubleVar()
        self.tilt_angle_var.set(0.0)
        self.tilt_angle_entry = tk.Entry(self.button_frame, textvariable=self.tilt_angle_var, width=8)
        self.tilt_angle_entry.pack(side=tk.LEFT, padx=5)
        self.tilt_angle_var.trace_add("write", self.rotate_image)
        self.tilt_angle_entry.bind("<Return>", self.rotate_image)

        # Label for left
        self.left_label = tk.Label(self.button_frame, text="左邊:")
        self.left_label.pack(side=tk.LEFT, padx=5)
        self.left_var = tk.IntVar()
        self.left_var.set(35)
        self.left_entry = tk.Entry(self.button_frame, textvariable=self.left_var, width=5)
        self.left_entry.pack(side=tk.LEFT, padx=5)

        # Label for right
        self.right_label = tk.Label(self.button_frame, text="右邊:")
        self.right_label.pack(side=tk.LEFT, padx=5)
        self.right_var = tk.IntVar()
        self.right_var.set(10)
        self.right_entry = tk.Entry(self.button_frame, textvariable=self.right_var, width=5)
        self.right_entry.pack(side=tk.LEFT, padx=5)

        # Label for top
        self.top_label = tk.Label(self.button_frame, text="上邊:")
        self.top_label.pack(side=tk.LEFT, padx=5)
        self.top_var = tk.IntVar()
        self.top_var.set(50)
        self.top_entry = tk.Entry(self.button_frame, textvariable=self.top_var, width=5)
        self.top_entry.pack(side=tk.LEFT, padx=5)

        # Label for bottom
        self.bottom_label = tk.Label(self.button_frame, text="下邊:")
        self.bottom_label.pack(side=tk.LEFT, padx=5)
        self.bottom_var = tk.IntVar()
        self.bottom_var.set(10)
        self.bottom_entry = tk.Entry(self.button_frame, textvariable=self.bottom_var, width=5)
        self.bottom_entry.pack(side=tk.LEFT, padx=5)

        # Add Save Image Button
        self.save_button = tk.Button(self.button_frame, text="保存圖像", command=self.save_canvas2_image)
        self.save_button.pack(side=tk.LEFT)

        # Add Save Image Button
        self.save_button = tk.Button(self.button_frame, text="分割圖像", command=self.split_and_save)
        self.save_button.pack(side=tk.LEFT)

        # Add a Label for displaying the status message
        self.status_label = tk.Label(self.button_frame, text="", fg="green")
        self.status_label.pack(side=tk.RIGHT, padx=5)

        # Frame for Canvas
        self.canvas_frame = tk.Frame(self.master)
        self.canvas_frame.pack(side=tk.TOP, anchor=tk.W, fill=tk.BOTH, expand=True)

        # Vertical scrollbar for the canvas
        self.v_scrollbar = tk.Scrollbar(self.canvas_frame, orient=tk.VERTICAL)
        self.v_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Canvas 1 (Left)
        self.canvas = tk.Canvas(self.canvas_frame, width=600, height=800, yscrollcommand=self.v_scrollbar.set, bg="white")
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Canvas 2 (Right)
        self.canvas2 = tk.Canvas(self.canvas_frame, width=600, height=800, yscrollcommand=self.v_scrollbar.set, bg="white")
        self.canvas2.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Label for paragraph count
        self.paragraph_label = tk.Label(self.button_frame, text="段落數量:")
        self.paragraph_label.pack(side=tk.LEFT, padx=5)
        self.paragraph_var = tk.IntVar()
        self.paragraph_var.set(1)
        self.paragraph_entry = tk.Entry(self.button_frame, textvariable=self.paragraph_var, width=3)
        self.paragraph_entry.pack(side=tk.LEFT, padx=5)
        self.paragraph_var.trace_add("write", self.apply_changes)

        # Label for part count
        self.part_label = tk.Label(self.button_frame, text="Part數量:")
        self.part_label.pack(side=tk.LEFT, padx=5)
        self.part_var = tk.IntVar()
        self.part_var.set(1)
        self.part_entry = tk.Entry(self.button_frame, textvariable=self.part_var, width=3)
        self.part_entry.pack(side=tk.LEFT, padx=5)

        # --------------------------------Configure--------------------------------

        # Configure scrollbar to control both canvases
        self.v_scrollbar.config(command=lambda *args: self.on_scroll(*args))

        # Bind mouse wheel event to scrollbar
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)
        self.canvas2.bind_all("<MouseWheel>", self._on_mousewheel)
        
        self.image_index = 0
        self.images = []
        self.image = None
        self.edit_image = None
        self.new_image = None
        self.file_paths = []
        self.image_path = ""
        self.aspect_ratio = 1
        self.bounding_box = None
        self.bounding_box2 = None
        
        # 在 __init__ 函数中注册回调函数
        self.left_var.trace_add("write", self.draw_bounding_box2)
        self.top_var.trace_add("write", self.draw_bounding_box2)
        self.right_var.trace_add("write", self.draw_bounding_box2)
        self.bottom_var.trace_add("write", self.draw_bounding_box2)

        # 绑定上下箭头键事件
        self.left_entry.bind("<Up>", lambda event: self.adjust_var(self.left_var, 1))
        self.left_entry.bind("<Down>", lambda event: self.adjust_var(self.left_var, -1))
        self.top_entry.bind("<Up>", lambda event: self.adjust_var(self.top_var, 1))
        self.top_entry.bind("<Down>", lambda event: self.adjust_var(self.top_var, -1))
        self.right_entry.bind("<Up>", lambda event: self.adjust_var(self.right_var, 1))
        self.right_entry.bind("<Down>", lambda event: self.adjust_var(self.right_var, -1))
        self.bottom_entry.bind("<Up>", lambda event: self.adjust_var(self.bottom_var, 1))
        self.bottom_entry.bind("<Down>", lambda event: self.adjust_var(self.bottom_var, -1))

        # Bind arrow keys to tilt entry
        self.tilt_angle_entry.bind("<Up>", self.increase_tilt)
        self.tilt_angle_entry.bind("<Down>", self.decrease_tilt)

        # Variables to track dragging
        self.drag_data = {"item": None, "y": 0}

    def apply_changes(self, *args):
        # 獲取段落數量
        paragraph_count = self.paragraph_var.get()
        interval = self.image.height / (paragraph_count + 1) / self.aspect_ratio
        for i in range(1, paragraph_count + 1):
            rect_y = i * interval
            tag_name_a = f"rectangle_{i}_a"
            tag_name = f"rectangle_{i}"

            self.canvas.delete(tag_name)
            self.canvas.delete(tag_name_a)

            rect_x, rect_y, rect_width, rect_height = 0, rect_y, self.canvas.winfo_width(), 2
            rect_color = "aqua"
            self.rect = self.canvas.create_rectangle(rect_x, rect_y, rect_width, rect_y + rect_height, fill=rect_color, outline=rect_color,tag=tag_name_a)
            self.rect2 = self.canvas.create_rectangle(rect_x, rect_y - 20, rect_width, rect_y + 20, fill="", outline="",tag=tag_name)

            self.canvas.tag_bind(self.rect2, "<ButtonPress-1>", self.on_press)
            self.canvas.tag_bind(self.rect2, "<B1-Motion>", self.on_drag)

    def on_press(self, event):
        print(self.canvas.gettags("current"))
        self.on_press_tag = self.canvas.gettags("current")[0]
        self.start_y = event.y

    def on_drag(self, event):
        delta_y = event.y - self.start_y
        rect = self.canvas.find_withtag(self.on_press_tag)
        rect_a = self.canvas.find_withtag(self.on_press_tag + "_a")
        self.canvas.move(rect, 0, delta_y)
        self.canvas.move(rect_a, 0, delta_y)

        self.start_y = event.y

    def on_scroll(self, *args):
        self.canvas.yview(*args)
        self.canvas2.yview(*args)

    def _on_mousewheel(self, event):
        # Respond to mouse wheel event
        delta = -event.delta // 120  # Normalize the delta value
        self.canvas.yview_scroll(delta, "units")
        self.canvas2.yview_scroll(delta, "units")

    # 调整变量值的函数
    def adjust_var(self, var, direction):
        # 将调整的单位改为1
        value = 1 * direction
        current_value = float(var.get())
        new_value = round(current_value + value)
        var.set(new_value)
        self.draw_bounding_box2()

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

    def load_images(self):
        file_paths = filedialog.askopenfilenames(title="select files")
        self.file_paths = file_paths
        if file_paths:
            self.images = [Image.open(file_path) for file_path in file_paths]
            self.image_index = 0
            self.display_image()

    def display_image(self):
        image = self.images[self.image_index]
        self.image_path = self.file_paths[self.image_index]
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
        self.canvas2.config(scrollregion=(0, 0, photo.width(), photo.height()))
        self.canvas_image = self.canvas.create_image(0, 0, anchor=tk.NW, image=photo)
        self.canvas.image = photo

        # Update page number label
        total_pages = len(self.images)
        self.page_label.config(text=f"{self.image_index + 1}/{total_pages}")
        self.lines = []  # 添加全局變量 lines

        # 解析圖片
        # self.block_analysis()
        
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

    # 繪製邊緣框
    def draw_bounding_box(self):
        left = self.edge_Left / self.aspect_ratio
        top = self.edge_Top / self.aspect_ratio
        right = self.edge_Right / self.aspect_ratio
        bottom = self.edge_Bottom / self.aspect_ratio
        
        # 如果存在矩形，删除它
        if self.bounding_box is not None:
            self.canvas.delete(self.bounding_box)
            self.bounding_box = None

        self.bounding_box = self.canvas.create_rectangle(left, top, right, bottom, outline="red", width=2)
        self.draw_bounding_box2()
            
    def draw_bounding_box2(self, *args):
        # 如果存在矩形，删除它
        if self.bounding_box2 is not None:
            self.canvas.delete(self.bounding_box2)
            self.bounding_box2 = None

        # 重新绘制边界框
        self.bounding_box2 = self.canvas.create_rectangle(
                    (self.edge_Left / self.aspect_ratio) - self.left_var.get(),
                    (self.edge_Top / self.aspect_ratio) - self.top_var.get(),
                    (self.edge_Right / self.aspect_ratio) + self.right_var.get(),
                    (self.edge_Bottom / self.aspect_ratio) + self.bottom_var.get(),
                    outline="blue", width=2
                )

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
            # 获取旋转角度
            angle = -float(self.tilt_angle_var.get())
            
            # 原始图像旋转
            pil_image_original = self.image.rotate(angle, resample=Image.BICUBIC)
            self.edit_image = pil_image_original
            
            # 等比例缩放
            new_width = self.image.width / self.aspect_ratio
            new_height = self.image.height / self.aspect_ratio
            resized_image = pil_image_original.resize((int(new_width), int(new_height)))
            
            # 更新Canvas上的图像
            rotated_image = ImageTk.PhotoImage(resized_image)
            self.canvas.itemconfig(self.canvas_image, image=rotated_image)
            self.canvas.image = rotated_image

            # 更新边界框
            if self.bounding_box is not None:
                self.draw_bounding_box()

        except ValueError:
            print("无效的角度值")

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
            self.tilt_angle_var.set(v_angle_degree)
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
        self.draw_bounding_box()
        self.make_new_image()

    def make_new_image(self):
        # 創建新圖
        new_image = Image.new("RGB", self.edit_image.size, "white")
        crop_top = self.edge_Top - self.top_var.get() * self.aspect_ratio
        crop_left = self.edge_Left - self.left_var.get() * self.aspect_ratio
        crop_right = self.edge_Right + self.right_var.get() * self.aspect_ratio
        crop_bottom = self.edge_Bottom + self.bottom_var.get() * self.aspect_ratio

        region = self.edit_image.crop((crop_left, crop_top, crop_right, crop_bottom))
        start_x = int((self.image.width - (crop_right- crop_left)) / 2)
        start_y = int((self.image.height - (crop_bottom - crop_top)) / 2)

        new_image.paste(region, (start_x, start_y))
        self.new_image = new_image

        # 在canvas2中显示新图像
        new_width = int(self.image.width / self.aspect_ratio)
        new_height = int(self.image.height / self.aspect_ratio)
        resized_image = new_image.resize((new_width, new_height))
        new_photo = ImageTk.PhotoImage(resized_image)
        self.canvas2.create_image(0, 0, anchor=tk.NW, image=new_photo)
        self.canvas2.image = new_photo

    # Function to save canvas2 image
    def save_canvas2_image(self):
        if self.new_image:
            original_dir, original_filename = os.path.split(self.image_path)
            new_filename = original_filename.split('.')[0] + '_new.png'
            new_image_path = os.path.join(original_dir, new_filename)
            self.new_image.save(new_image_path)
            self.status_label.config(text=f"{new_filename}保存成功", fg="green")

    def get_y_array(self):
        y_array = []
        count = self.paragraph_var.get() + 1
        for i in range(1, count):
            tag = f"rectangle_{i}"
            rectangle = self.canvas.find_withtag(tag)
            if not rectangle:
                break
            rect_y = (self.canvas.coords(rectangle)[1] + 20) * self.aspect_ratio
            print("y_array:", rect_y)
            y_array.append(rect_y)
        return y_array

    def split_and_save(self):
        y_values = self.get_y_array()
        original_dir, original_filename = os.path.split(self.image_path)
        for i, rect_y in enumerate(y_values):
            if i == 0:
                start_y = 0
            else:
                start_y = y_values[i - 1]
                
            end_y = rect_y

            crop_box = (0, start_y, self.image.width, end_y)
            cropped_image = self.image.crop(crop_box)
            new_filename = original_filename.split('.')[0] + f"_new_{i + 1}.png"
            filename = os.path.join(original_dir, new_filename)
            cropped_image.save(filename)

        # Save the last segment
        last_rect_y = y_values[-1] if y_values else 0
        crop_box = (0, last_rect_y, self.image.width, self.image.height)
        last_cropped_image = self.image.crop(crop_box)
        new_filename = original_filename.split('.')[0] + f"_new_{len(y_values) + 1}.png"
        last_filename = os.path.join(original_dir, new_filename)
        last_cropped_image.save(last_filename)
        self.status_label.config(text=f"分割保存成功", fg="green")

if __name__ == "__main__":
    root = tk.Tk()
    app = Main(root)
    root.mainloop()
