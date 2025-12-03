// ===============
// 1) Firebase
// ===============
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ===============
// 2) إعدادات المستخدم
// ===============
let userID = prompt("اكتب ID الخاص بك (مثال: 1234):");
let password = prompt("اكتب كلمة المرور:");

if (!userID || !password){
  alert("يجب إدخال ID و كلمة مرور");
  location.reload();
}

// ===============
// 3) إرسال رسالة
// ===============
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");

sendBtn.addEventListener("click", async ()=>{

  if(msgInput.value.trim() === "") return;

  await addDoc(collection(db, "messages"), {
    sender: userID,
    password: password,
    type: "text",
    text: msgInput.value,
    time: Date.now()
  });

  msgInput.value = "";
});
  
// ===============
// 4) تحميل الرسائل realtime
// ===============
const q = query(collection(db, "messages"), orderBy("time", "asc"));

onSnapshot(q, (snapshot)=>{
  chatBox.innerHTML = "";
  
  snapshot.forEach(doc =>{
    let data = doc.data();

    if(data.sender === userID && data.password === password){
      let div = document.createElement("div");
      div.className = "message";
      div.textContent = data.text;
      chatBox.appendChild(div);
    }
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});
