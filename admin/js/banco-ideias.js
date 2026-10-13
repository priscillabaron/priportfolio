// ============================================================================
// ABA: BANCO DE IDEIAS
// Guarda conteúdos de outros perfis que deram certo (YouTube, Instagram, TikTok,
// Facebook, Pinterest), com a transcrição (feita aqui mesmo), o gancho, por que
// deu certo e o que dá para trazer para o seu perfil. Tabela: conteudos_banco.
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;

  window.AdminBanco = { iniciar: iniciar };

  /* ---------------------------------------------------------------------
     DADOS FIXOS
     --------------------------------------------------------------------- */
  var NICHOS = [
    { id: "viagens", rotulo: "Viagens e restaurantes" },
    { id: "afiliados", rotulo: "Mercado de afiliados" },
    { id: "ugc", rotulo: "UGC" }
  ];
  var REDES = [
    { id: "instagram", rotulo: "Instagram" },
    { id: "tiktok", rotulo: "TikTok" },
    { id: "facebook", rotulo: "Facebook" },
    { id: "youtube", rotulo: "YouTube" },
    { id: "pinterest", rotulo: "Pinterest" }
  ];
  var FORMATOS = ["Vídeo", "Carrossel"];
  var ICONE_PLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/></svg>';
  var ICONE_SETA = '<svg class="banco-seta" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';

  /* ---------------------------------------------------------------------
     ESTADO
     --------------------------------------------------------------------- */
  var est = {
    nicho: "viagens",
    rede: "instagram",
    itens: [],
    frase: 0,
    rascunho: null,
    copiouTimer: null
  };
  var el = {};

  /* ---------------------------------------------------------------------
     AJUDANTES
     --------------------------------------------------------------------- */
  function criar(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }
  function botao(classe, texto, aoClicar) {
    var b = criar("button", classe, texto);
    b.type = "button";
    if (aoClicar) b.addEventListener("click", aoClicar);
    return b;
  }
  function achar(lista, id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }
  function celular() { return window.innerWidth < 820; }
  function icones() { return (window.AdminConteudos && window.AdminConteudos.iconesRedes) || {}; }

  // Descobre a rede social pelo endereço do link.
  function detectarRede(url) {
    var u = String(url || "").toLowerCase();
    if (/instagram\./.test(u)) return "instagram";
    if (/tiktok\./.test(u)) return "tiktok";
    if (/facebook\.|fb\.watch/.test(u)) return "facebook";
    if (/youtube\.|youtu\.be/.test(u)) return "youtube";
    if (/pinterest\.|pin\.it/.test(u)) return "pinterest";
    return null;
  }
  // Aceita link sem "https://" também.
  function normalizarLink(texto) {
    var t = String(texto || "").trim();
    if (!t || /\s/.test(t)) return t;
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) return "https://" + t;
    return t;
  }
  function linkValido(t) { return /^https?:\/\//i.test(String(t || "")); }
  function idYoutube(url) {
    var m = String(url || "").match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    return m ? m[1] : "";
  }
  function capaDe(item) {
    if (item.capa) return item.capa;
    var id = idYoutube(item.link);
    return id ? "https://img.youtube.com/vi/" + id + "/hqdefault.jpg" : "";
  }
  function dominio(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }
  function rotuloDuracao(item) {
    if (!item.duracao) return "";
    return item.formato === "Carrossel" ? item.duracao + " cards" : item.duracao;
  }

  /* ---------------------------------------------------------------------
     INÍCIO
     --------------------------------------------------------------------- */
  async function iniciar() {
    [
      "banco-frase", "banco-outra-frase", "banco-nichos", "banco-redes", "banco-link", "banco-salvar-link",
      "banco-vazio", "banco-tabela", "banco-gaveta", "bi-kicker", "bi-titulo-gaveta", "bi-capa", "bi-link",
      "bi-link-abrir", "bi-tokscript", "bi-tok-status", "bi-aviso", "bi-aviso-texto", "bi-nicho", "bi-rede", "bi-formato", "bi-titulo",
      "bi-gancho", "bi-roteiro-rotulo", "bi-roteiro", "bi-roteiro-contagem", "bi-duracao-rotulo", "bi-duracao",
      "bi-porque", "bi-ideias", "bi-apagar", "bi-salvar", "bi-copiar-tudo", "bi-copiar-rotulo"
    ].forEach(function (id) { el[id] = document.getElementById(id); });

    var frases = (window.AdminConteudos && window.AdminConteudos.frases) || ["Feito e postado vale mais do que perfeito e guardado no rascunho."];
    est.frase = Math.floor(Math.random() * frases.length);
    function mostrarFrase() { el["banco-frase"].textContent = frases[est.frase]; }
    mostrarFrase();
    el["banco-outra-frase"].addEventListener("click", function () {
      est.frase = (est.frase + 1 + Math.floor(Math.random() * Math.max(1, frases.length - 1))) % frases.length;
      mostrarFrase();
    });

    el["banco-salvar-link"].addEventListener("click", salvarPeloLink);
    el["banco-link"].addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); salvarPeloLink(); } });

    // gaveta
    document.querySelectorAll("[data-fechar-banco]").forEach(function (b) { b.addEventListener("click", fecharGaveta); });
    var escComJanela = false;
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") escComJanela = !!document.querySelector(".modal-fundo.visivel"); }, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !escComJanela) fecharGaveta(); });
    ligar("bi-titulo", "titulo");
    ligar("bi-gancho", "gancho");
    ligar("bi-roteiro", "roteiro");
    ligar("bi-duracao", "duracao");
    ligar("bi-porque", "por_que");
    ligar("bi-ideias", "ideias_para_mim");
    el["bi-roteiro"].addEventListener("input", atualizarContagem);
    el["bi-link"].addEventListener("input", function () {
      est.rascunho.link = el["bi-link"].value;
      atualizarLinkAbrir();
    });
    el["bi-link"].addEventListener("change", function () {
      var link = normalizarLink(el["bi-link"].value);
      el["bi-link"].value = link;
      est.rascunho.link = link;
      var rede = detectarRede(link);
      if (rede) { est.rascunho.rede = rede; el["bi-rede"].value = rede; desenharKicker(); }
      atualizarLinkAbrir();
      buscarDadosDoLink();
    });
    el["bi-nicho"].addEventListener("change", function () { est.rascunho.nicho = el["bi-nicho"].value; desenharKicker(); });
    el["bi-rede"].addEventListener("change", function () { est.rascunho.rede = el["bi-rede"].value; desenharKicker(); });
    el["bi-tokscript"].addEventListener("click", transcrever);
    el["bi-salvar"].addEventListener("click", salvar);
    el["bi-apagar"].addEventListener("click", apagar);
    el["bi-copiar-tudo"].addEventListener("click", copiarTudo);
    document.querySelectorAll("[data-copiar-banco]").forEach(function (b) {
      b.addEventListener("click", function () { copiarCampo(b.getAttribute("data-copiar-banco")); });
    });

    // opções dos selects
    NICHOS.forEach(function (n) { var o = document.createElement("option"); o.value = n.id; o.textContent = n.rotulo; el["bi-nicho"].appendChild(o); });
    REDES.forEach(function (r) { var o = document.createElement("option"); o.value = r.id; o.textContent = r.rotulo; el["bi-rede"].appendChild(o); });

    window.addEventListener("resize", U.debounce(function () { if (document.getElementById("aba-banco").classList.contains("ativa")) renderLista(); }, 200));
    document.addEventListener("aba-ativada", function (e) { if (e.detail === "banco") render(); });

    await carregar();
  }

  function ligar(idCampo, chave) {
    el[idCampo].addEventListener("input", function () { est.rascunho[chave] = el[idCampo].value; });
  }

  async function carregar() {
    var res = await U.consulta("conteudos_banco", window.bancoCliente.from("conteudos_banco").select("*"));
    est.itens = res.data || [];
    render();
  }

  /* ---------------------------------------------------------------------
     PÁGINA
     --------------------------------------------------------------------- */
  function render() {
    renderNichos();
    renderRedes();
    renderLista();
  }

  function renderNichos() {
    el["banco-nichos"].innerHTML = "";
    NICHOS.forEach(function (n) {
      var qtd = est.itens.filter(function (i) { return i.nicho === n.id; }).length;
      var b = botao("cont-aba" + (est.nicho === n.id ? " ativo" : ""), n.rotulo, function () { est.nicho = n.id; render(); });
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", est.nicho === n.id ? "true" : "false");
      b.appendChild(criar("span", "cont-aba-conta", String(qtd)));
      el["banco-nichos"].appendChild(b);
    });
  }

  function renderRedes() {
    el["banco-redes"].innerHTML = "";
    var doNicho = est.itens.filter(function (i) { return i.nicho === est.nicho; });
    REDES.forEach(function (r) {
      var n = doNicho.filter(function (i) { return i.rede === r.id; }).length;
      var b = botao("cont-plat" + (est.rede === r.id ? " ativo" : ""), "", function () { est.rede = r.id; renderRedes(); renderLista(); });
      var icone = criar("div", "cont-plat-icone");
      icone.innerHTML = icones()[r.id] || "";
      var textos = criar("div");
      textos.appendChild(criar("span", "cont-plat-nome", r.rotulo));
      textos.appendChild(criar("span", "cont-plat-conta", n === 1 ? "1 salvo" : n + " salvos"));
      b.appendChild(icone);
      b.appendChild(textos);
      el["banco-redes"].appendChild(b);
    });
  }

  function renderLista() {
    var lista = est.itens.filter(function (i) { return i.nicho === est.nicho && i.rede === est.rede; });
    lista.sort(function (a, b) { return String(b.criado_em || "").localeCompare(String(a.criado_em || "")); });
    el["banco-vazio"].style.display = lista.length === 0 ? "" : "none";
    el["banco-tabela"].style.display = lista.length === 0 ? "none" : "";
    el["banco-tabela"].innerHTML = "";
    if (lista.length === 0) return;

    if (!celular()) {
      var cab = criar("div", "banco-cab");
      ["CAPA", "CONTEÚDO", "FORMATO", "DURAÇÃO", ""].forEach(function (t) { cab.appendChild(criar("span", "", t)); });
      el["banco-tabela"].appendChild(cab);
    }
    lista.forEach(function (item) { el["banco-tabela"].appendChild(montarLinha(item)); });
  }

  function montarLinha(item) {
    var linha = criar("div", "banco-linha");
    linha.tabIndex = 0;
    linha.setAttribute("role", "button");
    linha.addEventListener("click", function () { abrirGaveta(item); });
    linha.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirGaveta(item); } });

    var capa = criar("div", "banco-capa");
    var url = capaDe(item);
    if (url) capa.style.backgroundImage = "url(" + JSON.stringify(url) + ")"; else capa.innerHTML = ICONE_PLAY;
    linha.appendChild(capa);

    var conteudo = criar("div", "banco-conteudo");
    conteudo.appendChild(criar("span", "banco-conteudo-titulo", item.titulo || "Conteúdo sem título"));
    if (item.gancho) {
      var g = criar("span", "banco-conteudo-gancho");
      g.appendChild(criar("b", "", "Gancho: "));
      g.appendChild(document.createTextNode("“" + item.gancho + "”"));
      conteudo.appendChild(g);
    }
    var host = dominio(item.link);
    if (host) conteudo.appendChild(criar("span", "banco-conteudo-host", host));
    var mobile = criar("span", "banco-pilulas-mobile");
    mobile.appendChild(criar("span", "banco-pilula-formato", item.formato || "Vídeo"));
    if (rotuloDuracao(item)) mobile.appendChild(criar("span", "banco-pilula-duracao", rotuloDuracao(item)));
    conteudo.appendChild(mobile);
    linha.appendChild(conteudo);

    var colFormato = criar("span", "banco-col-formato");
    colFormato.appendChild(criar("span", "banco-pilula-formato", item.formato || "Vídeo"));
    linha.appendChild(colFormato);
    linha.appendChild(criar("span", "banco-duracao banco-col-duracao", rotuloDuracao(item)));
    var seta = criar("span", "banco-col-seta");
    seta.innerHTML = ICONE_SETA;
    linha.appendChild(seta);
    return linha;
  }

  /* ---------------------------------------------------------------------
     SALVAR PELO LINK
     --------------------------------------------------------------------- */
  function salvarPeloLink() {
    var link = normalizarLink(el["banco-link"].value);
    if (!link) { U.toast("Cole o link do conteúdo primeiro.", true); el["banco-link"].focus(); return; }
    el["banco-link"].value = "";
    var rede = detectarRede(link) || est.rede;
    abrirGaveta({ id: null, nicho: est.nicho, rede: rede, formato: "Vídeo", link: link, capa: "", titulo: "", gancho: "", roteiro: "", duracao: "", por_que: "", ideias_para_mim: "" });
    buscarDadosDoLink();
  }

  // Tenta buscar título e capa direto do link (o que cada site permite). Se não conseguir, tudo bem:
  // você preenche à mão. A transcrição é feita pelo botão "Transcrever aqui".
  async function buscarDadosDoLink() {
    var r = est.rascunho;
    if (!r || !linkValido(r.link)) return;
    var linkNaHora = r.link;
    var endereco = null;
    if (r.rede === "youtube") endereco = "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(r.link);
    else if (r.rede === "tiktok") endereco = "https://www.tiktok.com/oembed?url=" + encodeURIComponent(r.link);
    else if (r.rede === "pinterest") endereco = "https://www.pinterest.com/oembed.json?url=" + encodeURIComponent(r.link);
    var capaYoutube = r.rede === "youtube" && idYoutube(r.link) ? "https://img.youtube.com/vi/" + idYoutube(r.link) + "/hqdefault.jpg" : "";
    if (capaYoutube && !r.capa) { r.capa = capaYoutube; mostrarCapa(); }
    if (!endereco) return;
    try {
      var controle = new AbortController();
      var timer = setTimeout(function () { controle.abort(); }, 7000);
      var resposta = await fetch(endereco, { signal: controle.signal });
      clearTimeout(timer);
      if (!resposta.ok) return;
      var dados = await resposta.json();
      // se você trocou de link enquanto esperava, ignora
      if (!est.rascunho || est.rascunho.link !== linkNaHora) return;
      if (dados.title && !est.rascunho.titulo) { est.rascunho.titulo = dados.title; el["bi-titulo"].value = dados.title; }
      if (dados.thumbnail_url && (!est.rascunho.capa || est.rascunho.capa === capaYoutube)) { est.rascunho.capa = dados.thumbnail_url; mostrarCapa(); }
    } catch (erro) {
      // sem internet, bloqueado pelo site ou link inválido: segue sem preencher
    }
  }

  /* ---------------------------------------------------------------------
     GAVETA
     --------------------------------------------------------------------- */
  function abrirGaveta(item) {
    est.rascunho = {
      id: item.id, nicho: item.nicho, rede: item.rede, formato: item.formato || "Vídeo", link: item.link || "",
      capa: item.capa || "", titulo: item.titulo || "", gancho: item.gancho || "", roteiro: item.roteiro || "",
      duracao: item.duracao || "", por_que: item.por_que || "", ideias_para_mim: item.ideias_para_mim || ""
    };
    var r = est.rascunho;
    el["bi-titulo-gaveta"].textContent = r.id ? "Conteúdo salvo" : "Novo conteúdo";
    el["bi-aviso"].style.display = r.id ? "none" : "";
    el["bi-link"].value = r.link;
    el["bi-nicho"].value = r.nicho;
    el["bi-rede"].value = r.rede;
    el["bi-titulo"].value = r.titulo;
    el["bi-gancho"].value = r.gancho;
    el["bi-roteiro"].value = r.roteiro;
    el["bi-duracao"].value = r.duracao;
    el["bi-porque"].value = r.por_que;
    el["bi-ideias"].value = r.ideias_para_mim;
    el["bi-apagar"].style.display = r.id ? "" : "none";
    el["bi-copiar-rotulo"].textContent = "Copiar tudo";
    el["bi-tok-status"].textContent = "A transcrição aparece aqui mesmo, no campo Roteiro. Funciona com Instagram, TikTok e YouTube.";
    desenharFormatos();
    desenharKicker();
    mostrarCapa();
    atualizarLinkAbrir();
    atualizarContagem();
    el["banco-gaveta"].classList.add("visivel");
  }

  function fecharGaveta() {
    el["banco-gaveta"].classList.remove("visivel");
  }

  function desenharKicker() {
    var n = achar(NICHOS, est.rascunho.nicho) || NICHOS[0];
    var r = achar(REDES, est.rascunho.rede) || REDES[0];
    el["bi-kicker"].textContent = ("Banco de Ideias · " + n.rotulo + " · " + r.rotulo).toUpperCase();
  }

  function mostrarCapa() {
    var url = capaDe(est.rascunho);
    el["bi-capa"].style.display = url ? "" : "none";
    if (url) el["bi-capa"].style.backgroundImage = "url(" + JSON.stringify(url) + ")";
  }

  function atualizarLinkAbrir() {
    var url = normalizarLink(est.rascunho.link);
    var ok = linkValido(url);
    el["bi-link-abrir"].style.display = ok ? "" : "none";
    if (ok) el["bi-link-abrir"].href = url;
  }

  function desenharFormatos() {
    el["bi-formato"].innerHTML = "";
    FORMATOS.forEach(function (f) {
      var ativo = est.rascunho.formato === f;
      el["bi-formato"].appendChild(botao("cont-pilula" + (ativo ? " ativo" : ""), f, function () {
        est.rascunho.formato = f;
        desenharFormatos();
      }));
    });
    var car = est.rascunho.formato === "Carrossel";
    el["bi-roteiro-rotulo"].textContent = car ? "Texto do carrossel" : "Roteiro (transcrição)";
    el["bi-roteiro"].placeholder = car ? "O que está escrito em cada card" : "A transcrição aparece aqui. Você também pode escrever ou colar. Não tem limite de tamanho.";
    el["bi-duracao-rotulo"].textContent = car ? "Quantidade de cards" : "Tempo do vídeo";
    el["bi-duracao"].placeholder = car ? "Ex.: 7" : "Ex.: 0:38";
  }

  function atualizarContagem() {
    var t = String(est.rascunho ? est.rascunho.roteiro : "").trim();
    var n = t ? t.split(/\s+/).length : 0;
    el["bi-roteiro-contagem"].textContent = n ? n.toLocaleString("pt-BR") + " palavras · " + t.length.toLocaleString("pt-BR") + " caracteres" : "";
  }

  // Transcreve o vídeo aqui mesmo: pede para a função "transcrever" (no Supabase) e coloca o texto no Roteiro.
  async function transcrever() {
    if (est.transcrevendo) return;
    var r = est.rascunho;
    var link = normalizarLink(r.link);
    if (!linkValido(link)) { U.toast("Cole o link do vídeo primeiro.", true); el["bi-link"].focus(); return; }
    if (["instagram", "tiktok", "youtube"].indexOf(r.rede) < 0) {
      U.toast("A transcrição automática funciona para Instagram, TikTok e YouTube.", true);
      return;
    }
    if (r.formato === "Carrossel") { U.toast("Carrossel não tem fala para transcrever. Escreva o texto dos cards.", true); return; }
    if (r.roteiro && r.roteiro.trim() && !window.confirm("O Roteiro já tem texto. Substituir pela transcrição?")) return;

    est.transcrevendo = true;
    var rotuloBotao = el["bi-tokscript"].textContent;
    el["bi-tokscript"].disabled = true;
    el["bi-tokscript"].textContent = "Transcrevendo...";
    el["bi-tok-status"].textContent = "Buscando a fala do vídeo. Pode levar até 1 minuto.";
    var erroTexto = "";
    var texto = "";
    try {
      var resp = await window.bancoCliente.functions.invoke("transcrever", { body: { link: link, rede: r.rede } });
      if (resp.error) erroTexto = await descreverErroFuncao(resp.error);
      else if (resp.data && resp.data.texto) texto = String(resp.data.texto);
      else erroTexto = (resp.data && resp.data.erro) || "A transcrição veio vazia.";
    } catch (e) {
      erroTexto = "Não consegui falar com a função de transcrição. Confira sua internet e se ela foi publicada no Supabase.";
    }
    est.transcrevendo = false;
    el["bi-tokscript"].disabled = false;
    el["bi-tokscript"].textContent = rotuloBotao;

    // se fechou ou trocou de conteúdo enquanto esperava, não mexe
    if (est.rascunho !== r) return;
    if (erroTexto) {
      el["bi-tok-status"].textContent = erroTexto;
      U.toast(erroTexto, true);
      return;
    }
    r.roteiro = texto;
    el["bi-roteiro"].value = texto;
    atualizarContagem();
    el["bi-tok-status"].textContent = "Pronto! A transcrição está no campo Roteiro. Revise e ajuste se precisar.";
    U.toast("Transcrição colocada no Roteiro.");
  }

  async function descreverErroFuncao(erro) {
    try {
      if (erro && erro.context && typeof erro.context.json === "function") {
        var j = await erro.context.json();
        if (j && j.erro) return j.erro;
      }
    } catch (e) { /* segue */ }
    if (erro && erro.context && erro.context.status === 404) return "A função de transcrição ainda não foi publicada no Supabase.";
    return "Não consegui falar com a função de transcrição. Confira se ela foi publicada no Supabase e se você está logada.";
  }

  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (erro) {
      var a = document.createElement("textarea");
      a.value = texto;
      a.style.position = "fixed";
      a.style.opacity = "0";
      document.body.appendChild(a);
      a.select();
      try { document.execCommand("copy"); } catch (e2) { /* tudo bem */ }
      a.remove();
    }
  }

  async function copiarCampo(idCampo) {
    var texto = el[idCampo].value;
    if (!texto.trim()) { U.toast("Esse campo está vazio.", true); return; }
    await copiarTexto(texto);
    U.toast("Copiado.");
  }

  // "Copiar tudo": junta a ficha inteira num texto só (campos vazios saem como "-").
  async function copiarTudo() {
    var x = est.rascunho;
    var car = x.formato === "Carrossel";
    var nicho = (achar(NICHOS, x.nicho) || {}).rotulo || "";
    var rede = (achar(REDES, x.rede) || {}).rotulo || "";
    var texto = [
      "TÍTULO: " + (x.titulo || "-"),
      "LINK: " + (x.link || "-"),
      "NICHO: " + nicho,
      "REDE SOCIAL: " + rede,
      "FORMATO: " + (x.formato || "-"),
      (car ? "QUANTIDADE DE CARDS" : "TEMPO DO VÍDEO") + ": " + (x.duracao || "-"),
      "",
      "GANCHO:\n" + (x.gancho || "-"),
      "",
      (car ? "TEXTO DO CARROSSEL" : "ROTEIRO") + ":\n" + (x.roteiro || "-"),
      "",
      "POR QUE DEU CERTO:\n" + (x.por_que || "-"),
      "",
      "IDEIAS PARA O MEU PERFIL:\n" + (x.ideias_para_mim || "-")
    ].join("\n");
    await copiarTexto(texto);
    el["bi-copiar-rotulo"].textContent = "Copiado!";
    clearTimeout(est.copiouTimer);
    est.copiouTimer = setTimeout(function () { el["bi-copiar-rotulo"].textContent = "Copiar tudo"; }, 1800);
  }

  /* ---------------------------------------------------------------------
     SALVAR / APAGAR
     --------------------------------------------------------------------- */
  async function salvar() {
    var r = est.rascunho;
    var dados = {
      nicho: r.nicho,
      rede: r.rede,
      formato: r.formato,
      link: r.link ? r.link.trim() : null,
      capa: r.capa || null,
      titulo: r.titulo ? r.titulo.trim() : null,
      gancho: r.gancho || null,
      roteiro: r.roteiro || null,
      duracao: r.duracao ? r.duracao.trim() : null,
      por_que: r.por_que || null,
      ideias_para_mim: r.ideias_para_mim || null
    };
    var consulta = r.id
      ? window.bancoCliente.from("conteudos_banco").update(dados).eq("id", r.id)
      : window.bancoCliente.from("conteudos_banco").insert(dados);
    var resultado = await U.consulta("conteudos_banco", consulta);
    if (resultado.error) return;
    est.nicho = dados.nicho;
    est.rede = dados.rede;
    fecharGaveta();
    U.toast("Salvo no Banco de Ideias.");
    await carregar();
  }

  async function apagar() {
    var r = est.rascunho;
    if (!r || !r.id) return;
    if (!confirm("Excluir este conteúdo do Banco de Ideias?")) return;
    var resultado = await U.consulta("conteudos_banco", window.bancoCliente.from("conteudos_banco").delete().eq("id", r.id));
    if (resultado.error) return;
    fecharGaveta();
    U.toast("Conteúdo excluído.");
    await carregar();
  }
})();
