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

function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, pass)
    .then(() => {
        document.getElementById('auth-box').style.display = 'none';
        document.getElementById('feed').style.display = 'block';
    })
    .catch(err => alert(err.message));
}

function register() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    firebase.auth().createUserWithEmailAndPassword(email, pass)
    .then(() => alert("Cuenta creada, ahora puedes ingresar"))
    .catch(err => alert(err.message));
}

function publicar() {
    const texto = document.getElementById('postContent').value;
    firebase.firestore().collection("posts").add({
        contenido: texto,
        fecha: new Date(),
        usuario: firebase.auth().currentUser.email
    })
    .then(() => alert("Publicado"));
      }
