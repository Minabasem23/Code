function addAudioMessage(url){
  const div = document.createElement("div");
  div.className = "audio";

  const audioEl = document.createElement("audio");
  audioEl.controls = true;
  audioEl.src = url;

  // جعل مشغل الصوت صغير
  audioEl.style.width = "120px";  // عرض صغير مناسب للهاتف
  audioEl.style.height = "25px";  // ارتفاع صغير
  audioEl.style.borderRadius = "8px"; // اختياري لمظهر أفضل

  div.appendChild(audioEl);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
