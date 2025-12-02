const btn = document.createElement("button");
btn.className = "voice-btn";
btn.textContent = "▶️ تشغيل الصوت";
const audioEl = new Audio(url);

btn.addEventListener("click", () => {
  // إيقاف أي صوت آخر
  document.querySelectorAll(".voice-btn").forEach(b => {
    if(b!==btn && b.audioEl){b.audioEl.pause(); b.textContent="▶️ تشغيل الصوت";}
  });

  if(audioEl.paused){
    audioEl.play(); // التشغيل فقط عند الضغط
    btn.textContent="⏸ إيقاف";
  } else {
    audioEl.pause();
    btn.textContent="▶️ تشغيل الصوت";
  }
});
btn.audioEl = audioEl;
div.appendChild(btn);
