// ══════════════════════════════════════════════════
//  NODOB v2 — app.js
//  Firebase Auth + Firestore + localStorage fallback
// ══════════════════════════════════════════════════

// ── Firebase Config ────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAuIjC7DdZiNZu4uwvlme77Yia-pD1unJ8",
  authDomain: "nodob-dc64a.firebaseapp.com",
  projectId: "nodob-dc64a",
  storageBucket: "nodob-dc64a.firebasestorage.app",
  messagingSenderId: "1054231694015",
  appId: "1:1054231694015:web:ec8afddf5cc1183e24140a",
};

// ── State ──────────────────────────────────────────
let currentUser   = null;
let currentFilter = 'all';
let authMode      = 'login';
let lightboxPhotoId = null;
let chatInterval  = null;

// ── Storage helpers ────────────────────────────────
const store = {
  get:  (k)        => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set:  (k, v)     => localStorage.setItem(k, JSON.stringify(v)),
  push: (k, item)  => {
    const arr = store.get(k) || [];
    const newItem = { ...item, id: Date.now().toString(36) + Math.random().toString(36).slice(2) };
    arr.unshift(newItem);
    store.set(k, arr);
    return newItem;
  },
};

// ── Sample data ────────────────────────────────────
const SAMPLE_POSTS = [
  { id: 'sp1', uid: 'demo1', username: 'luna_azul',    content: 'A veces el silencio dice más que mil palabras 🌙', ts: Date.now() - 3600000,  likes: ['demo2'], comments: [] },
  { id: 'sp2', uid: 'demo2', username: 'sol_radiante', content: 'Hoy decidí empezar de nuevo. No importa cuántas veces hayas caído, lo que importa es levantarte ✨', ts: Date.now() - 7200000,  likes: ['demo1','demo3'], comments: [] },
  { id: 'sp3', uid: 'demo3', username: 'viento_libre', content: 'El código que escribí hoy es el más limpio que he escrito en mi vida 🎉 pequeñas victorias', ts: Date.now() - 10800000, likes: [], comments: [] },
];

const SAMPLE_CHAT = [
  { id: 'sc1', uid: 'demo1', username: 'luna_azul',    text: '¡Bienvenidos a ChatLife! 👋',                   ts: Date.now() - 5400000 },
  { id: 'sc2', uid: 'demo2', username: 'sol_radiante', text: 'Hola comunidad! Aquí para apoyarnos 💜',        ts: Date.now() - 3000000 },
  { id: 'sc3', uid: 'demo3', username: 'viento_libre', text: 'Este es el mejor espacio para compartir 🌟',   ts: Date.now() - 1800000 },
];

const CODE_SNIPPET = `// Nodob v2 — Firebase Auth + Firestore
// Conecta tu proyecto y descomenta para usar en producción

const firebaseConfig = {
  apiKey: "AIzaSyAuIjC7DdZiNZu4uwvlme77Yia-pD1unJ8",
  authDomain: "nodob-dc64a.firebaseapp.com",
  projectId: "nodob-dc64a",
  storageBucket: "nodob-dc64a.firebasestorage.app",
  messagingSenderId: "1054231694015",
  appId: "1:1054231694015:web:ec8afddf5cc1183e24140a",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ── AUTH ──────────────────────────────────────────
function login(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function register(email, password) {
  return auth.createUserWithEmailAndPassword(email, password);
}

function logout() {
  return auth.signOut();
}

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Usuario:", user.email);
  } else {
    console.log("Sin sesión");
  }
});

// ── POSTS ─────────────────────────────────────────
function createPost(uid, username, content) {
  return db.collection("posts").add({
    uid, username, content,
    ts: Date.now(),
    likes: [],
    comments: [],
  });
}

async function getPosts() {
  const snap = await db.collection("posts")
    .orderBy("ts", "desc")
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function likePost(postId, userId) {
  const ref = db.collection("posts").doc(postId);
  return db.runTransaction(async tx => {
    const doc = await tx.get(ref);
    const likes = doc.data().likes || [];
    const updated = likes.includes(userId)
      ? likes.filter(l => l !== userId)
      : [...likes, userId];
    tx.update(ref, { likes: updated });
  });
}

// ── CHAT ──────────────────────────────────────────
function sendChatMessage(uid, username, text) {
  return db.collection("chat").add({ uid, username, text, ts: Date.now() });
}

function listenChat(callback) {
  return db.collection("chat")
    .orderBy("ts", "asc")
    .onSnapshot(snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(msgs);
    });
}`;

// ── Utilities ──────────────────────────────────────
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

const AVATAR_COLORS = ['#6C63FF','#FF6584','#43B89C','#F7B731','#FC5C65','#45AAF2','#26de81','#fd9644'];
function avatarColor(name) {
  return AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];
}
function avatarLetter(name) {
  return (name || '?')[0].toUpperCase();
}

function showToast(msg, type = 'success') {
  const colors = { success: '#26de81', error: '#FC5C65', info: '#45AAF2' };
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.borderLeft = `4px solid ${colors[type] || colors.success}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function el(id) { return document.getElementById(id); }

// ══════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════
function switchTab(mode) {
  authMode = mode;
  el('tab-login').classList.toggle('active', mode === 'login');
  el('tab-register').classList.toggle('active', mode === 'register');
  el('register-fields').style.display = mode === 'register' ? 'block' : 'none';
  el('auth-btn').textContent = mode === 'login' ? 'Entrar →' : 'Crear cuenta →';
  el('auth-hint').innerHTML = mode === 'login'
    ? '¿No tienes cuenta? <span class="auth-link" onclick="switchTab(\'register\')">Regístrate</span>'
    : '¿Ya tienes cuenta? <span class="auth-link" onclick="switchTab(\'login\')">Inicia sesión</span>';
}

function handleAuth() {
  const email    = el('auth-email').value.trim();
  const pass     = el('auth-pass').value;
  const username = el('reg-username') ? el('reg-username').value.trim() : '';

  if (!email || !pass) return showToast('Completa todos los campos', 'error');
  if (authMode === 'register' && !username) return showToast('Elige un nombre de usuario', 'error');

  const btn = el('auth-btn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  setTimeout(() => {
    const users = store.get('users') || {};

    if (authMode === 'register') {
      if (users[email]) {
        showToast('Este correo ya está registrado', 'error');
        btn.textContent = 'Crear cuenta →'; btn.disabled = false; return;
      }
      users[email] = { email, pass, username, bio: '', emoji: '🌟', photos: [] };
      store.set('users', users);
      showToast('¡Cuenta creada! Inicia sesión 🎉');
      switchTab('login');
      btn.textContent = 'Entrar →'; btn.disabled = false;
    } else {
      const u = users[email];
      if (!u || u.pass !== pass) {
        showToast('Credenciales incorrectas', 'error');
        btn.textContent = 'Entrar →'; btn.disabled = false; return;
      }
      currentUser = { ...u, email };
      initApp();
    }
  }, 700);
}

function logout() {
  currentUser = null;
  clearInterval(chatInterval);
  el('screen-auth').style.display = 'flex';
  el('screen-app').style.display  = 'none';
  showToast('Sesión cerrada. ¡Hasta pronto! 👋', 'info');
}

// ══════════════════════════════════════════════════
//  APP INIT
// ══════════════════════════════════════════════════
function initApp() {
  el('screen-auth').style.display = 'none';
  el('screen-app').style.display  = 'block';

  // Nav avatar
  const av = el('nav-avatar');
  av.style.background = avatarColor(currentUser.username);
  av.textContent = avatarLetter(currentUser.username);

  // Composer avatar
  const ca = el('composer-avatar');
  if (ca) { ca.style.background = avatarColor(currentUser.username); ca.textContent = avatarLetter(currentUser.username); }

  showToast(`¡Bienvenido, ${currentUser.username}! ✨`);
  setView('home');
}

// ══════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════
function setView(view) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  el('view-' + view).style.display = 'block';
  const btn = document.querySelector(`[data-view="${view}"]`);
  if (btn) btn.classList.add('active');

  clearInterval(chatInterval);

  if (view === 'home')    renderFeed();
  if (view === 'chat')    initChat();
  if (view === 'album')   renderAlbum();
  if (view === 'code')    renderCode();
  if (view === 'profile') renderProfile();
}

// ══════════════════════════════════════════════════
//  FEED
// ══════════════════════════════════════════════════
function getPosts() {
  const saved = store.get('posts') || [];
  return [...SAMPLE_POSTS, ...saved];
}

function renderFeed() {
  const posts = getPosts();
  const filtered = currentFilter === 'mine'
    ? posts.filter(p => p.uid === currentUser.email)
    : posts;

  const container = el('posts-list');
  container.innerHTML = '';

  // Refresh composer avatar
  const ca = el('composer-avatar');
  if (ca) { ca.style.background = avatarColor(currentUser.username); ca.textContent = avatarLetter(currentUser.username); }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty">No hay publicaciones aquí aún 🌱</div>';
    return;
  }

  filtered.forEach(p => {
    const liked = p.likes && p.likes.includes(currentUser.email);
    const color = avatarColor(p.username);
    const letter = avatarLetter(p.username);
    const comments = p.comments || [];

    const card = document.createElement('div');
    card.className = 'card post-card fade-in';
    card.id = 'post-' + p.id;
    card.innerHTML = `
      <div class="post-head">
        <div class="post-avatar" style="background:${color}">${letter}</div>
        <div>
          <div class="post-user">@${p.username}</div>
          <div class="post-time">${timeAgo(p.ts)}</div>
        </div>
      </div>
      <p class="post-content">${escapeHTML(p.content)}</p>
      <div class="post-actions">
        <button class="action-btn ${liked ? 'liked' : ''}" onclick="toggleLike('${p.id}')">
          ${liked ? '♥' : '♡'} ${(p.likes || []).length}
        </button>
        <button class="action-btn" onclick="toggleComments('${p.id}')">
          ◎ ${comments.length}
        </button>
        <button class="action-btn" onclick="copyText(\`${escapeAttr(p.content)}\`)">⎘</button>
      </div>
      <div id="comments-${p.id}" class="comment-box" style="display:none;">
        <div id="comments-list-${p.id}">
          ${comments.map(c => `
            <div class="comment-item">
              <span class="comment-user">@${escapeHTML(c.username)}</span>
              ${escapeHTML(c.text)}
            </div>`).join('')}
        </div>
        <div class="comment-input">
          <input class="inline-input" id="ci-${p.id}" placeholder="Añade un comentario..."
            onkeydown="if(event.key==='Enter')addComment('${p.id}')" />
          <button class="btn-sm" onclick="addComment('${p.id}')">↑</button>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function updateCharCount() {
  const v = el('post-content').value;
  el('char-count').textContent = v.length + '/500';
}

function publishPost() {
  const content = (el('post-content').value || '').trim();
  if (!content) return showToast('Escribe algo primero', 'error');
  if (content.length > 500) return showToast('Máximo 500 caracteres', 'error');

  store.push('posts', {
    uid: currentUser.email,
    username: currentUser.username,
    content,
    ts: Date.now(),
    likes: [],
    comments: [],
  });

  el('post-content').value = '';
  el('char-count').textContent = '0/500';
  renderFeed();
  showToast('¡Publicado! 🚀');
}

function filterPosts(mode) {
  currentFilter = mode;
  el('filter-all').classList.toggle('active', mode === 'all');
  el('filter-mine').classList.toggle('active', mode === 'mine');
  renderFeed();
}

function toggleLike(postId) {
  let posts = store.get('posts') || [];
  // Try in saved posts first
  let found = false;
  posts = posts.map(p => {
    if (p.id !== postId) return p;
    found = true;
    const likes = p.likes.includes(currentUser.email)
      ? p.likes.filter(l => l !== currentUser.email)
      : [...p.likes, currentUser.email];
    return { ...p, likes };
  });
  if (found) store.set('posts', posts);
  // Sample posts — just re-render toggled in memory
  renderFeed();
}

function toggleComments(postId) {
  const box = el('comments-' + postId);
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function addComment(postId) {
  const input = el('ci-' + postId);
  const text = input.value.trim();
  if (!text) return;

  const comment = {
    id: Date.now().toString(36),
    uid: currentUser.email,
    username: currentUser.username,
    text,
    ts: Date.now(),
  };

  // Save if it's a user post
  let posts = store.get('posts') || [];
  posts = posts.map(p => {
    if (p.id !== postId) return p;
    return { ...p, comments: [...(p.comments || []), comment] };
  });
  store.set('posts', posts);

  // Append to DOM
  const list = el('comments-list-' + postId);
  const div = document.createElement('div');
  div.className = 'comment-item';
  div.innerHTML = `<span class="comment-user">@${escapeHTML(comment.username)}</span> ${escapeHTML(text)}`;
  list.appendChild(div);
  input.value = '';
}

function copyText(text) {
  navigator.clipboard?.writeText(text).then(() => showToast('Copiado al portapapeles ⎘'));
}

// ══════════════════════════════════════════════════
//  CHAT
// ══════════════════════════════════════════════════
function initChat() {
  renderChat();
  el('chat-online').textContent = (Object.keys(store.get('users') || {}).length + 3) + ' en línea';
  // Simula recepción en tiempo real
  chatInterval = setInterval(() => { renderChat(false); }, 3000);
}

function renderChat(scroll = true) {
  const msgs = [...SAMPLE_CHAT, ...(store.get('chat') || [])];
  const container = el('chat-messages');
  container.innerHTML = '';

  msgs.forEach(m => {
    const mine = m.uid === currentUser.email;
    const color = avatarColor(m.username);
    const letter = avatarLetter(m.username);

    const row = document.createElement('div');
    row.className = 'msg-row';
    row.style.justifyContent = mine ? 'flex-end' : 'flex-start';
    row.innerHTML = `
      ${!mine ? `<div class="msg-avatar" style="background:${color}">${letter}</div>` : ''}
      <div style="max-width:72%">
        ${!mine ? `<div class="msg-user">@${escapeHTML(m.username)}</div>` : ''}
        <div class="msg-bubble ${mine ? 'msg-mine' : 'msg-other'}">${escapeHTML(m.text)}</div>
        <div class="msg-time" style="text-align:${mine ? 'right' : 'left'}">${timeAgo(m.ts)}</div>
      </div>`;
    container.appendChild(row);
  });

  if (scroll) container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const text = el('chat-text').value.trim();
  if (!text) return;
  store.push('chat', { uid: currentUser.email, username: currentUser.username, text, ts: Date.now() });
  el('chat-text').value = '';
  renderChat();
}

// ══════════════════════════════════════════════════
//  ALBUM
// ══════════════════════════════════════════════════
function getPhotos() { return store.get('album_' + currentUser.email) || []; }
function savePhotos(photos) { store.set('album_' + currentUser.email, photos); }

function renderAlbum() {
  const photos = getPhotos();
  el('album-count').textContent = photos.length + '/100 fotos';
  el('progress-fill').style.width = ((photos.length / 100) * 100) + '%';

  const grid = el('photo-grid');
  grid.innerHTML = '';

  if (photos.length === 0) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Tu álbum está vacío. ¡Sube tu primera foto! 🖼️</div>';
    return;
  }

  photos.forEach(p => {
    const cell = document.createElement('div');
    cell.className = 'photo-cell';
    cell.onclick = () => openLightbox(p.id);
    cell.innerHTML = `
      <img src="${p.src}" alt="${escapeHTML(p.name)}" loading="lazy" />
      <div class="photo-overlay">
        <span class="photo-name">${escapeHTML(p.name || '').substring(0, 14)}</span>
      </div>`;
    grid.appendChild(cell);
  });
}

function addPhotos(files) {
  const photos = getPhotos();
  const remaining = 100 - photos.length;
  const arr = Array.from(files).slice(0, remaining);

  if (arr.length === 0) return showToast('Límite de 100 fotos alcanzado', 'error');

  let loaded = 0;
  arr.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      photos.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), src: e.target.result, name: file.name, ts: Date.now() });
      loaded++;
      if (loaded === arr.length) {
        savePhotos(photos);
        renderAlbum();
        showToast(arr.length + ' foto(s) agregada(s) 📸');
      }
    };
    reader.readAsDataURL(file);
  });
}

function handleDrop(e) {
  e.preventDefault();
  el('drop-zone').classList.remove('active');
  addPhotos(e.dataTransfer.files);
}

function openLightbox(photoId) {
  const photos = getPhotos();
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return;
  lightboxPhotoId = photoId;
  el('lightbox-img').src = photo.src;
  el('lightbox-name').textContent = photo.name + ' · ' + timeAgo(photo.ts);
  el('lightbox').style.display = 'flex';
}

function closeLightbox() {
  el('lightbox').style.display = 'none';
  lightboxPhotoId = null;
}

function deleteCurrentPhoto() {
  if (!lightboxPhotoId) return;
  let photos = getPhotos().filter(p => p.id !== lightboxPhotoId);
  savePhotos(photos);
  closeLightbox();
  renderAlbum();
  showToast('Foto eliminada');
}

// ══════════════════════════════════════════════════
//  CODE
// ══════════════════════════════════════════════════
function renderCode() {
  el('code-block').textContent = CODE_SNIPPET;

  const configData = {
    apiKey:            firebaseConfig.apiKey,
    authDomain:        firebaseConfig.authDomain,
    projectId:         firebaseConfig.projectId,
    storageBucket:     firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId:             firebaseConfig.appId,
  };

  const grid = el('config-grid');
  grid.innerHTML = Object.entries(configData).map(([k, v]) => `
    <div class="config-row">
      <span class="config-key">${k}</span>
      <span class="config-val">${v}</span>
    </div>`).join('');
}

function copyCode() {
  const code = el('code-block').textContent;
  navigator.clipboard?.writeText(code).then(() => {
    const btn = el('copy-btn');
    btn.textContent = '✓ Copiado!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '⎘ Copiar código'; btn.classList.remove('copied'); }, 2200);
  });
}

// ══════════════════════════════════════════════════
//  NODOB v2 — Corregido
// ══════════════════════════════════════════════════

// ... (MANTÉN TODO TU CÓDIGO ANTERIOR HASTA LA LÍNEA 450) ...
// (Todo lo anterior está bien, solo reemplaza desde la función renderProfile en adelante)

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function renderProfile() {
  const container = el('profile-body');
  if (!currentUser) return;

  const posts = [...SAMPLE_POSTS, ...(store.get('posts') || [])].filter(p => p.uid === currentUser.email);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);
  const users = store.get('users') || {};
  
  const color = avatarColor(currentUser.username);
  const letter = avatarLetter(currentUser.username);

  // Actualizar avatar grande
  const avBig = el('profile-av-big');
  avBig.style.background = color;
  avBig.textContent = letter;

  container.innerHTML = `
    <div class="profile-name">${escapeHTML(currentUser.username)}</div>
    <div class="profile-email">${escapeHTML(currentUser.email)}</div>
    <div class="profile-bio">${escapeHTML(currentUser.bio || '¡Hola! Soy parte de la comunidad Nodob.')}</div>
    <div class="profile-stats">
      <div class="stat-item"><span class="stat-num">${posts.length}</span><span class="stat-lbl">Posts</span></div>
      <div class="stat-divider"></div>
      <div class="stat-item"><span class="stat-num">${totalLikes}</span><span class="stat-lbl">Likes recibidos</span></div>
    </div>
  `;
  }
      
