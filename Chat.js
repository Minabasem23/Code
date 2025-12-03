import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://txmqopzwwzrplanrqvek.supabase.co'
const SUPABASE_KEY = 'YOUR-ANON-KEY-HERE'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- عناصر DOM ---
const loginPage = document.getElementById("loginPage")
const chatContainer = document.getElementById("chatContainer")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const loginBtn = document.getElementById("loginBtn")
const signupBtn = document.getElementById("signupBtn")
const chat = document.getElementById("chatMessages")
const msgInput = document.getElementById("msgInput")
const micBtn = document.getElementById("micBtn")
const attachBtn = document.getElementById("attachBtn")
const attachBar = document.getElementById("attachBar")
const cameraInput = document.getElementById("cameraInput")
const imageInput = document.getElementById("imageInput")
const fileInput = document.getElementById("fileInput")
const recordingBox = document.getElementById("recordingBox")
const timerDisplay = document.getElementById("timer")

let recorder=null, stream=null, chunks=[], seconds=0, timerInterval=null, isRecording=false
let currentUser=null

// --- تسجيل الدخول / إنشاء حساب ---
signupBtn.addEventListener("click", async ()=>{
  const { data, error } = await supabase.auth.signUp({ email: emailInput.value, password: passwordInput.value })
  if(error){ alert(error.message); return }
  currentUser = data.user
  loginPage.style.display="none"
  chatContainer.style.display="flex"
})

loginBtn.addEventListener("click", async ()=>{
  const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value })
  if(error){ alert(error.message); return }
  currentUser = data.user
  loginPage.style.display="none"
  chatContainer.style.display="flex"
  loadMessages()
})

// --- إضافة رسالة ---
function addMessage(content,type="text"){
  const div=document.createElement("div")
  div.className="message"
  if(type==="text") div.innerHTML=`<span class="msg-text">${content}</span><div class="status">Read</div>`
  else if(type==="audio") div.innerHTML=`<audio controls src="${content}"></audio><div class="status">Read</div>`
  else if(type==="img") div.innerHTML=`<img src="${content}" style="max-width:100%; border-radius:8px;"><div class="status">Read</div>`
  chat.appendChild(div)
  chat.scrollTop = chat.scrollHeight
}

// --- تحميل الرسائل السابقة ---
async function loadMessages(){
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending:true })
  if(error){ console.error(error); return }
  data.forEach(msg=>{
    addMessage(msg.content, msg.type)
  })
}

// --- Real-time ---
supabase.channel('public:messages')
.on('postgres_changes', { event:'INSERT', schema:'public', table:'messages'}, payload=>{
  if(payload.new.user_id !== currentUser?.id) addMessage(payload.new.content, payload.new.type)
}).subscribe()

// --- إرسال رسالة نص ---
msgInput.addEventListener("keypress", async (e)=>{
  if(e.key==="Enter" && msgInput.value.trim().length){
    await supabase.from('messages').insert([{user_id:currentUser.id, content:msgInput.value, type:'text'}])
    msgInput.value=""
  }
})

// --- تسجيل صوت ---
function updateTimer(){ seconds++; timerDisplay.textContent=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}` }
async function startRecording(){
  if(isRecording) return; isRecording=true
  stream = await navigator.mediaDevices.getUserMedia({audio:true})
  recorder = new MediaRecorder(stream)
  chunks=[]
  recorder.ondataavailable=e=>chunks.push(e.data)
  recorder.onstop=async ()=>{
    const blob = new Blob(chunks,{type:"audio/mp3"})
    const fileName = `audio_${Date.now()}.mp3`
    const { data, error } = await supabase.storage.from('audios').upload(fileName, blob)
    if(data) addMessage(URL.createObjectURL(blob),"audio")
    stream.getTracks().forEach(t=>t.stop())
    recorder=null; chunks=[]; recordingBox.style.display="none"; clearInterval(timerInterval); seconds=0; isRecording=false
  }
  recorder.start()
  seconds=0; timerDisplay.textContent="00:00"; recordingBox.style.display="block"
  timerInterval = setInterval(updateTimer,1000)
}
function stopRecording(){ if(!isRecording) return; if(recorder && recorder.state==="recording") recorder.stop() }

// --- زر mic ---
micBtn.addEventListener("click", ()=>{
  if(!isRecording) startRecording()
  else stopRecording()
})

// --- شريط المرفقات ---
attachBtn.addEventListener("click", ()=> attachBar.classList.toggle("show"))
document.getElementById("cameraBtn").addEventListener("click",()=>cameraInput.click())
document.getElementById("imageBtn").addEventListener("click",()=>imageInput.click())
document.getElementById("fileBtn").addEventListener("click",()=>fileInput.click())

cameraInput.addEventListener("change", function(){ if(this.files[0]) addMessage(URL.createObjectURL(this.files[0]),"img") })
imageInput.addEventListener("change", function(){ if(this.files[0]) addMessage(URL.createObjectURL(this.files[0]),"img") })
fileInput.addEventListener("change", function(){ if(this.files[0]) addMessage(this.files[0].name,"text") })

// --- Poll ---
document.getElementById("pollBtn").addEventListener("click", ()=>{
  const question = prompt("اكتب سؤال الاستطلاع:")
  if(!question) return
  const option1 = prompt("الخيار الأول:")
  const option2 = prompt("الخيار الثاني:")
  if(option1 && option2) addMessage(`Poll: ${question}\n1: ${option1}\n2: ${option2}`,"text")
})

// --- Location ---
document.getElementById("locationBtn").addEventListener("click", ()=>{
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat = pos.coords.latitude; const lon = pos.coords.longitude;
      addMessage(`Location: https://www.google.com/maps?q=${lat},${lon}`,"text")
    }, ()=>alert("تعذر الحصول على الموقع"))
  } else alert("الموقع غير مدعوم")
})
