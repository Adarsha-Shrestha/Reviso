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
import queue

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
        
        # YOLO Model Setup (with error handling)
        try:
            self.yolo_model = YOLO('models/yolov8m.pt')
            self.yolo_enabled = True
        except Exception as e:
            print(f"Warning: YOLO model not loaded: {e}")
            self.yolo_enabled = False
        
        self.class_names = ['person', 'book', 'cell phone']
        
        # Anti-spoofing model (with error handling)
        try:
            self.anti_spoofing_model = YOLO('models/best.pt')
            self.anti_spoofing_enabled = True
        except Exception as e:
            print(f"Warning: Anti-spoofing model not loaded: {e}")
            self.anti_spoofing_enabled = False
        
        # Proctoring state variables
        self.eye_cheating = False
        self.head_cheating = False
        self.video_feed_active = False
        self.video_cap = None
        self.sound_detected = False
        self.audio_detection_active = False
        self.stream = None
        self.audio_thread = None
        self.multiple_persons_detected = False
        self.book_detected = False
        self.phone_detected = False
        
        # Recording variables
        self.RECORDING_DIR = "cheating_recordings"
        self.is_recording = False
        self.out = None
        self.MINIMUM_CHEATING_DURATION = 0.7
        self.current_cheating_start = None
        self.current_cheating_flags = set()
        
        # Timing
        self.total_time = 3600  # Default 1 hour
        self.start_time = None
        
        # User data
        self.user_cheating_data = {}
        self.current_username = None
        
        # Frame queue for video streaming
        self.frame_queue = queue.Queue(maxsize=2)
        
        # Create recordings directory
        if not os.path.exists(self.RECORDING_DIR):
            os.makedirs(self.RECORDING_DIR)
    
    def detect_objects(self, frame):
        """Detect objects using YOLO model"""
        if not self.yolo_enabled:
            return
        
        try:
            results = self.yolo_model(frame, verbose=False)
            
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
        except Exception as e:
            print(f"Object detection error: {e}")
    
    def euclidean_distance(self, point1, point2):
        """Calculate Euclidean distance between two points"""
        return np.linalg.norm(point1 - point2)
    
    def iris_position(self, iris_center, right_point, left_point):
        """Determine iris position (LEFT, CENTER, RIGHT)"""
        center_to_right = self.euclidean_distance(iris_center, right_point)
        total_distance = self.euclidean_distance(right_point, left_point)
        
        if total_distance == 0:
            return "CENTER", 0.5
        
        gaze_ratio = center_to_right / total_distance
        
        if gaze_ratio < 0.42:
            return "RIGHT", gaze_ratio
        elif 0.42 <= gaze_ratio <= 0.57:
            return "CENTER", gaze_ratio
        else:
            return "LEFT", gaze_ratio
    
    def detect_sound(self):
        """Detect sound using PyAudio"""
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 44100
        CHUNK = 1024
        THRESHOLD = 800  # Increased threshold to reduce false positives
        
        p = pyaudio.PyAudio()
        
        try:
            self.stream = p.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK,
                stream_callback=None
            )
            
            print("Audio detection started...")
            
            while self.audio_detection_active:
                try:
                    data = np.frombuffer(self.stream.read(CHUNK, exception_on_overflow=False), dtype=np.int16)
                    volume = np.abs(data).mean()
                    self.sound_detected = volume > THRESHOLD
                    time.sleep(0.05)
                except Exception as e:
                    print(f"Audio read error: {e}")
                    time.sleep(0.1)
                    
        except Exception as e:
            print(f"Audio detection error: {e}")
        finally:
            if self.stream is not None:
                try:
                    self.stream.stop_stream()
                    self.stream.close()
                except:
                    pass
            p.terminate()
    
    def start_audio_detection(self):
        """Start audio detection in a separate thread"""
        if self.audio_detection_active:
            return
        
        self.audio_detection_active = True
        self.audio_thread = threading.Thread(target=self.detect_sound, daemon=True)
        self.audio_thread.start()
    
    def stop_audio_detection(self):
        """Stop audio detection"""
        self.audio_detection_active = False
        if self.audio_thread is not None:
            self.audio_thread.join(timeout=2)
        if self.stream is not None:
            try:
                self.stream.stop_stream()
                self.stream.close()
            except:
                pass
    
    def predict_anti_spoofing(self, image):
        """Predict if the image is real or spoofed"""
        if not self.anti_spoofing_enabled:
            return "real", 1.0
        
        try:
            results = self.anti_spoofing_model(image, verbose=False)
            for result in results:
                probs = result.probs
                if probs is not None:
                    confidence = probs.top1conf.item()
                    label = self.anti_spoofing_model.names[probs.top1]
                    return label, confidence
        except Exception as e:
            print(f"Anti-spoofing error: {e}")
        
        return "real", 1.0
    
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
            print("[Recording] Started cheating recording")

    def update_recording(self, frame, detected_flags):
        """Update recording with new frame and flags"""
        if self.is_recording and self.out is not None:
            self.out['frames'].append(frame.copy())
            self.current_cheating_flags.update(detected_flags)
            print(f"[Recording] Added frame #{len(self.out['frames'])} with flags: {detected_flags}")

    def stop_recording(self, force_save=False):
        """Stop recording and save if duration meets threshold or force_save=True"""
        if self.is_recording and self.out is not None:
            cheating_duration = time.time() - self.current_cheating_start
            print(f"[Recording] Attempting to stop recording. Duration: {cheating_duration:.2f}s, Frames: {len(self.out['frames'])}")

            if cheating_duration >= self.MINIMUM_CHEATING_DURATION or force_save:
                if len(self.out['frames']) > 0:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    duration_str = f"{int(cheating_duration)}s"
                    flags_str = "_".join(sorted(self.current_cheating_flags)) if self.current_cheating_flags else "general"
                    filename = os.path.join(
                        self.RECORDING_DIR,
                        f"cheating_{self.current_username}_{timestamp}_{duration_str}_{flags_str}.mp4"
                    )

                    try:
                        video_writer = cv.VideoWriter(
                            filename, self.out['fourcc'], 20.0, self.out['frame_size']
                        )
                        if not video_writer.isOpened():
                            print(f"[Recording ERROR] Cannot open VideoWriter for {filename}")
                        else:
                            for frame in self.out['frames']:
                                video_writer.write(frame)
                            video_writer.release()
                            print(f"[Recording] Saved cheating clip: {filename}")
                    except Exception as e:
                        print(f"[Recording ERROR] Saving recording failed: {e}")
                else:
                    print("[Recording] No frames recorded, nothing to save")
            else:
                print(f"[Recording] Cheating duration {cheating_duration:.2f}s less than minimum threshold, skipped saving")

            # Reset recording state
            self.out = None
            self.current_cheating_start = None
            self.current_cheating_flags = set()
            self.is_recording = False
            print("[Recording] Recording stopped")

    
    def generate_video_feed(self, username):
        """Generate video feed with proctoring analysis"""
        if self.video_cap is not None:
            self.video_cap.release()
        
        self.video_cap = cv.VideoCapture(0)
        self.current_username = username
        
        # Set camera properties for better performance
        self.video_cap.set(cv.CAP_PROP_FRAME_WIDTH, 640)
        self.video_cap.set(cv.CAP_PROP_FRAME_HEIGHT, 480)
        self.video_cap.set(cv.CAP_PROP_FPS, 30)
        
        if not self.video_cap.isOpened():
            print("Error: Could not open camera")
            return
        
        # Initialize user data
        if username not in self.user_cheating_data:
            self.user_cheating_data[username] = []
        
        cheating_buffer = []
        buffer_duration = 10  # Reduced buffer for more responsive detection
        frame_count = 0
        
        with self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        ) as face_mesh:
            
            while self.video_feed_active:
                ret, frame = self.video_cap.read()
                if not ret:
                    print("Failed to read frame")
                    time.sleep(0.1)
                    continue
                
                frame = cv.flip(frame, 1)
                frame_rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
                img_h, img_w = frame.shape[:2]
                
                current_time = time.time()
                elapsed_time = current_time - self.start_time if self.start_time else 0
                
                # Process object detection every 10 frames for performance
                if frame_count % 10 == 0:
                    self.detect_objects(frame)
                
                frame_count += 1
                
                # Anti-spoofing check
                anti_spoofing_label = "real"
                confidence = 1.0
                if self.anti_spoofing_enabled and frame_count % 30 == 0:
                    pil_image = Image.fromarray(frame_rgb)
                    anti_spoofing_label, confidence = self.predict_anti_spoofing(pil_image)
                
                color = (0, 255, 0) if anti_spoofing_label == "real" else (0, 0, 255)
                cv.putText(frame, f"Verification: {anti_spoofing_label} ({confidence:.2f})",
                          (10, 30), cv.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                # Time remaining
                time_remaining = max(0, self.total_time - elapsed_time)
                mins = int(time_remaining // 60)
                secs = int(time_remaining % 60)
                cv.putText(frame, f"Time: {mins:02d}:{secs:02d}",
                          (img_w - 150, 30), cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                # Face mesh processing
                detected_flags = set()
                results = face_mesh.process(frame_rgb)
                
                if results.multi_face_landmarks:
                    mesh_points = np.array([
                        np.multiply([p.x, p.y], [img_w, img_h]).astype(int)
                        for p in results.multi_face_landmarks[0].landmark
                    ])
                    
                    # Iris tracking
                    try:
                        (l_cx, l_cy), l_radius = cv.minEnclosingCircle(mesh_points[self.LEFT_IRIS])
                        (r_cx, r_cy), r_radius = cv.minEnclosingCircle(mesh_points[self.RIGHT_IRIS])
                        
                        center_left = np.array([l_cx, l_cy], dtype=np.int32)
                        center_right = np.array([r_cx, r_cy], dtype=np.int32)
                        
                        # Draw iris circles
                        cv.circle(frame, center_left, int(l_radius), (255, 0, 255), 1, cv.LINE_AA)
                        cv.circle(frame, center_right, int(r_radius), (255, 0, 255), 1, cv.LINE_AA)
                        
                        # Check gaze direction
                        iris_pos, gaze_ratio = self.iris_position(
                            center_right,
                            mesh_points[self.R_H_RIGHT][0],
                            mesh_points[self.R_H_LEFT][0]
                        )
                        
                        self.eye_cheating = iris_pos != "CENTER"
                        
                        if self.eye_cheating:
                            detected_flags.add("eye_movement")
                        
                        # Display gaze direction
                        cv.putText(frame, f"Gaze: {iris_pos}", (10, 60),
                                  cv.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
                    
                    except Exception as e:
                        print(f"Iris tracking error: {e}")
                    
                    # Head pose estimation
                    try:
                        face_2d, face_3d = [], []
                        for idx, lm in enumerate(results.multi_face_landmarks[0].landmark):
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
                        
                        success, rotation_vec, translation_vec = cv.solvePnP(
                            face_3d, face_2d, cam_matrix, distortion_matrix
                        )
                        
                        if success:
                            rmat, _ = cv.Rodrigues(rotation_vec)
                            angles, _, _, _, _, _ = cv.RQDecomp3x3(rmat)
                            
                            x = angles[0] * 360
                            y = angles[1] * 360
                            
                            # More lenient head movement threshold
                            self.head_cheating = abs(y) > 25 or abs(x) > 20
                            
                            if self.head_cheating:
                                detected_flags.add("head_movement")
                            
                            # Display head orientation
                            cv.putText(frame, f"Head: X={int(x)} Y={int(y)}",
                                      (10, 90), cv.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 2)
                    
                    except Exception as e:
                        print(f"Head pose error: {e}")
                else:
                    cv.putText(frame, "No face detected!", (10, 60),
                              cv.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    detected_flags.add("no_face")
                
                # Check other flags
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
                
                # Determine if cheating (need at least 2 flags)
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
                
                # Log cheating data
                if len(cheating_buffer) > 0:
                    cheating_count = sum(1 for _, cheating in cheating_buffer if cheating)
                    majority_cheating = cheating_count > len(cheating_buffer) / 2
                    self.user_cheating_data[username].append((elapsed_time, majority_cheating))
                
                # Display status
                status_color = (0, 0, 255) if is_cheating else (0, 255, 0)
                status_text = "⚠ SUSPICIOUS ACTIVITY" if is_cheating else "✓ NORMAL"
                cv.putText(frame, status_text, (10, img_h - 20),
                          cv.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
                
                # Display indicators (compact)
                y_offset = 120
                indicators = [
                    (f"Eye: {'✗' if self.eye_cheating else '✓'}", self.eye_cheating),
                    (f"Head: {'✗' if self.head_cheating else '✓'}", self.head_cheating),
                    (f"Sound: {'✗' if self.sound_detected else '✓'}", self.sound_detected),
                    (f"Multi: {'✗' if self.multiple_persons_detected else '✓'}", self.multiple_persons_detected),
                    (f"Book: {'✗' if self.book_detected else '✓'}", self.book_detected),
                    (f"Phone: {'✗' if self.phone_detected else '✓'}", self.phone_detected),
                ]
                
                for text, is_violation in indicators:
                    color = (0, 0, 255) if is_violation else (0, 255, 0)
                    cv.putText(frame, text, (10, y_offset), cv.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                    y_offset += 20
                
                # Encode and yield frame
                try:
                    _, buffer = cv.imencode('.jpg', frame, [cv.IMWRITE_JPEG_QUALITY, 85])
                    frame_bytes = buffer.tobytes()
                    
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                except Exception as e:
                    print(f"Frame encoding error: {e}")
                
                # Reset detection flags
                self.multiple_persons_detected = False
                self.book_detected = False
                self.phone_detected = False
                
                # Check if time is up
                if time_remaining <= 0:
                    print("Time's up! Stopping proctoring.")
                    self.stop_proctoring()
                    break
        
        # Cleanup
        if self.is_recording:
            self.stop_recording()
        
        if self.video_cap is not None:
            self.video_cap.release()
            self.video_cap = None
    
    def start_proctoring(self, username):
        """Start the proctoring system"""
        print(f"Starting proctoring for {username}")
        self.video_feed_active = True
        self.start_time = time.time()
        self.current_username = username
        self.start_audio_detection()
    
    def stop_proctoring(self):
        """Stop the proctoring system"""
        print("Stopping proctoring...")
        self.video_feed_active = False
        self.stop_audio_detection()
        
        # Force save recording even if cheating is ongoing
        if self.is_recording:
            self.stop_recording(force_save=True)
        
        if self.video_cap is not None:
            self.video_cap.release()
            self.video_cap = None

    
    def get_feed_status(self):
        """Get current feed status and time remaining"""
        if self.video_feed_active and self.start_time:
            elapsed_time = time.time() - self.start_time
            time_remaining = max(0, self.total_time - elapsed_time)
            
            if time_remaining <= 0:
                self.stop_proctoring()
            
            return {
                "active": self.video_feed_active,
                "time_remaining": int(time_remaining)
            }
        
        return {
            "active": self.video_feed_active,
            "time_remaining": self.total_time
        }
    
    def get_user_data(self, username):
        """Get cheating data for a specific user"""
        return self.user_cheating_data.get(username, [])