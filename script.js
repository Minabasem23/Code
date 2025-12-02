audio.addEventListener("ended", ()=>{
  playBtn.innerHTML = "▶️"; // إعادة الزر لوضع Play
  progressFilled.style.width = "0%"; // إعادة شريط التقدم للصفر
  audio.currentTime = 0; // إعادة المؤشر للصفر
});
