document.addEventListener("DOMContentLoaded", () => {

const input = document.getElementById("msgInput");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const chat = document.getElementById("chatMessages");
const recordingBox = document.getElementById("recordingBox");
const timerDisplay = document.getElementById("timer");
const attachBtn = document.getElementById("attachBtn");
const attachMenu = document.getElementById("attachMenu");
const cameraInput = document.getElementById("cameraInput");
const imageInput = document.getElementById("imageInput");
const fileInput = document.getElementById("fileInput");

/* زر مايك ↔ إرسال */
input.addEventListener("input", () => {
  sendBtn.style.display = input.value.trim() ? "block" : "none";
  micBtn.style.display = input.value.trim() ? "none" : "block";
});

/* إرسال النص */
sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if(text) addMessage(text, "text");
  input.value = "";
  micBtn.style.display = "block";
  sendBtn.style.display = "none";
});

/* إضافة رسالة */
function addMessage(content, type="text") {
  const div = document.createElement("div");
  div.className = "message";
  if(type === "img") {
    div.innerHTML = `<img class="chat-img" src="${content}"><div class="status">✓✓ تمت القراءة</div>`;
  } else if(type === "audio") {
    const btn = document.createElement("button");
    btn.className = "voice-btn";
    btn.textContent = "▶️ تشغيل الصوت";
    const audioEl = new Audio(content);

    btn.addEventListener("click", () => {
      document.querySelectorAll(".voice-btn").forEach(b => {
        if(b!==btn && b.audioEl){b.audioEl.pause(); b.textContent="▶️ تشغيل الصوت";}
      });
      if(audioEl.paused){audioEl.play(); btn.textContent="⏸ إيقاف";}
      else {audioEl.pause(); btn.textContent="▶️ تشغيل الصوت";}
    });
    btn.audioEl = audioEl;
    div.appendChild(btn);
    div.innerHTML += `<div class="status">✓✓ تمت القراءة</div>`;
  } else {
    div.innerHTML = `${content}<div class="status">✓✓ تمت القراءة</div>`;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

/* قائمة الدبوس */
attachBtn.addEventListener("click", () => {
  attachMenu.style.display = attachMenu.style.display === "flex" ? "none" : "flex";
});

/* رفع الصور والكاميرا */
document.getElementById("cameraBtn").addEventListener("click", () => cameraInput.click());
document.getElementById("imageBtn").addEventListener("click", () => imageInput.click());
document.getElementById("fileBtn").addEventListener("click", () => fileInput.click());

[cameraInput, imageInput].forEach(inputEl => {
  inputEl.addEventListener("change", function() {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = () => addMessage(reader.result, "img");
    reader.readAsDataURL(file);
  });
});

fileInput.addEventListener("change", function() {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    if(file.type.startsWith("audio")) addMessage(reader.result, "audio");
    else addMessage(reader.result, "text");
  };
  reader.readAsDataURL(file);
});

/* تسجيل الصوت */
let recorder = null;
let stream = null;
let chunks = [];
let seconds = 0;
let timerInterval = null;

function updateTimer() {
  seconds++;
  const m = String(Math.floor(seconds/60)).padStart(2,"0");
  const s = String(seconds%60).padStart(2,"0");
  timerDisplay.textContent = `${m}:${s}`;
}

async function startRecord() {
  if(recorder) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      if(chunks.length === 0) return;
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      addMessage(url, "audio");

      // إغلاق الميكروفون بالكامل
      if(stream){
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      recorder = null;
      chunks = [];
    };
    recorder.start();
    seconds = 0;
    timerDisplay.textContent = "00:00";
    recordingBox.style.display = "block";
    timerInterval = setInterval(updateTimer, 1000);
  } catch(e) {
    alert("تعذر الوصول للميكروفون. تحقق من سماح المتصفح بالوصول للصوت.");
  }
}

function stopRecord() {
  if(recorder && recorder.state === "recording") recorder.stop();
  recordingBox.style.display = "none";
  clearInterval(timerInterval);
  timerInterval = null;
}

micBtn.addEventListener("mousedown", startRecord);
micBtn.addEventListener("mouseup", stopRecord);
micBtn.addEventListener("touchstart", startRecord);
micBtn.addEventListener("touchend", stopRecord);

});
