// ============================================================================
// ABA: MÍDIA KIT E.C: vídeos, contatos e visitas do mídia kit
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;
  var videosAtuais = [];
  var arrastandoId = null;

  window.AdminMidiaKit = { iniciar: iniciar };

  async function iniciar() {
    document.getElementById("kit-btn-novo-video").addEventListener("click", function () {
      abrirFormVideo(null);
    });
    document.getElementById("kit-form-video").addEventListener("submit", salvarVideo);
    document.getElementById("kit-btn-apagar-video").addEventListener("click", apagarVideoAtual);

    document.addEventListener("aba-ativada", function (e) {
      if (e.detail === "midiakit") carregarLeads();
    });

    await Promise.all([carregarVideos(), carregarEstatisticasVisita(), carregarLeads()]);
  }

  // ---- CONTATOS QUE CHEGARAM PELO SITE ----------------------------------------------
  var leadsAtuais = [];

  async function carregarLeads() {
    var resultado = await U.consulta("midia_kit_leads",
      window.bancoCliente.from("midia_kit_leads").select("*").order("criado_em", { ascending: false }).limit(200)
    );
    leadsAtuais = resultado.data || [];
    renderizarLeads(!!resultado.error);
  }

  function renderizarLeads(faltaTabela) {
    var corpo = document.getElementById("kit-corpo-tabela-leads");
    var aviso = document.getElementById("kit-aviso-leads-vazio");
    var selo = document.getElementById("kit-leads-novos");
    corpo.innerHTML = "";

    var novos = leadsAtuais.filter(function (l) { return !l.lido; }).length;
    selo.style.display = novos > 0 ? "inline-flex" : "none";
    selo.textContent = novos + (novos === 1 ? " novo" : " novos");

    if (faltaTabela) {
      aviso.style.display = "block";
      aviso.textContent = "A tabela de contatos do mídia kit ainda não existe. Rode o arquivo supabase-midia-kit.sql no Supabase.";
      return;
    }
    if (leadsAtuais.length === 0) {
      aviso.style.display = "block";
      aviso.textContent = "Nenhum contato ainda. Quando uma marca preencher o formulário do seu mídia kit, ela aparece aqui.";
      return;
    }
    aviso.style.display = "none";

    leadsAtuais.forEach(function (lead) {
      var tr = document.createElement("tr");
      if (!lead.lido) tr.className = "lead-novo";

      var quando = lead.criado_em ? new Date(lead.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
      var tdQuando = document.createElement("td");
      tdQuando.style.whiteSpace = "nowrap";
      tdQuando.textContent = quando;
      tr.appendChild(tdQuando);

      var tdNome = document.createElement("td");
      tdNome.innerHTML = "<b>" + U.escapar(lead.nome) + "</b>";
      tr.appendChild(tdNome);

      var tdEmail = document.createElement("td");
      if (lead.email) {
        var link = document.createElement("a");
        link.href = "mailto:" + lead.email;
        link.textContent = lead.email;
        link.style.color = "var(--azul)";
        tdEmail.appendChild(link);
      } else {
        tdEmail.textContent = "—";
      }
      tr.appendChild(tdEmail);

      var tdMsg = document.createElement("td");
      tdMsg.className = "lead-mensagem";
      tdMsg.textContent = textoDoLead(lead) || "—";
      tr.appendChild(tdMsg);

      var tdAcoes = document.createElement("td");
      tdAcoes.style.whiteSpace = "nowrap";

      var btnLido = document.createElement("button");
      btnLido.className = "btn-icone";
      btnLido.title = lead.lido ? "Marcar como não lido" : "Marcar como lido";
      btnLido.innerHTML = U.icone(lead.lido ? "olhoFechado" : "olhoAberto");
      btnLido.addEventListener("click", function () { alternarLido(lead); });
      tdAcoes.appendChild(btnLido);

      var btnMarcas = document.createElement("button");
      btnMarcas.className = "btn btn-outline";
      btnMarcas.style.cssText = "padding:5px 10px; font-size:.72rem; margin:0 4px;";
      btnMarcas.textContent = "Mandar para Marcas";
      btnMarcas.title = "Cria a marca na sua base e tira este contato daqui";
      btnMarcas.addEventListener("click", function () { mandarParaMarcas(lead); });
      tdAcoes.appendChild(btnMarcas);

      var btnApagar = document.createElement("button");
      btnApagar.className = "btn-icone";
      btnApagar.title = "Apagar";
      btnApagar.innerHTML = U.icone("apagar");
      btnApagar.addEventListener("click", function () { apagarLead(lead); });
      tdAcoes.appendChild(btnApagar);

      tr.appendChild(tdAcoes);
      corpo.appendChild(tr);
    });
  }

  // Junta os campos do formulário do mídia kit em um texto só
  function textoDoLead(lead) {
    var partes = [];
    if (lead.origem === "captura") partes.push("Pediu o mídia kit completo");
    if (lead.marca) partes.push("Marca: " + lead.marca);
    if (lead.whatsapp) partes.push("WhatsApp: " + lead.whatsapp);
    if (lead.servico) partes.push("Precisa de: " + lead.servico);
    if (lead.prazo) partes.push("Para quando: " + lead.prazo);
    if (lead.idioma && lead.idioma !== "pt") partes.push("Idioma: " + lead.idioma.toUpperCase());
    if (lead.mensagem) partes.push(lead.mensagem);
    return partes.join(" | ");
  }

  async function alternarLido(lead) {
    lead.lido = !lead.lido;
    renderizarLeads(false);
    await U.consulta("midia_kit_leads", window.bancoCliente.from("midia_kit_leads").update({ lido: lead.lido }).eq("id", lead.id));
  }

  async function mandarParaMarcas(lead) {
    var inserir = await U.consulta("marcas", window.bancoCliente.from("marcas").insert({
      nome: lead.marca || lead.nome,
      contato_nome: lead.marca ? lead.nome : null,
      email: lead.email || null,
      telefone: lead.whatsapp || null,
      obs: textoDoLead(lead) || null,
      situacao: "lead",
      ultimo_contato: U.hojeISO()
    }));
    if (inserir.error) return;
    var apagar = await U.consulta("midia_kit_leads", window.bancoCliente.from("midia_kit_leads").delete().eq("id", lead.id));
    if (apagar.error) return;
    U.toast("Contato enviado para a aba Marcas.");
    await carregarLeads();
  }

  async function apagarLead(lead) {
    if (!confirm("Apagar este contato? Essa ação não pode ser desfeita.")) return;
    var r = await U.consulta("midia_kit_leads", window.bancoCliente.from("midia_kit_leads").delete().eq("id", lead.id));
    if (r.error) return;
    U.toast("Contato apagado.");
    await carregarLeads();
  }

  // ---- VÍDEOS ---------------------------------------------------------------
  async function carregarVideos() {
    var resultado = await U.consulta("midia_kit_videos",
      window.bancoCliente.from("midia_kit_videos").select("*").order("ordem", { ascending: true })
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
    document.getElementById("kit-stats").innerHTML = "";
    var container = document.getElementById("kit-stats");
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
    var corpo = document.getElementById("kit-corpo-tabela-videos");
    var aviso = document.getElementById("kit-aviso-videos-vazio");
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
      tdDestaque.textContent = video.destaque ? "Sim" : "—";
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
      return window.bancoCliente.from("midia_kit_videos").update({ ordem: indice }).eq("id", v.id);
    });
    videosAtuais.forEach(function (v, indice) { v.ordem = indice; });
    await Promise.all(atualizacoes);
    U.toast("Ordem atualizada.");
  }

  async function alternarVisivel(video) {
    video.visivel = !video.visivel;
    renderizarTabelaVideos();
    var resultado = await U.consulta("midia_kit_videos",
      window.bancoCliente.from("midia_kit_videos").update({ visivel: video.visivel }).eq("id", video.id)
    );
    if (!resultado.error) U.toast(video.visivel ? "Vídeo visível no site." : "Vídeo escondido do site.");
  }

  function abrirFormVideo(video) {
    var campo = function (id) { return document.getElementById("kit-video-" + id); };
    document.getElementById("kit-form-video").reset();
    campo("id").value = video ? video.id : "";
    campo("titulo").value = video ? (video.titulo || "") : "";
    campo("titulo-en").value = video ? (video.titulo_en || "") : "";
    campo("titulo-es").value = video ? (video.titulo_es || "") : "";
    campo("link").value = video ? (video.link || "") : "";
    campo("nicho").value = video ? (video.nicho || "") : "";
    campo("marca").value = video ? (video.marca || "") : "";
    campo("detalhe").value = video ? (video.detalhe || "") : "";
    campo("destaque").checked = video ? !!video.destaque : false;
    campo("destaque-titulo").value = video ? (video.destaque_titulo || "") : "";
    campo("destaque-numero").value = video ? (video.destaque_numero || "") : "";
    campo("destaque-rotulo").value = video ? (video.destaque_rotulo || "") : "";
    campo("visivel").checked = video ? !!video.visivel : true;
    document.getElementById("kit-titulo-modal-video").textContent = video ? "Editar vídeo" : "Novo vídeo";
    document.getElementById("kit-btn-apagar-video").style.display = video ? "inline-flex" : "none";
    U.abrirModal("kit-modal-video");
  }

  async function salvarVideo(e) {
    e.preventDefault();
    var campo = function (id) { return document.getElementById("kit-video-" + id); };
    var texto = function (id) { return campo(id).value.trim() || null; };
    var id = campo("id").value;
    var dados = {
      titulo: campo("titulo").value.trim(),
      titulo_en: texto("titulo-en"),
      titulo_es: texto("titulo-es"),
      link: campo("link").value.trim(),
      nicho: texto("nicho"),
      marca: texto("marca"),
      detalhe: texto("detalhe"),
      destaque: campo("destaque").checked,
      destaque_titulo: texto("destaque-titulo"),
      destaque_numero: texto("destaque-numero"),
      destaque_rotulo: texto("destaque-rotulo"),
      visivel: campo("visivel").checked
    };
    var resultado;
    if (id) {
      resultado = await U.consulta("midia_kit_videos", window.bancoCliente.from("midia_kit_videos").update(dados).eq("id", id));
    } else {
      dados.ordem = videosAtuais.length;
      resultado = await U.consulta("midia_kit_videos", window.bancoCliente.from("midia_kit_videos").insert(dados));
    }
    if (resultado.error) return;
    U.fecharModal("kit-modal-video");
    U.toast("Vídeo salvo.");
    await carregarVideos();
  }

  async function apagarVideoAtual() {
    var id = document.getElementById("kit-video-id").value;
    if (!id) return;
    if (!confirm("Apagar este vídeo? Essa ação não pode ser desfeita.")) return;
    var resultado = await U.consulta("midia_kit_videos", window.bancoCliente.from("midia_kit_videos").delete().eq("id", id));
    if (resultado.error) return;
    U.fecharModal("kit-modal-video");
    U.toast("Vídeo apagado.");
    await carregarVideos();
  }

  // ---- VISITAS ---------------------------------------------------------------
  async function carregarEstatisticasVisita() {
    var quatorzeDiasAtras = new Date();
    quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 13);
    quatorzeDiasAtras.setHours(0, 0, 0, 0);

    var resultado = await U.consulta("midia_kit_visitas",
      window.bancoCliente.from("midia_kit_visitas").select("criado_em, origem").gte("criado_em", quatorzeDiasAtras.toISOString())
    );
    var visitas = resultado.data || [];

    var hojeISO = U.hojeISO();
    var visitasHoje = visitas.filter(function (v) { return String(v.criado_em).slice(0, 10) === hojeISO; }).length;

    var statsContainer = document.getElementById("kit-stats");
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
    var container = document.getElementById("kit-grafico-visitas");
    container.innerHTML = "";
    if (visitas.length === 0) {
      container.appendChild(U.criarEl("p", "aviso-vazio", "Quando as pessoas começarem a visitar o seu mídia kit, o gráfico dos últimos 14 dias aparece aqui."));
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
    var container = document.getElementById("kit-lista-origens");
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
