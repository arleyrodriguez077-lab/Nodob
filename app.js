// Configuración
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
const storage = firebase.storage();

// Guardar Perfil con Foto
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

// Cargar posts con foto de perfil
function cargarPosts() {
    db.collection("posts").orderBy("fecha", "desc").onSnapshot(async snapshot => {
        const feed = document.getElementById('postsList');
        feed.innerHTML = '';
        snapshot.forEach(async doc => {
            const p = doc.data();
            // Buscar la foto del usuario en la colección 'usuarios'
            const userDoc = await db.collection("usuarios").doc(p.usuarioId).get();
            const userData = userDoc.data() || {};
            
            feed.innerHTML += `
                <div class="card">
                    <img src="${userData.fotoURL || 'default.png'}" style="width:40px; border-radius:50%;">
                    <h4>${userData.nombre || 'Anónimo'}</h4>
                    <p>${p.contenido}</p>
                </div>
            `;
        });
    });
}
