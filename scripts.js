// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDinh9iXkoxBeHQJ4F7F1sHKTtFVId58cs",
  authDomain: "show-448d0.firebaseapp.com",
  projectId: "show-448d0",
  storageBucket: "show-448d0.appspot.com",
  messagingSenderId: "1094257467234",
  appId: "1:1094257467234:web:284e06d3518e19af6cd63b",
  measurementId: "G-4ZDGCVB868"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Gerar QR Codes e guardar votação
function gerarQRCodes() {
  const votacaoId = document.getElementById("votacaoId").value;
  const m1 = document.getElementById("musica1").value;
  const m2 = document.getElementById("musica2").value;
  const texto = document.getElementById("textoInfo").value;
  const imagem = document.getElementById("imagemURL").value;
  const duracao = parseInt(document.getElementById("duracao").value || "120");
  const output = document.getElementById("output");
  output.innerHTML = "";

  if (!votacaoId || !m1 || !m2) {
    alert("Preenche o nome da votação e as opções.");
    return;
  }

  // Apagar votos antigos
  db.collection("votos").where("votacao", "==", votacaoId).get()
    .then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      return batch.commit();
    })
    .then(() => {
      // Guardar nova votação
      return db.collection("votacoes").doc(votacaoId).set({
        titulo: texto,
        op1: m1,
        op2: m2,
        duracao: duracao
      });
    })
    .then(() => {
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
        const url = `https://votacaoqrcode.pt/votar.html?musica=${encodeURIComponent(musica)}&votacao=${votacaoId}`;
        const linkTexto = document.createElement("p");
        linkTexto.innerText = url;
        linkTexto.style.fontSize = "12px";
        linkTexto.style.color = "#555";
        div.appendChild(linkTexto);

        QRCode.toCanvas(url, (err, canvas) => {
          if (!err) {
            div.appendChild(canvas);
            const label = document.createElement("p");
            label.innerText = musica;
            div.appendChild(label);
            output.appendChild(div);
          }
        });
      });
    })
    .catch(error => {
      console.error("Erro ao gerar votação:", error);
      alert("Erro ao gerar a votação.");
    });
}

// Abrir resultados com link correto
function abrirResultados() {
  const votacaoId = document.getElementById("votacaoId").value;
  if (!votacaoId) {
    alert("Escreve o nome da votação primeiro.");
    return;
  }
  window.open(`resultados.html?votacao=${encodeURIComponent(votacaoId)}`, "_blank");
}

// Limpar votação manualmente
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
