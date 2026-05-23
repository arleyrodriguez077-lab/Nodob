const firebaseConfig = {
  apiKey: "AIzaSyAUijC7DdZiNZu4uwlvme77Yia-pd1unJB",
  authDomain: "nodob-dc64a.firebaseapp.com",
  projectId: "nodob-dc64a",
  storageBucket: "nodob-dc64a.firebasestorage.app",
  messagingSenderId: "1054231694015",
  appId: "1:1054231694015:web:ec8afddf5cc1183e24140a",
  measurementId: "G-44Q6WSNG9Y"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, pass)
    .then(() => { document.getElementById('auth-box').style.display = 'none'; document.getElementById('feed').style.display = 'block'; cargarPosts(); })
    .catch(err => alert(err.message));
}

function register() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, pass)
    .then(() => alert("Registrado, ahora puedes ingresar"))
    .catch(err => alert(err.message));
}

async function publicar() {
    const texto = document.getElementById('postContent').value;
    db.collection("posts").add({ contenido: texto, usuarioId: auth.currentUser.uid, fecha: new Date() })
    .then(() => { document.getElementById('postContent').value = ''; });
}

async function guardarPerfil() {
    const user = auth.currentUser;
    const file = document.getElementById('fotoInput').files[0];
    let fotoURL = "";
    if (file) {
        const ref = storage.ref('fotos/' + user.uid);
        await ref.put(file);
        fotoURL = await ref.getDownloadURL();
    }
    await db.collection("usuarios").doc(user.uid).set({
        nombre: document.getElementById('nombreUsuario').value,
        bio: document.getElementById('bioUsuario').value,
        fotoURL: fotoURL
    }, { merge: true });
    alert("Perfil guardado");
}

function cargarPosts() {
    db.collection("posts").orderBy("fecha", "desc").onSnapshot(snapshot => {
        const feed = document.getElementById('postsList');
        feed.innerHTML = '';
        snapshot.forEach(async doc => {
            const p = doc.data();
            const userDoc = await db.collection("usuarios").doc(p.usuarioId).get();
            const userData = userDoc.data() || { nombre: "Anónimo", fotoURL: "" };
            feed.innerHTML += `<div class="card"><strong>${userData.nombre}</strong><p>${p.contenido}</p></div>`;
        });
    });
}
  
