// Firebase config - substituir pelos teus dados
const firebaseConfig = {
  apiKey: "AIzaSyCXbF3jkr02xm_sWz1bmgt0bErHWq_YaYk",
  authDomain: "votacao-show.firebaseapp.com",
  projectId: "votacao-show",
  storageBucket: "votacao-show.firebasestorage.app",
  messagingSenderId: "107375375432",
  appId: "1:107375375432:web:85580dfacac1f1d689d47d",
  measurementId: "G-DEMRG9FCCG"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Votação
if (window.location.pathname.includes("votar.html")) {
  const params = new URLSearchParams(window.location.search);
  const musica = params.get("musica");
  const votacao = params.get("votacao");
  const chave = "votou_" + votacao;

  if (!musica || !votacao) {
    document.getElementById("mensagem").innerText = "Link inválido.";
  } else if (localStorage.getItem(chave)) {
    document.getElementById("mensagem").innerText = "Já votaste nesta votação.";
  } else {
    db.collection("votos").add({
      musica: musica,
      votacao: votacao,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      localStorage.setItem(chave, "true");
      document.getElementById("mensagem").innerText = `Votaste em "${musica}". Obrigado!`;
    });
  }
}

// Resultados
if (window.location.pathname.includes("resultados.html")) {
  const output = document.getElementById("output");
  db.collection("votos").onSnapshot(snapshot => {
    const params = new URLSearchParams(window.location.search);
    const votacao = params.get("votacao") || "";
    const contagem = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.votacao === votacao) {
        contagem[data.musica] = (contagem[data.musica] || 0) + 1;
      }
    });
    output.innerHTML = "";
    for (let m in contagem) {
      output.innerHTML += `<p><strong>${m}</strong>: ${contagem[m]} votos</p>`;
    }
  });
}

// Admin - gerar QR codes
function gerarQRCodes() {
  const votacaoId = document.getElementById("votacaoId").value;
  const m1 = document.getElementById("musica1").value;
  const m2 = document.getElementById("musica2").value;
  const texto = document.getElementById("textoInfo").value;
  const imagem = document.getElementById("imagemURL").value;
  const output = document.getElementById("output");
  output.innerHTML = "";

  if (imagem) {
    const img = document.createElement("img");
    img.src = imagem;
    img.style.maxWidth = "300px";
    output.appendChild(img);
  }
  if (texto) {
    const p = document.createElement("p");
    p.innerText = texto;
    output.appendChild(p);
  }

  [m1, m2].forEach(musica => {
    const div = document.createElement("div");
    const url = `https://teudominio.com/votar.html?musica=${encodeURIComponent(musica)}&votacao=${votacaoId}`;
    QRCode.toCanvas(document.createElement("canvas"), url, (err, canvas) => {
      if (!err) {
        div.appendChild(canvas);
        const label = document.createElement("p");
        label.innerText = musica;
        div.appendChild(label);
        output.appendChild(div);
      }
    });
  });
}
