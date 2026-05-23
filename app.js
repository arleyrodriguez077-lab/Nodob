const firebaseConfig = {
  apiKey: "AIzaSyBj1byGK044xGVB_UlfG6CsvuWud6v-Sc8",
  authDomain: "nofo-b02b6.firebaseapp.com",
  projectId: "nofo-b02b6",
  storageBucket: "nofo-b02b6.firebasestorage.app",
  messagingSenderId: "461621302989",
  appId: "1:461621302989:web:fbe9298103f55d52937b84",
  measurementId: "G-C2MED93HEV"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Guardar Perfil
async function actualizarPerfil() {
    const user = auth.currentUser;
    const nombre = document.getElementById('nombreUsuario').value;
    const bio = document.getElementById('bioUsuario').value;
    
    await db.collection("usuarios").doc(user.uid).set({
        nombre: nombre,
        bio: bio
    }, { merge: true });
    alert("Perfil actualizado en tu Nodo");
}

// Publicar Post con el nombre del usuario
async function publicar() {
    const texto = document.getElementById('postContent').value;
    const user = auth.currentUser;
    const userDoc = await db.collection("usuarios").doc(user.uid).get();
    const nombre = userDoc.exists ? userDoc.data().nombre : "Usuario";

    db.collection("posts").add({
        contenido: texto,
        nombre: nombre,
        fecha: new Date(),
        usuarioId: user.uid
    });
    document.getElementById('postContent').value = '';
}

// Cargar Muro
function cargarPosts() {
    db.collection("posts").orderBy("fecha", "desc").onSnapshot(snapshot => {
        const feed = document.getElementById('postsList');
        feed.innerHTML = '';
        snapshot.forEach(doc => {
            const p = doc.data();
            feed.innerHTML += `
                <div class="card">
                    <h4>${p.nombre}</h4>
                    <p>${p.contenido}</p>
                </div>
            `;
        });
    });
}

function login() { /* ... igual que antes, llamando a cargarPosts() al final ... */ }
function register() { /* ... igual que antes ... */ }
      
