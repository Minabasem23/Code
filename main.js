/* main.js
   chat private (ID↔ID) using Firebase Auth, Firestore and Storage (compat)
   - Save this file as main.js in same folder as index.html
   - Replace firebaseConfig with your project's config
*/

/* 1) ضع هنا إعدادات Firebase من Console */
const firebaseConfig = {
  apiKey: "PUT_YOUR_apiKey",
  authDomain: "PUT_YOUR_authDomain",
  projectId: "PUT_YOUR_projectId",
  storageBucket: "PUT_YOUR_storageBucket",
  messagingSenderId: "PUT_YOUR_messagingSenderId",
  appId: "PUT_YOUR_appId"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

/* DOM */
const loginPanel = document.getElementById('loginPanel');
const chatPanel = document.getElementById('chatPanel');
const loginBtn = document.getElementById('loginBtn');
const signOutBtn = document.getElementById('signOutBtn');
const loginId = document.getElementById('loginId');
const loginPass = document.getElementById('loginPass');
const userInfo = document.getElementById('userInfo');

const startChatBtn = document.getElementById('startChatBtn');
const chatWith = document.getElementById('chatWith');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

const imgBtn = document.getElementById('imgBtn');
const fileBtn = document.getElementById('fileBtn');
const imageInput = document.getElementById('imageInput');
const fileInput = document.getElementById('fileInput');

const recordBtn = document.getElementById('recordBtn');

let currentUserId = null;
let otherUserId = null;
let convoId = null;
let unsubscribeMessages = null;

/* ---------- Auth (ID -> email trick) ---------- */
function idToEmail(id){
  // safety: keep domain fixed
  return `${id}@chatapp.local`;
}

/* Login / create user */
loginBtn.addEventListener('click', async ()=>{
  const id = loginId.value.trim();
  const pw = loginPass.value;
  if(!id || !pw){ alert('أدخل ID وPassword'); return; }
  const email = idToEmail(id);
  try{
    await auth.signInWithEmailAndPassword(email,pw);
  }catch(e){
    // create account automatically
    try{
      await auth.createUserWithEmailAndPassword(email,pw);
    }catch(err){
      alert('Auth Error: '+err.message);
      return;
    }
  }
  currentUserId = id;
  onUserLogged();
});

/* Sign out */
signOutBtn.addEventListener('click', async ()=>{
  await auth.signOut();
  currentUserId = null;
  userInfo.textContent = 'غير مسجل';
  chatPanel.classList.add('hidden');
  loginPanel.classList.remove('hidden');
  signOutBtn.classList.add('hidden');
  if(unsubscribeMessages){ unsubscribeMessages(); unsubscribeMessages = null; }
});

/* When logged in */
function onUserLogged(){
  userInfo.textContent = `مسجل: ${currentUserId}`;
  loginPanel.classList.add('hidden');
  chatPanel.classList.remove('hidden');
  signOutBtn.classList.remove('hidden');
}

/* ---------- Start private chat ---------- */
startChatBtn.addEventListener('click', ()=>{
  const target = chatWith.value.trim();
  if(!target){ alert('أدخل ID الطرف الآخر'); return; }
  if(target === currentUserId){ alert('لا يمكنك الدردشة مع نفس الID'); return; }
  otherUserId = target;
  convoId = makeConvoId(currentUserId, otherUserId);
  // subscribe messages
  if(unsubscribeMessages) unsubscribeMessages();
  subscribeMessages(convoId);
  messagesEl.innerHTML = '';
});

/* create stable convoId by sorting IDs */
function makeConvoId(a,b){
  return (a < b) ? `${a}_${b}` : `${b}_${a}`;
}

/* listen messages in convo */
function subscribeMessages(convo){
  unsubscribeMessages = db.collection('messages')
    .where('convoId','==',convo)
    .orderBy('timestamp')
    .onSnapshot(snapshot=>{
      messagesEl.innerHTML = '';
      snapshot.forEach(doc=>{
        const msg = doc.data();
        renderMessage(msg);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, err => {
      console.error('subscribe error',err);
    });
}

/* render message */
function renderMessage(msg){
  const div = document.createElement('div');
  div.className = 'msg' + (msg.senderId === currentUserId ? '' : ' other');

  if(msg.type === 'text'){
    const sp = document.createElement('div'); sp.textContent = msg.text; div.appendChild(sp);
  } else if(msg.type === 'image'){
    const img = document.createElement('img'); img.src = msg.url; img.className = 'preview'; div.appendChild(img);
  } else if(msg.type === 'audio'){
    const audio = document.createElement('audio'); audio.controls = true; audio.src = msg.url; div.appendChild(audio);
  } else if(msg.type === 'file'){
    const a = document.createElement('a'); a.href = msg.url; a.textContent = msg.name || 'file'; a.target = '_blank'; div.appendChild(a);
  }

  const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `${msg.senderId} · ${new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : Date.now()).toLocaleString()}`;
  div.appendChild(meta);

  // toolbar: copy / edit / delete for own messages (simple)
  div.addEventListener('click', (e)=>{
    e.stopPropagation();
    showMsgToolbar(div, msg);
  });

  messagesEl.appendChild(div);
}

/* simple toolbar (copy / edit only for own text messages / delete if own) */
function showMsgToolbar(elem, msg){
  const existing = document.querySelector('.msg-toolbar');
  if(existing) existing.remove();

  const toolbar = document.createElement('div'); toolbar.className='msg-toolbar';
  toolbar.style.top = (elem.getBoundingClientRect().top + window.scrollY - 44) + 'px';
  toolbar.style.left = elem.getBoundingClientRect().left + 'px';

  // Copy
  const btnCopy = document.createElement('button'); btnCopy.textContent='Copy';
  btnCopy.onclick = ()=>{
    let toCopy = '';
    if(msg.type === 'text') toCopy = msg.text;
    else if(msg.type === 'image' || msg.type === 'audio' || msg.type==='file') toCopy = msg.url || msg.name || '';
    const ta = document.createElement('textarea'); ta.value = toCopy; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    toolbar.remove();
    alert('Copied');
  };
  toolbar.appendChild(btnCopy);

  // Edit (only own text)
  if(msg.senderId === currentUserId && msg.type === 'text'){
    const btnEdit = document.createElement('button'); btnEdit.textContent='Edit';
    btnEdit.onclick = async ()=>{
      const newText = prompt('Edit message:', msg.text);
      if(newText !== null){
        // find the doc and update - simple approach: query by timestamp+convo+sender
        const q = await db.collection('messages')
          .where('convoId','==',convoId)
          .where('senderId','==',currentUserId)
          .where('timestamp','==',msg.timestamp)
          .get();
        q.forEach(d=> d.ref.update({ text: newText }));
      }
      toolbar.remove();
    };
    toolbar.appendChild(btnEdit);
  }

  // Delete (only own)
  if(msg.senderId === currentUserId){
    const btnDel = document.createElement('button'); btnDel.textContent='Delete';
    btnDel.onclick = async ()=>{
      const q = await db.collection('messages')
        .where('convoId','==',convoId)
        .where('senderId','==',currentUserId)
        .where('timestamp','==',msg.timestamp)
        .get();
      q.forEach(d=> d.ref.delete());
      toolbar.remove();
    };
    toolbar.appendChild(btnDel);
  }

  document.body.appendChild(toolbar);
  document.addEventListener('click', function hide(ev){
    if(!toolbar.contains(ev.target) && !elem.contains(ev.target)){
      toolbar.remove();
      document.removeEventListener('click', hide);
    }
  });
}

/* ---------- Sending messages ---------- */
sendBtn.addEventListener('click', sendText);
messageInput.addEventListener('keydown', (e)=> { if(e.key === 'Enter') sendText(); });

async function sendText(){
  const txt = messageInput.value.trim();
  if(!txt || !convoId) return;
  await db.collection('messages').add({
    convoId,
    senderId: currentUserId,
    receiverId: otherUserId,
    type: 'text',
    text: txt,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  messageInput.value = '';
}

/* Images/files */
imgBtn.addEventListener('click', ()=> imageInput.click());
fileBtn.addEventListener('click', ()=> fileInput.click());

imageInput.addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f || !convoId) return;
  const path = `images/${convoId}/${Date.now()}_${f.name}`;
  const ref = storage.ref(path);
  await ref.put(f);
  const url = await ref.getDownloadURL();
  await db.collection('messages').add({
    convoId, senderId: currentUserId, receiverId: otherUserId, type:'image', url, timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  imageInput.value = '';
});

fileInput.addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f || !convoId) return;
  const path = `files/${convoId}/${Date.now()}_${f.name}`;
  const ref = storage.ref(path);
  await ref.put(f);
  const url = await ref.getDownloadURL();
  await db.collection('messages').add({
    convoId, senderId: currentUserId, receiverId: otherUserId, type:'file', url, name: f.name, timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  fileInput.value = '';
});

/* ---------- Audio recording & upload ---------- */
let mediaRecorder = null;
let audioChunks = [];

recordBtn.addEventListener('click', async ()=>{
  if(!convoId){ alert('افتح محادثة أولاً'); return; }
  if(!mediaRecorder){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = e=> audioChunks.push(e.data);
      mediaRecorder.onstop = async ()=>{
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const path = `audios/${convoId}/${Date.now()}.webm`;
        const ref = storage.ref(path);
        await ref.put(blob);
        const url = await ref.getDownloadURL();
        await db.collection('messages').add({
          convoId, senderId: currentUserId, receiverId: otherUserId, type:'audio', url, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        mediaRecorder = null;
        audioChunks = [];
        recordBtn.textContent = '🎤';
      };
      mediaRecorder.start();
      recordBtn.textContent = '⏹️'; // now stops
    }catch(err){ alert('تعذر الوصول للميكروفون'); console.error(err); }
  } else {
    // stop
    mediaRecorder.stop();
  }
});

/* ---------- On auth state change (optional) ---------- */
auth.onAuthStateChanged(user=>{
  if(user){
    // extract id from email before @
    const e = user.email || '';
    currentUserId = e.split('@')[0];
    userInfo.textContent = `مسجل: ${currentUserId}`;
    loginPanel.classList.add('hidden');
    chatPanel.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');
  } else {
    currentUserId = null;
    userInfo.textContent = 'غير مسجل';
    loginPanel.classList.remove('hidden');
    chatPanel.classList.add('hidden');
    signOutBtn.classList.add('hidden');
    if(unsubscribeMessages){ unsubscribeMessages(); unsubscribeMessages = null; }
  }
});

/* ---------- Notes ----------
- ضع قواعد الأمان المناسبة في Firestore/Storage قبل الإطلاق.
- ملفات الصوت مخزنة في Firebase Storage (webm). */
