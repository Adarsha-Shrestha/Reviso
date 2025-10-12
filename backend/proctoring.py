import cv2 as cv
import os
import numpy as np
import mediapipe as mp
import threading
import time
from datetime import datetime
from ultralytics import YOLO
from PIL import Image
import pyaudio

class ProctoringSystem:
    def __init__(self):
        # Face tracking setup
        self.mp_face_mesh = mp.solutions.face_mesh
        self.RIGHT_IRIS = [474, 475, 476, 477]
        self.LEFT_IRIS = [469, 470, 471, 472]
        self.L_H_LEFT = [33]
        self.L_H_RIGHT = [133]
        self.R_H_LEFT = [362]
        self.R_H_RIGHT = [263]
        
        # YOLO Model Setup
        self.yolo_model = YOLO('models/yolov8m.pt')
        self.class_names = ['person', 'book', 'cell phone']
        self.class_indices = [i for i, name in self.yolo_model.names.items() if name in self.class_names]
        
        # Anti-spoofing model
        self.anti_spoofing_model = YOLO('models/best.pt')
        
        # Proctoring state variables
        self.eye_cheating = False
        self.head_cheating = False
        self.video_feed_active = False
        self.video_cap = None
        self.sound_detected = False
        self.audio_detection_active = False
        self.stream = None
        self.multiple_persons_detected = False
        self.book_detected = False
        self.phone_detected = False
        
        # Recording variables
        self.RECORDING_DIR = "cheating_recordings"
        self.is_recording = False
        self.out = None
        self.MINIMUM_CHEATING_DURATION = 3
        self.current_cheating_start = None
        self.current_cheating_flags = set()
        
        # Timing
        self.total_time = 100
        self.start_time = None
        
        # User data
        self.user_cheating_data = {}
        
        # Create recordings directory
        if not os.path.exists(self.RECORDING_DIR):
            os.makedirs(self.RECORDING_DIR)
    
    def detect_objects(self, frame):
        """Detect objects using YOLO model"""
        results = self.yolo_model(frame, classes=self.class_indices)
        
        person_count = 0
        self.book_detected = False
        self.phone_detected = False
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls = int(box.cls[0])
                class_name = result.names[cls]
                if class_name == 'person':
                    person_count += 1
                elif class_name == 'book':
                    self.book_detected = True
                elif class_name == 'cell phone':
                    self.phone_detected = True
        
        self.multiple_persons_detected = person_count > 1
    
    def euclidean_distance(self, point1, point2):
        """Calculate Euclidean distance between two points"""
        return np.linalg.norm(point1 - point2)
    
    def iris_position(self, iris_center, right_point, left_point):
        """Determine iris position (LEFT, CENTER, RIGHT)"""
        center_to_right = self.euclidean_distance(iris_center, right_point)
        total_distance = self.euclidean_distance(right_point, left_point)
        gaze_ratio = center_to_right / total_distance
        
        if gaze_ratio < 0.4:
            return "RIGHT", gaze_ratio
        elif 0.4 <= gaze_ratio <= 0.55:
            return "CENTER", gaze_ratio
        else:
            return "LEFT", gaze_ratio
    
    def detect_sound(self):
        """Detect sound using PyAudio"""
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 44100
        CHUNK = 1024
        THRESHOLD = 500
        
        p = pyaudio.PyAudio()
        self.stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, 
                            input=True, frames_per_buffer=CHUNK)
        
        print("Listening for sound...")
        
        try:
            while self.audio_detection_active:
                data = np.frombuffer(self.stream.read(CHUNK), dtype=np.int16)
                volume = np.linalg.norm(data)
                self.sound_detected = volume > THRESHOLD
                time.sleep(0.1)
        except KeyboardInterrupt:
            print("Audio detection stopped.")
        finally:
            self.stream.stop_stream()
            self.stream.close()
            p.terminate()
    
    def start_audio_detection(self):
        """Start audio detection in a separate thread"""
        self.audio_detection_active = True
        audio_thread = threading.Thread(target=self.detect_sound)
        audio_thread.daemon = True
        audio_thread.start()
    
    def stop_audio_detection(self):
        """Stop audio detection"""
        self.audio_detection_active = False
        if self.stream is not None:
            self.stream.stop_stream()
            self.stream.close()
    
    def predict_anti_spoofing(self, image):
        """Predict if the image is real or spoofed"""
        results = self.anti_spoofing_model(image, verbose=False)
        for result in results:
            probs = result.probs
            if probs.top1 > 0.7 or probs.top1 == 0:
                return f"{self.anti_spoofing_model.names[probs.top1]}", probs.top1conf.item()
        return "Unknown", 0.0
    
    def start_recording(self, frame):
        """Start recording cheating behavior"""
        if not self.is_recording:
            self.current_cheating_start = time.time()
            self.current_cheating_flags = set()
            frame_size = (frame.shape[1], frame.shape[0])
            fourcc = cv.VideoWriter_fourcc(*'mp4v')
            self.out = {
                'frames': [],
                'frame_size': frame_size,
                'fourcc': fourcc
            }
            self.is_recording = True
    
    def update_recording(self, frame, detected_flags):
        """Update recording with new frame and flags"""
        if self.is_recording and self.out is not None:
            self.out['frames'].append(frame.copy())
            self.current_cheating_flags.update(detected_flags)
    
    def stop_recording(self):
        """Stop recording and save if duration meets threshold"""
        if self.is_recording and self.out is not None:
            cheating_duration = time.time() - self.current_cheating_start
            
            if cheating_duration >= self.MINIMUM_CHEATING_DURATION:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                duration_str = f"{int(cheating_duration)}s"
                flags_str = "_".join(sorted(self.current_cheating_flags))
                filename = os.path.join(
                    self.RECORDING_DIR,
                    f"cheating_{timestamp}_duration{duration_str}_{flags_str}.mp4"
                )
                
                video_writer = cv.VideoWriter(
                    filename, self.out['fourcc'], 20.0, self.out['frame_size']
                )
                
                for frame in self.out['frames']:
                    video_writer.write(frame)
                
                video_writer.release()
                print(f"Saved cheating clip: {filename}")
            
            self.out = None
            self.current_cheating_start = None
            self.current_cheating_flags = set()
        
        self.is_recording = False
    
    def generate_video_feed(self, username):
        """Generate video feed with proctoring analysis"""
        self.video_cap = cv.VideoCapture(0)
        
        # Initialize user data
        if username not in self.user_cheating_data:
            self.user_cheating_data[username] = []
        
        cheating_buffer = []
        buffer_duration = 30
        
        with self.mp_face_mesh.FaceMesh(
            max_num_faces=1, refine_landmarks=True,
            min_detection_confidence=0.5, min_tracking_confidence=0.5
        ) as face_mesh:
            while self.video_feed_active:
                ret, frame = self.video_cap.read()
                if not ret:
                    break
                
                frame = cv.flip(frame, 1)
                frame_rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
                img_h, img_w = frame.shape[:2]
                
                # Detect objects
                self.detect_objects(frame)
                current_time = time.time()
                
                # Anti-spoofing
                pil_image = Image.fromarray(frame_rgb)
                anti_spoofing_label, confidence = self.predict_anti_spoofing(pil_image)
                color = (0, 255, 0) if anti_spoofing_label == "real" else (0, 0, 255)
                cv.putText(frame, f"Anti-Spoofing: {anti_spoofing_label} ({confidence:.2f})",
                          (20, 280), cv.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
                # Sound indicator
                if self.sound_detected:
                    cv.circle(frame, (600, 50), 20, (0, 0, 255), -1)
                
                # Face mesh processing
                results = face_mesh.process(frame_rgb)
                if results.multi_face_landmarks:
                    mesh_points = np.array([
                        np.multiply([p.x, p.y], [img_w, img_h]).astype(int)
                        for p in results.multi_face_landmarks[0].landmark
                    ])
                    
                    # Iris tracking
                    (l_cx, l_cy), l_radius = cv.minEnclosingCircle(mesh_points[self.LEFT_IRIS])
                    (r_cx, r_cy), r_radius = cv.minEnclosingCircle(mesh_points[self.RIGHT_IRIS])
                    iris_center_right = np.array([r_cx, r_cy], dtype=np.int32)
                    
                    iris_pos, gaze_ratio = self.iris_position(
                        iris_center_right,
                        mesh_points[self.R_H_RIGHT][0],
                        mesh_points[self.R_H_LEFT][0]
                    )
                    self.eye_cheating = iris_pos != "CENTER"
                    
                    # Head pose estimation
                    face_2d, face_3d = [], []
                    for face_landmarks in results.multi_face_landmarks:
                        for idx, lm in enumerate(face_landmarks.landmark):
                            if idx in [33, 263, 1, 61, 291, 199]:
                                x, y = int(lm.x * img_w), int(lm.y * img_h)
                                face_2d.append([x, y])
                                face_3d.append([x, y, lm.z])
                    
                    face_2d = np.array(face_2d, dtype=np.float64)
                    face_3d = np.array(face_3d, dtype=np.float64)
                    
                    focal_length = 1 * img_w
                    cam_matrix = np.array([
                        [focal_length, 0, img_w / 2],
                        [0, focal_length, img_h / 2],
                        [0, 0, 1]
                    ])
                    distortion_matrix = np.zeros((4, 1), dtype=np.float64)
                    
                    ret, rotation_vec, translation_vec = cv.solvePnP(
                        face_3d, face_2d, cam_matrix, distortion_matrix
                    )
                    rmat, jac = cv.Rodrigues(rotation_vec)
                    angles, mtxR, mtxQ, Qx, Qy, Qz = cv.RQDecomp3x3(rmat)
                    
                    x = angles[0] * 360
                    y = angles[1] * 360
                    self.head_cheating = abs(y) > 10 or abs(x) > 10
                    
                    # Detect cheating flags
                    detected_flags = set()
                    if self.eye_cheating:
                        detected_flags.add("eye_movement")
                    if self.head_cheating:
                        detected_flags.add("head_movement")
                    if self.sound_detected:
                        detected_flags.add("sound")
                    if self.multiple_persons_detected:
                        detected_flags.add("multiple_persons")
                    if self.book_detected:
                        detected_flags.add("book")
                    if self.phone_detected:
                        detected_flags.add("phone")
                    if anti_spoofing_label != "real":
                        detected_flags.add("spoofing")
                    
                    cheating_votes = len(detected_flags)
                    is_cheating = cheating_votes >= 2
                    
                    # Recording management
                    if is_cheating:
                        if not self.is_recording:
                            self.start_recording(frame)
                        self.update_recording(frame, detected_flags)
                    elif self.is_recording:
                        self.stop_recording()
                    
                    # Buffer management
                    cheating_buffer.append((current_time, is_cheating))
                    cheating_buffer = [
                        entry for entry in cheating_buffer
                        if current_time - entry[0] <= buffer_duration
                    ]
                    
                    cheating_count = sum(1 for _, cheating in cheating_buffer if cheating)
                    majority_cheating = cheating_count > len(cheating_buffer) / 2
                    
                    elapsed_time = current_time - self.start_time
                    self.user_cheating_data[username].append((elapsed_time, majority_cheating))
                    
                    # Display status
                    color = (0, 0, 255) if is_cheating else (0, 255, 0)
                    text = "CHEATING DETECTED" if is_cheating else "NO CHEATING DETECTED"
                    cv.putText(frame, text, (20, 50), cv.FONT_HERSHEY_SIMPLEX, 1, color, 2)
                    
                    # Display individual modules
                    cv.putText(frame, f"Eye: {'Cheating' if self.eye_cheating else 'OK'}",
                              (20, 100), cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                    cv.putText(frame, f"Head: {'Cheating' if self.head_cheating else 'OK'}",
                              (20, 130), cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                    cv.putText(frame, f"Sound: {'Detected' if self.sound_detected else 'Not Detected'}",
                              (20, 160), cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                    cv.putText(frame, f"Multiple Persons: {'Detected' if self.multiple_persons_detected else 'Not Detected'}",
                              (20, 190), cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                    cv.putText(frame, f"Book: {'Detected' if self.book_detected else 'Not Detected'}",
                              (20, 220), cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                    cv.putText(frame, f"Phone: {'Detected' if self.phone_detected else 'Not Detected'}",
                              (20, 250), cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                
                _, buffer = cv.imencode('.jpg', frame)
                frame = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
                # Reset detection flags
                self.multiple_persons_detected = False
                self.book_detected = False
                self.phone_detected = False
        
        if self.is_recording:
            self.stop_recording()
        self.video_cap.release()
    
    def start_proctoring(self, username):
        """Start the proctoring system"""
        self.video_feed_active = True
        self.start_time = time.time()
        self.start_audio_detection()
    
    def stop_proctoring(self):
        """Stop the proctoring system"""
        self.video_feed_active = False
        self.stop_audio_detection()
        if self.video_cap is not None:
            self.video_cap.release()
    
    def get_feed_status(self):
        """Get current feed status and time remaining"""
        if self.video_feed_active and self.start_time:
            elapsed_time = time.time() - self.start_time
            time_remaining = max(0, self.total_time - elapsed_time)
            
            if time_remaining <= 0:
                self.stop_proctoring()
            
            return {"active": self.video_feed_active, "time_remaining": int(time_remaining)}
        
        return {"active": self.video_feed_active, "time_remaining": self.total_time}
    
    def get_user_data(self, username):
        """Get cheating data for a specific user"""
        return self.user_cheating_data.get(username, [])