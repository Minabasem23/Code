let cancelRecording = false;
let startY = 0;
const cancelThreshold = 60; // عدد البكسلات لسحب الإصبع لأعلى لإلغاء التسجيل

micBtn.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
  cancelRecording = false;
  startRecord();
});

micBtn.addEventListener("touchmove", (e) => {
  const currentY = e.touches[0].clientY;
  if(startY - currentY > cancelThreshold) {
    cancelRecording = true;
    recordingBox.textContent = "❌ تم إلغاء التسجيل";
  } else {
    recordingBox.textContent = `🔴 جاري التسجيل… <span id="timer">${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}</span>`;
  }
});

micBtn.addEventListener("touchend", () => {
  if(cancelRecording) {
    // إلغاء التسجيل
    if(recorder && recorder.state === "recording") recorder.stop();
    chunks = []; // حذف أي بيانات صوتية
    recordingBox.style.display = "none";
  } else {
    stopRecord(); // إنهاء التسجيل وإرسال الصوت
  }
});
