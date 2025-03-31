db.collection("votos").limit(1).get().then(() => {
  console.log("Ligação ao Firebase OK");
}).catch(err => {
  console.error("Erro ao ligar ao Firebase:", err);
});


// Firebase config - substituir pelos teus dados
const firebaseConfig = {
  apiKey: "AIzaSyCXbF3jkr02xm_sWz1bmgt0bErHWq_YaYk",
  authDomain: "votacao-show.appspot.com",
  projectId: "votacao-show",
  storageBucket: "votacao-show.appspot.com",
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
})
.then(() => {
  localStorage.setItem(chave, "true");
  document.getElementById("mensagem").innerText = `Votaste em "${musica}". Obrigado!`;
})
.catch((error) => {
  console.error("Erro ao votar:", error);
  document.getElementById("mensagem").innerText = "Erro ao votar. Verifica as permissões do Firebase.";
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
    const url = `https://votacao-j5ya07gzu-diogorosas-projects-ef1e36ce.vercel.app/votar.html?musica=${encodeURIComponent(musica)}&votacao=${votacaoId}`;

    // Mostrar o link visível
    const linkTexto = document.createElement("p");
    linkTexto.innerText = url;
    linkTexto.style.fontSize = "12px";
    linkTexto.style.color = "#555";
    div.appendChild(linkTexto);

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

// Admin - limpar votos de uma votação
function limparVotacao() {
  const votacaoId = document.getElementById("votacaoId").value;
  if (!votacaoId) {
    alert("Tens de escrever o nome da votação que queres limpar.");
    return;
  }

  if (!confirm(`Tens a certeza que queres apagar todos os votos de "${votacaoId}"?`)) {
    return;
  }

  db.collection("votos").where("votacao", "==", votacaoId).get()
    .then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    })
    .then(() => {
      alert(`Todos os votos da votação "${votacaoId}" foram apagados.`);
    })
    .catch(error => {
      console.error("Erro ao apagar votos:", error);
      alert("Ocorreu um erro ao tentar limpar os votos.");
    });
}
