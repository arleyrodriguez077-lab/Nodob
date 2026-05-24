import { useState, useEffect, useRef, useCallback } from "react";

// ─── Firebase Config (original project keys) ───────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuIjC7DdZiNZu4uwvlme77Yia-pD1unJ8",
  authDomain: "nodob-dc64a.firebaseapp.com",
  projectId: "nodob-dc64a",
  storageBucket: "nodob-dc64a.firebasestorage.app",
  messagingSenderId: "1054231694015",
  appId: "1:1054231694015:web:ec8afddf5cc1183e24140a",
};

// ─── Simulated Data Store (localStorage-backed, no real Firebase needed) ───
const store = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  push: (key, item) => {
    const arr = store.get(key) || [];
    const newItem = { ...item, id: Date.now() + Math.random().toString(36).slice(2) };
    arr.unshift(newItem);
    store.set(key, arr);
    return newItem;
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const avatar = (name) => {
  const colors = ["#6C63FF","#FF6584","#43B89C","#F7B731","#FC5C65","#45AAF2","#26de81","#fd9644"];
  const idx = (name || "?").charCodeAt(0) % colors.length;
  return { bg: colors[idx], letter: (name || "?")[0].toUpperCase() };
};

const SAMPLE_POSTS = [
  { id: "s1", uid: "demo1", username: "luna_azul", content: "A veces el silencio dice más que mil palabras 🌙", ts: Date.now() - 3600000, likes: ["demo2"], comments: [] },
  { id: "s2", uid: "demo2", username: "sol_radiante", content: "Hoy decidí empezar de nuevo. No importa cuántas veces hayas caído, lo que importa es levantarte ✨", ts: Date.now() - 7200000, likes: ["demo1","demo3"], comments: [] },
  { id: "s3", uid: "demo3", username: "viento_libre", content: "El código que escribí hoy es el más limpio que he escrito en mi vida 🎉 pequeñas victorias", ts: Date.now() - 10800000, likes: [], comments: [] },
];

const SAMPLE_CHAT = [
  { id: "c1", uid: "demo1", username: "luna_azul", text: "¡Bienvenidos a ChatLife! 👋", ts: Date.now() - 5400000 },
  { id: "c2", uid: "demo2", username: "sol_radiante", text: "Hola comunidad! Aquí para apoyarnos 💜", ts: Date.now() - 3000000 },
  { id: "c3", uid: "demo3", username: "viento_libre", text: "Este es el mejor espacio 🌟", ts: Date.now() - 1800000 },
];

// ─── CODE SNIPPET ────────────────────────────────────────────────────────────
const APP_CODE = `// Nodob v2 — Firebase Auth + Firestore
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc,
         getDocs, orderBy, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuIjC7DdZiNZu4uwvlme77Yia-pD1unJ8",
  authDomain: "nodob-dc64a.firebaseapp.com",
  projectId: "nodob-dc64a",
  storageBucket: "nodob-dc64a.firebasestorage.app",
  messagingSenderId: "1054231694015",
  appId: "1:1054231694015:web:ec8afddf5cc1183e24140a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// AUTH
export const login = (email, pass) =>
  signInWithEmailAndPassword(auth, email, pass);

export const register = (email, pass) =>
  createUserWithEmailAndPassword(auth, email, pass);

export const logout = () => signOut(auth);

// POSTS
export const createPost = (uid, username, content) =>
  addDoc(collection(db, "posts"), {
    uid, username, content,
    ts: Date.now(), likes: [], comments: []
  });

export const getPosts = async () => {
  const q = query(collection(db, "posts"),
    orderBy("ts", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// CHAT
export const sendMessage = (uid, username, text) =>
  addDoc(collection(db, "chat"), {
    uid, username, text, ts: Date.now()
  });`;

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("auth"); // auth | home | profile | chat | code | album
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const logout = () => {
    setUser(null);
    setView("auth");
    showToast("Sesión cerrada. ¡Hasta pronto! 👋", "info");
  };

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      {toast && <Toast {...toast} />}
      {view === "auth" && <AuthScreen onLogin={(u) => { setUser(u); setView("home"); }} showToast={showToast} />}
      {view !== "auth" && (
        <>
          <Navbar user={user} view={view} setView={setView} onLogout={logout} />
          <main style={S.main}>
            {view === "home"    && <FeedScreen user={user} showToast={showToast} />}
            {view === "profile" && <ProfileScreen user={user} setUser={setUser} showToast={showToast} />}
            {view === "chat"    && <ChatScreen user={user} showToast={showToast} />}
            {view === "album"   && <AlbumScreen user={user} showToast={showToast} />}
            {view === "code"    && <CodeScreen />}
          </main>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onLogin, showToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    if (!email || !pass) return showToast("Completa todos los campos", "error");
    if (mode === "register" && !username) return showToast("Elige un nombre de usuario", "error");
    setLoading(true);
    setTimeout(() => {
      const users = store.get("users") || {};
      if (mode === "register") {
        if (users[email]) { showToast("Este correo ya existe", "error"); setLoading(false); return; }
        const newUser = { email, pass, username: username || email.split("@")[0], bio: "", avatar: "", photos: [] };
        users[email] = newUser;
        store.set("users", users);
        showToast("¡Cuenta creada! Inicia sesión 🎉");
        setMode("login");
      } else {
        const u = users[email];
        if (!u || u.pass !== pass) { showToast("Credenciales incorrectas", "error"); setLoading(false); return; }
        onLogin({ ...u, email });
        showToast(`¡Bienvenido de vuelta, ${u.username}! ✨`);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={S.authBg}>
      <div style={S.authGlow} />
      <div className="auth-card fade-in">
        <div style={S.authLogo}>
          <span style={S.authLogoIcon}>◈</span>
          <span style={S.authLogoText}>NODOB</span>
        </div>
        <p style={S.authSub}>Tu comunidad, tu espacio</p>
        <div style={S.authTabs}>
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Ingresar</button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Registro</button>
        </div>
        {mode === "register" && (
          <input className="auth-input" placeholder="Nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} />
        )}
        <input className="auth-input" type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="auth-input" type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
        <button className="btn-primary auth-btn" onClick={handle} disabled={loading}>
          {loading ? <span className="spinner" /> : mode === "login" ? "Entrar →" : "Crear cuenta →"}
        </button>
        <p style={S.authHint}>
          {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <span style={S.authLink} onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ════════════════════════════════════════════════════════════════════════════
function Navbar({ user, view, setView, onLogout }) {
  const av = avatar(user?.username);
  const navItems = [
    { id: "home", icon: "⊞", label: "Feed" },
    { id: "chat", icon: "◎", label: "ChatLife" },
    { id: "album", icon: "⊡", label: "Album" },
    { id: "code", icon: "⟨/⟩", label: "Código" },
    { id: "profile", icon: "◉", label: "Perfil" },
  ];
  return (
    <nav style={S.nav}>
      <div style={S.navLogo}>◈ <span style={S.navLogoText}>NODOB</span></div>
      <div style={S.navLinks}>
        {navItems.map(n => (
          <button key={n.id} className={`nav-btn ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
            <span style={S.navIcon}>{n.icon}</span>
            <span style={S.navLabel}>{n.label}</span>
          </button>
        ))}
      </div>
      <div style={S.navRight}>
        <div style={{ ...S.navAvatar, background: av.bg }} onClick={() => setView("profile")}>{av.letter}</div>
        <button className="logout-btn" onClick={onLogout} title="Cerrar sesión">⏻</button>
      </div>
    </nav>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FEED SCREEN
// ════════════════════════════════════════════════════════════════════════════
function FeedScreen({ user, showToast }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const saved = store.get("posts") || [];
    setPosts([...SAMPLE_POSTS, ...saved]);
  }, []);

  const publish = () => {
    if (!content.trim()) return showToast("Escribe algo primero", "error");
    const post = store.push("posts", { uid: user.email, username: user.username, content: content.trim(), ts: Date.now(), likes: [], comments: [] });
    setPosts(prev => [post, ...prev]);
    setContent("");
    showToast("¡Publicado! 🚀");
  };

  const toggleLike = (id) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const likes = p.likes.includes(user.email) ? p.likes.filter(l => l !== user.email) : [...p.likes, user.email];
      return { ...p, likes };
    }));
  };

  const filtered = filter === "mine" ? posts.filter(p => p.uid === user.email) : posts;

  return (
    <div className="fade-in" style={S.feedWrap}>
      <div style={S.feedInner}>
        {/* Composer */}
        <div style={S.composer} className="card">
          <div style={S.composerTop}>
            <div style={{ ...S.smallAvatar, background: avatar(user.username).bg }}>{avatar(user.username).letter}</div>
            <textarea
              className="composer-input"
              placeholder={`¿Qué hay en tu mente, ${user.username}?`}
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
            />
          </div>
          <div style={S.composerFoot}>
            <div style={S.charCount}>{content.length}/500</div>
            <button className="btn-primary" onClick={publish}>Publicar ✦</button>
          </div>
        </div>
        {/* Filter */}
        <div style={S.filterRow}>
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Todo el feed</button>
          <button className={`filter-btn ${filter === "mine" ? "active" : ""}`} onClick={() => setFilter("mine")}>Mis posts</button>
        </div>
        {/* Posts */}
        {filtered.map(p => <PostCard key={p.id} post={p} user={user} onLike={toggleLike} showToast={showToast} />)}
        {filtered.length === 0 && <div style={S.empty}>No hay publicaciones aquí aún 🌱</div>}
      </div>
    </div>
  );
}

function PostCard({ post, user, onLike, showToast }) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const av = avatar(post.username);
  const liked = post.likes.includes(user.email);

  const addComment = () => {
    if (!comment.trim()) return;
    const c = { id: Date.now(), uid: user.email, username: user.username, text: comment.trim(), ts: Date.now() };
    setComments(prev => [...prev, c]);
    setComment("");
  };

  return (
    <div className="card post-card fade-in">
      <div style={S.postHead}>
        <div style={{ ...S.postAvatar, background: av.bg }}>{av.letter}</div>
        <div>
          <div style={S.postUser}>@{post.username}</div>
          <div style={S.postTime}>{timeAgo(post.ts)}</div>
        </div>
      </div>
      <p style={S.postContent}>{post.content}</p>
      <div style={S.postActions}>
        <button className={`action-btn ${liked ? "liked" : ""}`} onClick={() => onLike(post.id)}>
          {liked ? "♥" : "♡"} {post.likes.length}
        </button>
        <button className="action-btn" onClick={() => setShowComment(!showComment)}>
          ◎ {comments.length}
        </button>
        <button className="action-btn" onClick={() => { navigator.clipboard?.writeText(post.content); showToast("Copiado al portapapeles"); }}>
          ⎘
        </button>
      </div>
      {showComment && (
        <div style={S.commentBox}>
          {comments.map(c => (
            <div key={c.id} style={S.commentItem}>
              <span style={S.commentUser}>@{c.username}</span> {c.text}
            </div>
          ))}
          <div style={S.commentInput}>
            <input className="inline-input" placeholder="Añade un comentario..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()} />
            <button className="btn-sm" onClick={addComment}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ════════════════════════════════════════════════════════════════════════════
function ProfileScreen({ user, setUser, showToast }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [emoji, setEmoji] = useState(user.emoji || "🌟");
  const [saved, setSaved] = useState(false);

  const posts = [...(store.get("posts") || []), ...SAMPLE_POSTS].filter(p => p.uid === user.email);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

  const saveProfile = () => {
    const users = store.get("users") || {};
    const updated = { ...user, username, bio, emoji };
    users[user.email] = { ...users[user.email], ...updated };
    store.set("users", users);
    setUser(updated);
    setEditing(false);
    setSaved(true);
    showToast("Perfil guardado ✓");
    setTimeout(() => setSaved(false), 2000);
  };

  const av = avatar(username);
  const EMOJIS = ["🌟","🔥","💜","🌙","🦋","🎯","⚡","🌊","🎸","🌈","🦄","💎"];

  return (
    <div className="fade-in" style={S.feedWrap}>
      <div style={S.profileCard} className="card">
        {/* Header */}
        <div style={S.profileHeader}>
          <div style={S.profileBanner} />
          <div style={{ ...S.profileAvBig, background: av.bg }}>
            <span style={S.profileAvLetter}>{av.letter}</span>
            <span style={S.profileEmoji}>{emoji}</span>
          </div>
        </div>
        {/* Info */}
        <div style={S.profileBody}>
          {editing ? (
            <div style={S.editForm}>
              <label style={S.editLabel}>Nombre de usuario</label>
              <input className="auth-input" value={username} onChange={e => setUsername(e.target.value)} />
              <label style={S.editLabel}>Bio</label>
              <textarea className="composer-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Cuéntanos sobre ti..." />
              <label style={S.editLabel}>Emoji</label>
              <div style={S.emojiGrid}>
                {EMOJIS.map(e => (
                  <button key={e} className={`emoji-btn ${emoji === e ? "selected" : ""}`} onClick={() => setEmoji(e)}>{e}</button>
                ))}
              </div>
              <div style={S.editActions}>
                <button className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
                <button className="btn-primary" onClick={saveProfile}>Guardar cambios ✓</button>
              </div>
            </div>
          ) : (
            <>
              <div style={S.profileName}>@{username} <span style={S.profileEmojiInline}>{emoji}</span></div>
              <div style={S.profileEmail}>{user.email}</div>
              <p style={S.profileBio}>{bio || "Sin bio aún. ¡Cuéntanos sobre ti!"}</p>
              <div style={S.profileStats}>
                <div style={S.statItem}><span style={S.statNum}>{posts.length}</span><span style={S.statLbl}>Posts</span></div>
                <div style={S.statDivider} />
                <div style={S.statItem}><span style={S.statNum}>{totalLikes}</span><span style={S.statLbl}>Likes</span></div>
                <div style={S.statDivider} />
                <div style={S.statItem}><span style={S.statNum}>{(store.get("users") || {}) && Object.keys(store.get("users") || {}).length}</span><span style={S.statLbl}>Comunidad</span></div>
              </div>
              <button className="btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => setEditing(true)}>
                Editar perfil ✎
              </button>
            </>
          )}
        </div>
      </div>
      {/* My posts */}
      {!editing && (
        <div style={{ marginTop: 24 }}>
          <div style={S.sectionTitle}>Mis publicaciones</div>
          {posts.length === 0 && <div style={S.empty}>Aún no has publicado nada 🌱</div>}
          {posts.map(p => (
            <div key={p.id} className="card post-card" style={{ marginBottom: 12 }}>
              <p style={S.postContent}>{p.content}</p>
              <div style={S.postTime}>{timeAgo(p.ts)} · ♥ {p.likes?.length || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT SCREEN
// ════════════════════════════════════════════════════════════════════════════
function ChatScreen({ user, showToast }) {
  const [messages, setMessages] = useState([...SAMPLE_CHAT, ...(store.get("chat") || [])]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const msg = store.push("chat", { uid: user.email, username: user.username, text: text.trim(), ts: Date.now() });
    setMessages(prev => [...prev, msg]);
    setText("");
  };

  return (
    <div className="fade-in" style={S.chatWrap}>
      <div style={S.chatHeader}>
        <span style={S.chatDot} />
        <span style={S.chatTitle}>ChatLife — Comunidad Abierta</span>
        <span style={S.chatOnline}>{Object.keys(store.get("users") || {}).length + 
