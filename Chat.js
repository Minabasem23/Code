// إعداد Supabase
const SUPABASE_URL = 'https://txmqopzwwzrplanrqvek.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// عناصر DOM
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const micBtn = document.getElementById("micBtn");
const recordingBox = document.getElementById("recordingBox");
const timerDisplay = document.getElementById("timer");

let recorder=null, stream=null, chunks=[], seconds=0, timerInterval=null, isRecording=false;
let currentUser = null;

// --- تسجيل صوت ---
function updateTimer(){
  seconds++;
  const m = String(Math.floor(seconds/60)).padStart(2,"0");
  const s = String(seconds%60).padStart(2,"0");
  timerDisplay.textContent = `${m}:${s}`;
}
async function startRecording(){
  if(isRecording) return;
  isRecording = true;
  try{
    stream = await navigator.mediaDevices.getUserMedia({audio:true});
    recorder = new MediaRecorder(stream);
    chunks=[];
    recorder.ondataavailable = e=>chunks.push(e.data);
    recorder.onstop = async ()=>{
      const blob = new Blob(chunks,{type:'audio/mp3'});
      const fileName = `audio_${Date.now()}.mp3`;
      const { data, error } = await supabase.storage.from('audios').upload(fileName, blob);
      if(error) console.error(error);
      else{
        const { publicURL } = supabase.storage.from('audios').getPublicUrl(fileName);
        addMessage(publicURL,"audio");
        await supabase.from('messages').insert([{user_id:currentUser.id, content:publicURL, type:'audio'}]);
      }
      stream.getTracks().forEach(t=>t.stop());
      recorder=null; chunks=[]; recordingBox.style.display='none'; clearInterval(timerInterval); seconds=0; timerDisplay.textContent='00:00'; isRecording=false;
    };
    recorder.start(); seconds=0; timerDisplay.textContent='00:00'; recordingBox.style.display='block';
    timerInterval=setInterval(updateTimer,1000);
  }catch(e){ alert("تعذر الوصول للميكروفون"); isRecording=false; }
}
function stopRecording(){ if(!isRecording) return; if(recorder && recorder.state==="recording") recorder.stop(); recordingBox.style.display='none'; clearInterval(timerInterval); timerInterval=null; seconds=0; timerDisplay.textContent='00:00'; }

// --- إرسال رسالة نصية ---
function addMessage(content,type='text'){
  const msg = document.createElement('div'); msg.className='message';
  const inner = document.createElement('span'); inner.className='msg-text';
  if(type==='text') inner.textContent = content;
  else if(type==='audio') inner.innerHTML = `<audio controls src="${content}"></audio>`;
  msg.appendChild(inner);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// زر Mic
msgInput.addEventListener('input', ()=>{ micBtn.textContent = msgInput.value.trim() ? 'Send':'Mic'; });
micBtn.addEventListener('click', async ()=>{
  if(msgInput.value.trim()){
    const text = msgInput.value;
    addMessage(text,'text');
    await supabase.from('messages').insert([{user_id:currentUser.id, content:text, type:'text'}]);
    msgInput.value=''; micBtn.textContent='Mic';
  }else{ if(!isRecording) startRecording(); else stopRecording(); }
});

// --- تحميل الرسائل السابقة ---
async function loadMessages(){
  const { data,error } = await supabase.from('messages').select('*').order('created_at',{ascending:true});
  if(error) console.error(error);
  else data.forEach(msg=>addMessage(msg.content,msg.type));
}

// --- الاستماع لرسائل جديدة ---
supabase.channel('public:messages')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'}, payload=>{
    if(payload.new.user_id !== currentUser?.id) addMessage(payload.new.content, payload.new.type);
  })
  .subscribe();

// تعيين مستخدم افتراضي مؤقت
currentUser = {id: 'guest_'+Math.floor(Math.random()*10000)};
loadMessages();
