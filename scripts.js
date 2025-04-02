// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDinh9iXkoxBeHQJ4F7F1sHKTtFVId58cs",
  authDomain: "show-448d0.firebaseapp.com",
  projectId: "show-448d0",
  storageBucket: "show-448d0.appspot.com",
  messagingSenderId: "1094257467234",
  appId: "1:1094257467234:web:284e06d3518e19af6cd63b"
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

  db.collection("votos").where("votacao", "==", votacaoId).get()
    .then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      return batch.commit();
    })
    .then(() => {
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
        const musicaEncoded = encodeURIComponent(musica);
        const votacaoEncoded = encodeURIComponent(votacaoId);
        const url = `https://votacaoqrcode.pt/votar.html?musica=${musicaEncoded}&votacao=${votacaoEncoded}`;

        const linkTexto = document.createElement("p");
        linkTexto.innerText = url;
        linkTexto.style.fontSize = "12px";
        linkTexto.style.color = "#ccc";
        linkTexto.style.marginBottom = "0.5rem";
        div.appendChild(linkTexto);

        QRCode.toCanvas(url, (err, canvas) => {
          if (!err) {
            div.appendChild(canvas);
            const label = document.createElement("p");
            label.innerText = musica;
            label.style.textAlign = "center";
            label.style.marginTop = "0.5rem";
            div.appendChild(label);
            output.appendChild(div);
          }
        });
      });

      mostrarContagemVotos();
    })
    .catch(error => {
      console.error("Erro ao gerar votação:", error);
      alert("Erro ao gerar a votação.");
    });
}

// Contagem dos votos da votação atual
function mostrarContagemVotos() {
  const votacaoId = document.getElementById("votacaoId").value;
  const m1 = document.getElementById("musica1").value;
  const m2 = document.getElementById("musica2").value;
  const contador = document.getElementById("contadorVotos");

  if (!votacaoId || !m1 || !m2 || !contador) return;

  db.collection("votos").onSnapshot(snapshot => {
    let v1 = 0, v2 = 0;
    snapshot.forEach(doc => {
      const d = doc.data();
      if (d.votacao === votacaoId) {
        if (d.musica === m1) v1++;
        if (d.musica === m2) v2++;
      }
    });
    contador.innerText = `${m1}: ${v1} votos\n${m2}: ${v2} votos`;
  });
}

// Ver resultados
function abrirResultados() {
  const votacaoId = document.getElementById("votacaoId").value;
  if (!votacaoId) {
    alert("Escreve o nome da votação primeiro.");
    return;
  }
  window.open(`resultados.html?votacao=${encodeURIComponent(votacaoId)}`, "_blank");
}

// Limpar votação
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
      snapshot.forEach(doc => batch.delete(doc.ref));
      return batch.commit();
    })
    .then(() => {
      alert(`Todos os votos da votação "${votacaoId}" foram apagados.`);
    })
    .catch(error => {
      console.error("Erro ao apagar votos:", error);
      alert("Erro ao apagar os votos.");
    });
}

// Votação (votar.html)
if (window.location.pathname.includes("votar.html")) {
  const params = new URLSearchParams(window.location.search);
  const musica = params.get("musica");
  const votacao = params.get("votacao");
  const chave = "votou_" + votacao;
  const mensagemEl = document.getElementById("mensagem");

  if (!musica || !votacao) {
    mensagemEl.innerText = "Link inválido.";
  } else if (localStorage.getItem(chave)) {
    mensagemEl.innerText = "Já votaste nesta votação.";
  } else {
    db.collection("votos").add({
      musica: musica,
      votacao: votacao,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      localStorage.setItem(chave, "true");
      mensagemEl.innerText = `Votaste em "${musica}". Obrigado!`;
    })
    .catch((err) => {
      console.error("Erro ao votar:", err);
      mensagemEl.innerText = "Erro ao registar o voto.";
    });
  }
}

// Mostrar pedidos de músicas ao vivo (admin.html)
function mostrarPedidosAoVivo() {
  const listaPedidos = document.getElementById("listaPedidos");
  if (!listaPedidos) return;

  db.collection("pedidos").orderBy("votos", "desc")
    .onSnapshot(snapshot => {
      listaPedidos.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement("li");
        li.innerText = `${data.musica} (${data.votos || 0} votos)`;
        listaPedidos.appendChild(li);
      });
    });
}

// Limpar pedidos de músicas
function limparPedidos() {
  if (!confirm("Tens a certeza que queres apagar todos os pedidos de música?")) return;

  db.collection("pedidos").get()
    .then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    })
    .then(() => {
      alert("Todos os pedidos foram apagados.");
    })
    .catch(error => {
      console.error("Erro ao apagar pedidos:", error);
      alert("Erro ao apagar os pedidos.");
    });
}
