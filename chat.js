// عناصر DOM
const micBtn = document.getElementById("micBtn");
const recordingBox = document.getElementById("recordingBox");
const timerDisplay = document.getElementById("timer");
const chat = document.getElementById("chatMessages");

// المتغيرات
let recorder = null;
let chunks = [];
let seconds = 0;
let timerInterval = null;

// تحديث العداد
function updateTimer() {
  seconds++;
  const m = String(Math.floor(seconds/60)).padStart(2,"0");
  const s = String(seconds%60).padStart(2,"0");
  timerDisplay.textContent = `${m}:${s}`;
}

// بدء التسجيل
async function startRecord() {
  if(recorder) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  recorder = new MediaRecorder(stream);
  chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type:"audio/mp3" });
    const url = URL.createObjectURL(blob);
    addMessage(url, "audio");
    recorder = null;
  };
  recorder.start();
  seconds = 0;
  timerDisplay.textContent = "00:00";
  recordingBox.style.display = "block";
  timerInterval = setInterval(updateTimer, 1000);
}

// إيقاف التسجيل
function stopRecord() {
  if(recorder && recorder.state === "recording") recorder.stop();
  recordingBox.style.display = "none";
  clearInterval(timerInterval);
  timerInterval = null;
}

// ربط الأحداث
micBtn.addEventListener("mousedown", startRecord);
micBtn.addEventListener("mouseup", stopRecord);
micBtn.addEventListener("touchstart", startRecord);
micBtn.addEventListener("touchend", stopRecord);

// دالة لإضافة الرسائل (يجب تعريفها أيضاً)
function addMessage(content, type="text") {
  const div = document.createElement("div");
  div.className = "message";
  if(type === "audio") {
    const btn = document.createElement("button");
    btn.className = "voice-btn";
    btn.textContent = "▶️ تشغيل الصوت";
    const audioEl = new Audio(content);

    btn.addEventListener("click", () => {
      document.querySelectorAll(".voice-btn").forEach(b => {
        if(b !== btn && b.audioEl){ b.audioEl.pause(); b.textContent = "▶️ تشغيل الصوت"; }
      });
      if(audioEl.paused){ audioEl.play(); btn.textContent = "⏸ إيقاف"; }
      else { audioEl.pause(); btn.textContent = "▶️ تشغيل الصوت"; }
    });

    btn.audioEl = audioEl;
    div.appendChild(btn);
  } else {
    div.innerHTML = content;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
