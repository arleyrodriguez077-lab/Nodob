// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAuIjC7DdZiNZu4uwvlme77Yia-pD1unJ8",
  authDomain: "nodob-dc64a.firebaseapp.com",
  projectId: "nodob-dc64a",
  storageBucket: "nodob-dc64a.firebasestorage.app",
  messagingSenderId: "1054231694015",
  appId: "1:1054231694015:web:ec8afddf5cc1183e24140a",
  measurementId: "G-44Q5WSWG9Y"
};
firebase.initializeApp(firebaseConfig);
// Configuración Real
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

// Función: Guardar Perfil con Foto
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
                <div class="card" style="display:flex; align-items:center; gap:10px;">
                    <img src="${userData.fotoURL}" style="width:50px; height:50px; border-radius:50%; background:#ccc;">
                    <div>
                        <strong>${userData.nombre}</strong>
                        <p>${p.contenido}</p>
                    </div>
                </div>
            `;
        });
    });
}

