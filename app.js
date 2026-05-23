// Configuración única para el proyecto "Nodob"
const firebaseConfig = {
  apiKey: "AIzaSyAUijC7DdZiNZu4uwlvme77Yia-pd1unJB",
  authDomain: "nodob-dc64a.firebaseapp.com",
  projectId: "nodob-dc64a",
  storageBucket: "nodob-dc64a.firebasestorage.app",
  messagingSenderId: "1054231694015",
  appId: "1:1054231694015:web:ec8afddf5cc1183e24140a",
  measurementId: "G-44Q6WSNG9Y"
};

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Función: Guardar Perfil con Foto
async function guardarPerfil() {
    const user = auth.currentUser;
    if (!user) { alert("Debes iniciar sesión"); return; }
    
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
    alert("Perfil de Nodo actualizado");
}

// Función: Cargar Muro
function cargarPosts() {
    db.collection("posts").orderBy("fecha", "desc").onSnapshot(snapshot => {
        const feed = document.getElementById('postsList');
        feed.innerHTML = '';
        snapshot.forEach(async doc => {
            const p = doc.data();
            const userDoc = await db.collection("usuarios").doc(p.usuarioId).get();
            const userData = userDoc.data() || { nombre: "Anónimo", fotoURL: "" };
            
            feed.innerHTML += `
                <div class="card" style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:10px; border:1px solid #ccc; border-radius:10px;">
                    <img src="${userData.fotoURL || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:50%; background:#eee;">
                    <div>
                        <strong>${userData.nombre || 'Anónimo'}</strong>
                        <p>${p.contenido}</p>
                    </div>
                </div>
            `;
        });
    });
}
