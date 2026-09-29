// ============================================================================
// ABA: PORTFÓLIO — vídeos do site + estatísticas de visita
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;
  var videosAtuais = [];
  var arrastandoId = null;

  window.AdminPortfolio = { iniciar: iniciar };

  async function iniciar() {
    document.getElementById("btn-novo-video").addEventListener("click", function () {
      abrirFormVideo(null);
    });
    document.getElementById("form-video").addEventListener("submit", salvarVideo);
    document.getElementById("btn-apagar-video").addEventListener("click", apagarVideoAtual);

    await Promise.all([carregarVideos(), carregarEstatisticasVisita()]);
  }

  // ---- VÍDEOS ---------------------------------------------------------------
  async function carregarVideos() {
    var resultado = await U.consulta("videos",
      window.bancoCliente.from("videos").select("*").order("ordem", { ascending: true })
    );
    videosAtuais = resultado.data || [];
    renderizarTabelaVideos();
    renderizarStatsVideos();
  }

  function renderizarStatsVideos() {
    var noAr = videosAtuais.filter(function (v) { return v.visivel; }).length;
    var contagemNicho = {};
    videosAtuais.forEach(function (v) {
      if (!v.visivel || !v.nicho) return;
      contagemNicho[v.nicho] = (contagemNicho[v.nicho] || 0) + 1;
    });
    var nichoForte = "—";
    var maior = 0;
    Object.keys(contagemNicho).forEach(function (n) {
      if (contagemNicho[n] > maior) { maior = contagemNicho[n]; nichoForte = n; }
    });
    document.getElementById("stats-portfolio").innerHTML = "";
    var container = document.getElementById("stats-portfolio");
    [
      { rotulo: "vídeos no ar", valor: String(noAr) },
      { rotulo: "nicho mais forte", valor: nichoForte }
    ].forEach(function (s) {
      var card = U.criarEl("div", "stat-card");
      card.appendChild(U.criarEl("span", "stat-valor", U.escapar(s.valor)));
      card.appendChild(U.criarEl("p", "stat-rotulo", s.rotulo));
      container.appendChild(card);
    });
    // as duas estatísticas de visita (14 dias / hoje / origem) entram depois,
    // em carregarEstatisticasVisita, na mesma grade.
  }

  function renderizarTabelaVideos() {
    var corpo = document.getElementById("corpo-tabela-videos");
    var aviso = document.getElementById("aviso-videos-vazio");
    corpo.innerHTML = "";
    if (videosAtuais.length === 0) {
      aviso.style.display = "block";
      aviso.textContent = "Nenhum vídeo cadastrado ainda. Clique em \"Novo vídeo\" pra adicionar o primeiro.";
      return;
    }
    aviso.style.display = "none";

    videosAtuais.forEach(function (video) {
      var tr = document.createElement("tr");
      tr.draggable = true;
      tr.dataset.id = video.id;

      var tdAlca = document.createElement("td");
      tdAlca.className = "alca-arrastar";
      tdAlca.innerHTML = U.icone("arrastar");
      tr.appendChild(tdAlca);

      var tdTitulo = document.createElement("td");
      tdTitulo.textContent = video.titulo || "—";
      if (String(video.titulo || "").toLowerCase().indexOf("exemplo") !== -1) {
        tdTitulo.innerHTML = U.escapar(video.titulo) + ' <span class="pilula pilula-exemplo">exemplo</span>';
      }
      tr.appendChild(tdTitulo);

      var tdMarca = document.createElement("td");
      tdMarca.textContent = video.marca || "—";
      tr.appendChild(tdMarca);

      var tdNicho = document.createElement("td");
      tdNicho.textContent = video.nicho || "—";
      tr.appendChild(tdNicho);

      var tdDestaque = document.createElement("td");
      tdDestaque.textContent = video.destaque || "—";
      tr.appendChild(tdDestaque);

      var tdVisivel = document.createElement("td");
      var btnOlho = document.createElement("button");
      btnOlho.className = "btn-icone";
      btnOlho.title = video.visivel ? "Visível no site (clique pra esconder)" : "Escondido do site (clique pra mostrar)";
      btnOlho.innerHTML = U.icone(video.visivel ? "olhoAberto" : "olhoFechado");
      btnOlho.addEventListener("click", function () { alternarVisivel(video); });
      tdVisivel.appendChild(btnOlho);
      tr.appendChild(tdVisivel);

      var tdAcoes = document.createElement("td");
      var btnEditar = document.createElement("button");
      btnEditar.className = "btn-icone";
      btnEditar.innerHTML = U.icone("editar");
      btnEditar.title = "Editar";
      btnEditar.addEventListener("click", function () { abrirFormVideo(video); });
      tdAcoes.appendChild(btnEditar);
      tr.appendChild(tdAcoes);

      // arrastar pra reordenar
      tr.addEventListener("dragstart", function () { arrastandoId = video.id; tr.classList.add("arrastando"); });
      tr.addEventListener("dragend", function () { tr.classList.remove("arrastando"); });
      tr.addEventListener("dragover", function (e) { e.preventDefault(); tr.classList.add("alvo-arrasto"); });
      tr.addEventListener("dragleave", function () { tr.classList.remove("alvo-arrasto"); });
      tr.addEventListener("drop", function (e) {
        e.preventDefault();
        tr.classList.remove("alvo-arrasto");
        if (arrastandoId && arrastandoId !== video.id) reordenar(arrastandoId, video.id);
      });

      corpo.appendChild(tr);
    });
  }

  async function reordenar(idArrastado, idAlvo) {
    var indiceOrigem = videosAtuais.findIndex(function (v) { return v.id === idArrastado; });
    var indiceDestino = videosAtuais.findIndex(function (v) { return v.id === idAlvo; });
    if (indiceOrigem === -1 || indiceDestino === -1) return;
    var item = videosAtuais.splice(indiceOrigem, 1)[0];
    videosAtuais.splice(indiceDestino, 0, item);
    renderizarTabelaVideos();

    var atualizacoes = videosAtuais.map(function (v, indice) {
      return window.bancoCliente.from("videos").update({ ordem: indice }).eq("id", v.id);
    });
    videosAtuais.forEach(function (v, indice) { v.ordem = indice; });
    await Promise.all(atualizacoes);
    U.toast("Ordem atualizada.");
  }

  async function alternarVisivel(video) {
    video.visivel = !video.visivel;
    renderizarTabelaVideos();
    var resultado = await U.consulta("videos",
      window.bancoCliente.from("videos").update({ visivel: video.visivel }).eq("id", video.id)
    );
    if (!resultado.error) U.toast(video.visivel ? "Vídeo visível no site." : "Vídeo escondido do site.");
  }

  function abrirFormVideo(video) {
    var form = document.getElementById("form-video");
    form.reset();
    document.getElementById("video-id").value = video ? video.id : "";
    document.getElementById("video-titulo").value = video ? (video.titulo || "") : "";
    document.getElementById("video-link").value = video ? (video.link || "") : "";
    document.getElementById("video-nicho").value = video ? (video.nicho || "") : "";
    document.getElementById("video-formato").value = video ? (video.formato || "") : "";
    document.getElementById("video-marca").value = video ? (video.marca || "") : "";
    document.getElementById("video-destaque").value = video ? (video.destaque || "") : "";
    document.getElementById("video-visivel").checked = video ? !!video.visivel : true;
    document.getElementById("titulo-modal-video").textContent = video ? "Editar vídeo" : "Novo vídeo";
    document.getElementById("btn-apagar-video").style.display = video ? "inline-flex" : "none";
    U.abrirModal("modal-video");
  }

  async function salvarVideo(e) {
    e.preventDefault();
    var id = document.getElementById("video-id").value;
    var dados = {
      titulo: document.getElementById("video-titulo").value.trim(),
      link: document.getElementById("video-link").value.trim() || null,
      nicho: document.getElementById("video-nicho").value.trim() || null,
      formato: document.getElementById("video-formato").value.trim() || null,
      marca: document.getElementById("video-marca").value.trim() || null,
      destaque: document.getElementById("video-destaque").value.trim() || null,
      visivel: document.getElementById("video-visivel").checked
    };
    var resultado;
    if (id) {
      resultado = await U.consulta("videos", window.bancoCliente.from("videos").update(dados).eq("id", id));
    } else {
      dados.ordem = videosAtuais.length;
      resultado = await U.consulta("videos", window.bancoCliente.from("videos").insert(dados));
    }
    if (resultado.error) return;
    U.fecharModal("modal-video");
    U.toast("Vídeo salvo.");
    await carregarVideos();
  }

  async function apagarVideoAtual() {
    var id = document.getElementById("video-id").value;
    if (!id) return;
    if (!confirm("Apagar este vídeo? Essa ação não pode ser desfeita.")) return;
    var resultado = await U.consulta("videos", window.bancoCliente.from("videos").delete().eq("id", id));
    if (resultado.error) return;
    U.fecharModal("modal-video");
    U.toast("Vídeo apagado.");
    await carregarVideos();
  }

  // ---- VISITAS ---------------------------------------------------------------
  async function carregarEstatisticasVisita() {
    var quatorzeDiasAtras = new Date();
    quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 13);
    quatorzeDiasAtras.setHours(0, 0, 0, 0);

    var resultado = await U.consulta("visitas",
      window.bancoCliente.from("visitas").select("criado_em, origem").gte("criado_em", quatorzeDiasAtras.toISOString())
    );
    var visitas = resultado.data || [];

    var hojeISO = U.hojeISO();
    var visitasHoje = visitas.filter(function (v) { return String(v.criado_em).slice(0, 10) === hojeISO; }).length;

    var statsContainer = document.getElementById("stats-portfolio");
    var card14 = U.criarEl("div", "stat-card");
    card14.appendChild(U.criarEl("span", "stat-valor", String(visitas.length)));
    card14.appendChild(U.criarEl("p", "stat-rotulo", "visitas em 14 dias"));
    statsContainer.insertBefore(card14, statsContainer.firstChild);

    var cardHoje = U.criarEl("div", "stat-card");
    cardHoje.appendChild(U.criarEl("span", "stat-valor", String(visitasHoje)));
    cardHoje.appendChild(U.criarEl("p", "stat-rotulo", "visitas hoje"));
    statsContainer.insertBefore(cardHoje, statsContainer.children[1]);

    // origem mais comum
    var contagemOrigem = {};
    visitas.forEach(function (v) {
      var origem = v.origem || "direto";
      contagemOrigem[origem] = (contagemOrigem[origem] || 0) + 1;
    });
    var origens = Object.keys(contagemOrigem).map(function (o) { return { nome: o, total: contagemOrigem[o] }; });
    origens.sort(function (a, b) { return b.total - a.total; });

    var cardOrigem = U.criarEl("div", "stat-card");
    cardOrigem.appendChild(U.criarEl("span", "stat-valor", origens.length ? origens[0].nome : "—"));
    cardOrigem.appendChild(U.criarEl("p", "stat-rotulo", "de onde mais vêm"));
    statsContainer.appendChild(cardOrigem);

    renderizarGraficoVisitas(visitas, quatorzeDiasAtras);
    renderizarListaOrigens(origens, visitas.length);
  }

  function renderizarGraficoVisitas(visitas, inicio) {
    var container = document.getElementById("grafico-visitas");
    container.innerHTML = "";
    if (visitas.length === 0) {
      container.appendChild(U.criarEl("p", "aviso-vazio", "Quando as pessoas começarem a visitar o seu portfólio, o gráfico dos últimos 14 dias aparece aqui."));
      return;
    }

    var contagemPorDia = {};
    var dias = [];
    for (var i = 0; i < 14; i++) {
      var d = new Date(inicio);
      d.setDate(d.getDate() + i);
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      dias.push(iso);
      contagemPorDia[iso] = 0;
    }
    visitas.forEach(function (v) {
      var dia = String(v.criado_em).slice(0, 10);
      if (contagemPorDia.hasOwnProperty(dia)) contagemPorDia[dia]++;
    });
    var maximo = Math.max.apply(null, dias.map(function (d) { return contagemPorDia[d]; }));
    if (maximo === 0) maximo = 1;

    var grafico = U.criarEl("div", "grafico-barras");
    dias.forEach(function (dia) {
      var coluna = U.criarEl("div", "grafico-coluna");
      var altura = Math.max(3, Math.round((contagemPorDia[dia] / maximo) * 120));
      var barra = U.criarEl("div", "grafico-barra");
      barra.style.height = altura + "px";
      barra.title = dia + ": " + contagemPorDia[dia] + " visita(s)";
      var rotulo = U.criarEl("span", "grafico-rotulo", dia.slice(8, 10) + "/" + dia.slice(5, 7));
      coluna.appendChild(barra);
      coluna.appendChild(rotulo);
      grafico.appendChild(coluna);
    });
    container.appendChild(grafico);
  }

  function renderizarListaOrigens(origens, total) {
    var container = document.getElementById("lista-origens");
    container.innerHTML = "";
    if (origens.length === 0) {
      container.appendChild(U.criarEl("p", "aviso-vazio", "Assim que houver visitas, aqui aparece de onde as pessoas vieram (Instagram, Google, direto etc.)."));
      return;
    }
    origens.slice(0, 6).forEach(function (o) {
      var linha = U.criarEl("div");
      linha.style.cssText = "display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--borda); font-size:.84rem;";
      var pct = total > 0 ? Math.round((o.total / total) * 100) : 0;
      linha.innerHTML = "<span>" + U.escapar(o.nome) + "</span><span style='color:var(--texto-suave);'>" + o.total + " (" + pct + "%)</span>";
      container.appendChild(linha);
    });
  }
})();
