<script>
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

  const listaEl = document.getElementById("listaMusicas");
  const respostaEl = document.getElementById("resposta");
  const musicaVotadaTexto = document.getElementById("musicaVotadaTexto");
  const inputEl = document.getElementById("novaMusica");
  const botaoEnviar = document.querySelector("button");

  function getVotada() {
    return localStorage.getItem("musica_votada");
  }

  function setVotada(nome) {
    localStorage.setItem("musica_votada", nome);
    inputEl.disabled = true;
    botaoEnviar.disabled = true;
    musicaVotadaTexto.innerText = `🎧 Já votaste na música: "${nome}"`;
  }

  function jaVotou() {
    return !!getVotada();
  }

  function adicionarMusica() {
    const nome = inputEl.value.trim();
    if (!nome) {
      respostaEl.innerText = "Escreve o nome da música!";
      return;
    }

    if (jaVotou()) {
      respostaEl.innerText = "Já fizeste o teu pedido ou voto.";
      return;
    }

    db.collection("pedidos").where("musica", "==", nome).get().then(snapshot => {
      if (!snapshot.empty) {
        votarMusica(nome);
      } else {
        db.collection("pedidos").add({
          musica: nome,
          votos: 1,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          setVotada(nome);
          inputEl.value = "";
          respostaEl.innerText = "Pedido enviado!";
        });
      }
    });
  }

  function votarMusica(nome) {
    if (jaVotou()) {
      alert("Já votaste numa música.");
      return;
    }

    db.collection("pedidos").where("musica", "==", nome).get().then(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.update({
          votos: firebase.firestore.FieldValue.increment(1)
        }).then(() => {
          setVotada(nome);
        });
      });
    });
  }

  function renderizarLista() {
    db.collection("pedidos").orderBy("votos", "desc").onSnapshot(snapshot => {
      listaEl.innerHTML = "";
      let total = 0;
      snapshot.forEach(doc => total += doc.data().votos || 0);

      const votada = getVotada();
      if (votada) {
        inputEl.disabled = true;
        botaoEnviar.disabled = true;
        musicaVotadaTexto.innerText = `🎧 Já votaste na música: "${votada}"`;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const nome = data.musica;
        const votos = data.votos || 0;
        const percent = total > 0 ? Math.round((votos / total) * 100) : 0;

        const div = document.createElement("div");
        div.className = "musica" + (votada === nome ? " votado" : "");

        const titulo = document.createElement("strong");
        titulo.innerText = nome;
        div.appendChild(titulo);

        const barra = document.createElement("div");
        barra.className = "barra";
        barra.innerHTML = `<div class="preenchimento" style="width:${percent}%">${votos}</div>`;
        div.appendChild(barra);

        const botao = document.createElement("button");
        botao.innerText = votada === nome ? "Já votaste" : "Votar";
        botao.disabled = !!votada;
        botao.onclick = () => votarMusica(nome);
        div.appendChild(botao);

        listaEl.appendChild(div);
      });
    });
  }

  renderizarLista();
</script>
