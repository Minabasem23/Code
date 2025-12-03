import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, doc, setDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -------------------- Firebase --------------------
const firebaseConfig = {
  apiKey: "AIzaSyDE5gTP0iw08VNtePyumzBfAFXY4e0Mh2w",
  authDomain: "chat-7f10e.firebaseapp.com",
  projectId: "chat-7f10e",
  storageBucket: "chat-7f10e.firebasestorage.app",
  messagingSenderId: "1038789383884",
  appId: "1:1038789383884:web:f7fded882a72f9e878d469",
  measurementId: "G-BY21EVL7B2"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -------------------- Elements --------------------
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const micBtn = document.getElementById("micBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");
const usersList = document.getElementById("usersList");
const recordingBox = document.getElementById("recordingBox");
const timerDisplay = document.getElementById("timer");

// -------------------- حساب عشوائي --------------------
function randomID(len=8){
  let s='', chars='0123456789';
  for(let i=0;i<len;i++) s+=chars.charAt(Math.floor(Math.random()*chars.length));
  return s;
}

let userID = localStorage.getItem("chatUserID");
let password = localStorage.getItem("chatPassword");

if(!userID){
  userID = randomID(8);
  password = randomID(6);
  localStorage.setItem("chatUserID", userID);
  localStorage.setItem("chatPassword", password);
}

const userRef = doc(db,"users",userID);

// -------------------- Online + Last Seen --------------------
async function setOnline(){
  await setDoc(userRef,{userID,password,online:true,lastActive:serverTimestamp()},{merge:true});
}
async function setOffline(){
  await updateDoc(userRef,{online:false,lastActive:serverTimestamp()});
}
setOnline();
setInterval(()=>setOnline(),25000);
window.addEventListener("beforeunload",setOffline);

// -------------------- Load Users --------------------
function loadUsers(){
  onSnapshot(collection(db,"users"),snapshot=>{
    usersList.innerHTML="<h3>Users</h3>";
    snapshot.forEach(doc=>{
      let u=doc.data();
      let row=document.createElement("div");
      row.className="user";
      row.innerHTML=`<span>${u.userID}</span><span class="${u.online?'onlineDot':'offlineDot'}"></span>`;
      usersList.appendChild(row);
    });
  });
}
loadUsers();

// -------------------- Send Message --------------------
async function sendMessage(type,text,targetID=null){
  await addDoc(collection(db,"messages"),{
    sender:userID,
    password:password,
    type,
    text,
    targetID,
    time: Date.now()
  });
}

// نص
msgInput.addEventListener("keydown",e=>{
  if(e.key==="Enter" && msgInput.value.trim()!==""){
    sendMessage("text",msgInput.value);
    msgInput.value="";
  }
});

// -------------------- Load Messages --------------------
function loadMessages(){
  const q=query(collection(db,"messages"),orderBy("time","asc"));
  onSnapshot(q,snapshot=>{
    chatBox.innerHTML="";
    snapshot.forEach(doc=>{
      let d=doc.data();
      if(!d.targetID || d.targetID===userID || d.sender===userID){
        let div=document.createElement("div");
        div.className="message";
        if(d.type==="text") div.textContent=d.text;
        if(d.type==="img") div.innerHTML=`<img src="${d.text}">`;
        if(d.type==="audio") div.innerHTML=`<audio controls src="${d.text}"></audio>`;

        // Toolbar حذف
        div.addEventListener("click",()=>{
          const toolbar=document.createElement("div");
          toolbar.className="msg-toolbar";
          const delBtn=document.createElement("button"); delBtn.textContent="Delete";
          toolbar.appendChild(delBtn);
          document.body.appendChild(toolbar);
          const rect=div.getBoundingClientRect();
          toolbar.style.top=rect.top+window.scrollY-40+"px";
          toolbar.style.left=rect.left+"px";

          delBtn.onclick=async ()=>{
            await deleteDoc(doc(db,"messages",doc.id));
            toolbar.remove();
          };

          document.addEventListener("click",function hide(ev){
            if(!div.contains(ev.target)&&!toolbar.contains(ev.target)){
              toolbar.remove();
              document.removeEventListener("click",hide);
            }
          });
        });

        chatBox.appendChild(div);

        // إشعار
        if(d.sender!==userID) new Audio('https://freesound.org/data/previews/522/522461_10688507-lq.mp3').play();
      }
    });
    chatBox.scrollTop=chatBox.scrollHeight;
  });
}
loadMessages();

// -------------------- الصور --------------------
imageBtn.addEventListener("click",()=>imageInput.click());
imageInput.addEventListener("change",function(){
  const file=this.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>sendMessage("img",reader.result);
  reader.readAsDataURL(file);
});

// -------------------- تسجيل الصوت --------------------
let recorder=null, stream=null, chunks=[], seconds=0, timerInterval=null, isRecording=false;

function updateTimer(){seconds++;timerDisplay.textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
async function startRecording(){if(isRecording) return; isRecording=true;
  try{
    if(stream){stream.getTracks().forEach(t=>t.stop()); stream=null;}
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    recorder=new MediaRecorder(stream); chunks=[];
    recorder.ondataavailable=e=>chunks.push(e.data);
    recorder.onstop=()=>{
      if(chunks.length>0){const blob=new Blob(chunks,{type:"audio/mp3"}); const url=URL.createObjectURL(blob); sendMessage("audio",url);}
      if(stream){stream.getTracks().forEach(t=>t.stop()); stream=null;}
      recorder=null; chunks=[]; recordingBox.style.display="none"; clearInterval(timerInterval); timerInterval=null; seconds=0; isRecording=false;
    };
    recorder.start(); seconds=0; timerDisplay.textContent="00:00"; recordingBox.style.display="block";
    timerInterval=setInterval(updateTimer,1000);
  }catch(e){alert("تعذر الوصول للميكروفون"); console.error(e); isRecording=false;}
}
function stopRecording(){if(!isRecording) return; if(recorder&&recorder.state==="recording") recorder.stop(); recordingBox.style.display="none"; clearInterval(timerInterval); timerInterval=null; seconds=0; timerDisplay.textContent="00:00"; isRecording=false;}

micBtn.addEventListener("click",()=>{if(!isRecording) startRecording(); else stopRecording();});
