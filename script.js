copyBtn.addEventListener("click", ()=>{
  const text = div.querySelector(".msg-text").textContent;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try{
    document.execCommand('copy'); // يعمل على معظم المتصفحات
    alert("تم النسخ!");
  } catch(err){
    alert("فشل النسخ");
  }
  document.body.removeChild(textarea);
  toolbar.remove();
});
