import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, setDoc, doc, updateDoc,
  query, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
// تسجيل دخول
// ===============
let userID = prompt("ID الخاص بك:");
let password = prompt("Password:");

if (!userID || !password){
  alert("يجب إدخال ID و Password");
  location.reload();
}

// ===============
// تسجيل المستخدم كـ Online
// ===============
const userRef = doc(db, "users", userID);

async function setOnline(){
  await setDoc(userRef, {
    userID: userID,
    password: password,
    online: true,
    lastActive: serverTimestamp()
  }, { merge: true });
}

async function setOffline(){
  await updateDoc(userRef, {
    online: false,
    lastActive: serverTimestamp()
  });
}

await setOnline();

// تحديث النشاط كل 25 ثانية
setInterval(() => {
  setOnline();
}, 25000);

// عند إغلاق الصفحة → Offline
window.addEventListener("beforeunload", setOffline);


// ====================
// إرسال رسالة
// ====================
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


// ====================
// عرض الرسائل Realtime
// ====================
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


// ====================
// قائمة المستخدمين Online
// ====================
const usersList = document.getElementById("usersList");

onSnapshot(collection(db, "users"), (snapshot)=>{
  usersList.innerHTML = "<h3>Users</h3>";

  snapshot.forEach(doc =>{
    let u = doc.data();

    let row = document.createElement("div");
    row.className = "user";

    row.innerHTML = `
      <span>${u.userID}</span>
      <span class="${u.online ? 'onlineDot' : 'offlineDot'}"></span>
    `;

    usersList.appendChild(row);
  });
});
