// ============================================================================
// ABA: CONTEÚDOS
// Ideias de conteúdo por perfil e plataforma, mais um calendário de gravar,
// postar e publicidade. Os dados ficam nas tabelas conteudos_ideias e
// conteudos_agenda (arquivo conteudos.sql).
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;

  window.AdminConteudos = { iniciar: iniciar };

  /* ---------------------------------------------------------------------
     DADOS FIXOS
     --------------------------------------------------------------------- */
  var PERFIS = [
    { id: "entracomigo", nome: "@entracomigo", sub: "Viagens", foto: "assets/entracomigo.jpg" },
    { id: "favoritospri", nome: "@favoritospri", sub: "Afiliados", foto: "assets/favoritospri.jpg" },
    { id: "ugc", nome: "UGC", sub: "Publis", foto: "" }
  ];
  var GERAL = { id: "geral", nome: "Geral", sub: "Calendário" };

  var PLATAFORMAS = [
    { id: "instagram", rotulo: "Instagram" },
    { id: "tiktok", rotulo: "TikTok" },
    { id: "facebook", rotulo: "Facebook" },
    { id: "pinterest", rotulo: "Pinterest", so: "favoritospri" }
  ];
  var FORMATOS = {
    instagram: ["Reels", "Carrossel", "Foto", "Story"],
    tiktok: ["Vídeo", "Carrossel", "Foto"],
    facebook: ["Vídeo", "Carrossel", "Foto"],
    pinterest: ["Vídeo", "Carrossel", "Foto"]
  };
  var ICONES_PLATAFORMA = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.2a6.3 6.3 0 1 0 5.4 6.2V8.6a8 8 0 0 0 4.4 1.4V6.6a4.5 4.5 0 0 1-4.4-4.6Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22h3.4Z"/></svg>',
    pinterest: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.5-1.8-4.3-4.4-4.3-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.3-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.8-2.4 6.8-5.7 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2Z"/></svg>'
  };
  var ICONE_CALENDARIO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 13.5h3M13.5 13.5h3M7.5 17h3"/></svg>';
  // Países que você pode escolher nos projetos (o nome em português vem do próprio navegador).
  var CODIGOS_PAIS = ["BR","AR","CL","UY","PY","BO","PE","CO","EC","VE","MX","US","CA","CU","DO","JM","BS","PA","CR","GT","BZ","HN","SV","NI","AW","CW","PR","PT","ES","FR","IT","DE","GB","IE","NL","BE","LU","CH","AT","GR","TR","HR","SI","RS","ME","AL","BG","RO","HU","CZ","SK","PL","LT","LV","EE","FI","SE","NO","DK","IS","MT","CY","UA","RU","GE","AM","IL","JO","LB","AE","QA","SA","OM","EG","MA","TN","KE","TZ","ZA","NA","MU","SC","MZ","MG","CV","SN","GH","NG","ET","IN","NP","LK","MV","TH","VN","KH","LA","MY","SG","ID","PH","CN","HK","TW","JP","KR","MN","AU","NZ","FJ","PF","KZ","UZ"];
  var ICONE_GLOBO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.500 18.300 12 21c-2.500-2.700-3.800-5.700-3.800-9S9.500 5.700 12 3Z"/></svg>';
  var ICONE_DATA = '<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18"/></svg>';
  var ICONE_LINK = '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';

  var STATUS = [
    { id: "agravar", rotulo: "Ainda a ser gravado", fg: "#4a5260", bg: "#eef0f3" },
    { id: "parcial", rotulo: "Gravado parcial", fg: "#8a5a00", bg: "#fdf3de" },
    { id: "gravado", rotulo: "Gravado", fg: "#2d5a86", bg: "#e3ecf6" },
    { id: "editado", rotulo: "Já editado", fg: "#5b3fa6", bg: "#ece6f8" },
    { id: "postado", rotulo: "Postado", fg: "#1f7a50", bg: "#dff3e8" }
  ];
  var TIPOS = [
    { id: "gravar", rotulo: "Gravar", cor: "#e9a23b", bg: "#fdf3de", fg: "#7a4f00" },
    { id: "postar", rotulo: "Postar", cor: "#3f6e9a", bg: "#e3ecf6", fg: "#22476d" },
    { id: "publi", rotulo: "Publicidade", cor: "#d9577a", bg: "#fbe4ea", fg: "#8e2843" }
  ];
  var DIAS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  var FRASES = [
    "Feito e postado vale mais do que perfeito e guardado no rascunho.",
    "Constância não é postar todo dia. É não desistir na semana difícil.",
    "Seu próximo seguidor ainda não viu nenhum dos seus vídeos. Grave para ele.",
    "Um vídeo por semana, durante um ano, são 52 chances de ser descoberta.",
    "Ninguém lembra do vídeo que não deu certo. Todo mundo lembra de quem continuou.",
    "Hoje não precisa ser viral. Precisa ser publicado.",
    "Motivação começa. Rotina sustenta.",
    "Comece com o celular que você tem e a luz que entra pela janela.",
    "A ideia boa de hoje vira o conteúdo de amanhã se você anotar agora.",
    "Quem posta com frequência aprende mais rápido do que quem espera a ideia perfeita.",
    "Comparar o seu bastidor com o resultado dos outros só atrasa o seu.",
    "Cada conteúdo publicado é um treino. Você está ficando melhor.",
    "Grave em lote nos dias bons para postar tranquila nos dias corridos.",
    "As marcas procuram quem aparece. Apareça.",
    "Pequeno e frequente ganha de grande e raro.",
    "Não espere ter tempo. Reserve o tempo.",
    "O algoritmo muda, mas quem é constante sempre encontra o seu público.",
    "Você não precisa de mais ideias. Precisa terminar uma.",
    "Postar dá medo no começo. Depois vira hábito, e o hábito vira resultado.",
    "Disciplina é lembrar o que você quer quando a vontade passar.",
    "Um passo hoje: gravar, editar ou postar. Escolha um.",
    "Seu jeito de contar é o que nenhum outro perfil tem.",
    "Conteúdo parado não ajuda ninguém. Publique e aprenda com a resposta.",
    "Resultado nas redes é juros compostos: cresce devagar e depois acelera.",
    "Faça o simples bem feito, toda semana.",
    "Quem planeja a semana não depende de inspiração.",
    "O seu público já está esperando. Só falta você chegar.",
    "Errar no vídeo de hoje é o que deixa o de amanhã melhor."
  ];

  /* ---------------------------------------------------------------------
     ESTADO
     --------------------------------------------------------------------- */
  var est = {
    perfil: "entracomigo",
    aba: "ideias",
    plataforma: "instagram",
    filtro: "all",
    calModo: "week",
    ancora: hojeISO(),
    ideias: [],
    eventos: [],
    projetos: [],
    projetoId: null,
    projetoEdit: null,
    frase: Math.floor(Math.random() * FRASES.length),
    rascunho: null,
    evento: null
  };
  var el = {};

  /* ---------------------------------------------------------------------
     DATAS E AJUDANTES
     --------------------------------------------------------------------- */
  function hojeISO() { return U.hojeISO(); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(s) { var p = String(s).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDias(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function segunda(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDias(x, -((x.getDay() + 6) % 7)); }
  function br(s) { if (!s) return ""; var d = parse(s); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); }
  // Devolve o link pronto para abrir (aceita sem "https://", ex.: instagram.com/reel/abc) ou null se não for um link.
  function urlInspiracao(texto) {
    var t = String(texto || "").trim();
    if (!t || /\s/.test(t)) return null;
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) return "https://" + t;
    return null;
  }
  function celular() { return window.innerWidth < 820; }

  // cria um elemento com texto seguro (nunca interpreta HTML do que você digitou)
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
  function plataformasDo(perfil) {
    return PLATAFORMAS.filter(function (p) { return !p.so || p.so === perfil; });
  }
  function achar(lista, id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }
  function perfilDe(id) { return achar(PERFIS, id) || PERFIS[0]; }

  /* ---------------------------------------------------------------------
     INÍCIO
     --------------------------------------------------------------------- */
  async function iniciar() {
    [
      "cont-frase", "cont-outra-frase", "cont-perfis", "cont-abas", "cont-bloco-ideias", "cont-bloco-cal", "cont-bloco-projetos", "cont-projetos-grade", "cont-projetos-vazio", "cont-novo-projeto", "cont-projeto-topo", "cont-projeto-voltar", "cont-projeto-titulo", "cont-projeto-editar", "form-cont-projeto", "cp-titulo-modal", "cp-nome", "cp-pais", "cp-bandeira", "cp-apagar",
      "cont-plataformas", "cont-filtros", "cont-nova-ideia", "cont-vazio", "cont-grade",
      "cont-cal-ant", "cont-cal-prox", "cont-cal-hoje", "cont-cal-rotulo", "cont-cal-modos", "cont-cal-adicionar",
      "cont-legenda-geral", "cont-cal-corpo", "cont-gaveta", "cont-gaveta-kicker", "cont-gaveta-titulo",
      "ci-titulo", "ci-desc", "ci-serie-marca", "ci-serie-campo", "ci-serie", "ci-marcar", "ci-legenda", "ci-links", "ci-mensagem", "ci-status", "ci-pendente-wrap", "ci-pendente", "ci-data", "ci-plataforma", "ci-formato",
      "ci-inspiracao", "ci-inspiracao-link", "ci-publi", "ci-publi-campos", "ci-marca", "ci-prazo", "ci-apagar", "ci-salvar",
      "form-cont-evento", "ce-titulo-modal", "ce-tipo", "ce-titulo", "ce-data", "ce-perfil", "ce-apagar"
    ].forEach(function (id) { el[id] = document.getElementById(id); });

    el["cont-outra-frase"].addEventListener("click", function () {
      est.frase = (est.frase + 1 + Math.floor(Math.random() * (FRASES.length - 1))) % FRASES.length;
      renderFrase();
    });
    el["cont-nova-ideia"].addEventListener("click", novaIdeia);
    el["cont-cal-ant"].addEventListener("click", function () { moverCalendario(-1); });
    el["cont-cal-prox"].addEventListener("click", function () { moverCalendario(1); });
    el["cont-cal-hoje"].addEventListener("click", function () { est.ancora = hojeISO(); renderCalendario(); });
    el["cont-cal-adicionar"].addEventListener("click", function () { abrirEvento(null, hojeISO()); });

    // projetos
    preencherPaises();
    el["cont-novo-projeto"].addEventListener("click", function () { abrirFormProjeto(null); });
    el["cont-projeto-voltar"].addEventListener("click", function () { est.projetoId = null; render(); });
    el["cont-projeto-editar"].addEventListener("click", function () { abrirFormProjeto(projetoAtual()); });
    el["form-cont-projeto"].addEventListener("submit", salvarProjeto);
    el["cp-apagar"].addEventListener("click", apagarProjeto);
    el["cp-pais"].addEventListener("change", atualizarPreviaBandeira);

    // gaveta da ideia
    document.querySelectorAll("[data-fechar-gaveta]").forEach(function (b) { b.addEventListener("click", fecharGaveta); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharGaveta(); });
    ligarCampoRascunho("ci-titulo", "titulo");
    ligarCampoRascunho("ci-desc", "descricao");
    ligarCampoRascunho("ci-pendente", "pendente");
    ligarCampoRascunho("ci-serie", "serie");
    el["ci-serie-marca"].addEventListener("change", function () {
      var ligada = el["ci-serie-marca"].checked;
      el["ci-serie-campo"].style.display = ligada ? "" : "none";
      if (ligada) { el["ci-serie"].focus(); } else { el["ci-serie"].value = ""; est.rascunho.serie = ""; }
    });
    ligarCampoRascunho("ci-marcar", "marcar");
    ligarCampoRascunho("ci-legenda", "legenda");
    ligarCampoRascunho("ci-links", "links");
    ligarCampoRascunho("ci-mensagem", "mensagem");
    document.querySelectorAll("[data-copiar]").forEach(function (b) {
      b.addEventListener("click", function () { copiarCampo(b.getAttribute("data-copiar")); });
    });
    ligarCampoRascunho("ci-data", "data_postagem");
    ligarCampoRascunho("ci-marca", "marca");
    ligarCampoRascunho("ci-prazo", "prazo");
    el["ci-inspiracao"].addEventListener("input", function () {
      est.rascunho.inspiracao = el["ci-inspiracao"].value;
      atualizarLinkInspiracao();
    });
    el["ci-publi"].addEventListener("change", function () {
      est.rascunho.publi = el["ci-publi"].checked;
      el["ci-publi-campos"].style.display = est.rascunho.publi ? "" : "none";
    });
    el["ci-plataforma"].addEventListener("change", function () {
      est.rascunho.plataforma = el["ci-plataforma"].value;
      if ((FORMATOS[est.rascunho.plataforma] || []).indexOf(est.rascunho.formato) === -1) est.rascunho.formato = "";
      desenharFormatos();
      desenharKicker();
    });
    el["ci-salvar"].addEventListener("click", salvarIdeia);
    el["ci-apagar"].addEventListener("click", apagarIdeia);

    // janela do evento
    el["form-cont-evento"].addEventListener("submit", salvarEvento);
    el["ce-titulo"].addEventListener("input", function () { est.evento.titulo = el["ce-titulo"].value; });
    el["ce-data"].addEventListener("change", function () { est.evento.data = el["ce-data"].value; });
    el["ce-perfil"].addEventListener("change", function () { est.evento.perfil = el["ce-perfil"].value; });
    el["ce-apagar"].addEventListener("click", apagarEvento);

    document.addEventListener("aba-ativada", function (e) { if (e.detail === "conteudos") render(); });
    window.addEventListener("resize", U.debounce(function () { if (est.aba === "cal" || est.perfil === "geral") renderCalendario(); }, 200));

    renderFrase();
    await carregar();
  }

  function ligarCampoRascunho(idCampo, chave) {
    el[idCampo].addEventListener("input", function () { est.rascunho[chave] = el[idCampo].value; });
    el[idCampo].addEventListener("change", function () { est.rascunho[chave] = el[idCampo].value; });
  }

  async function carregar() {
    var resI = await U.consulta("conteudos_ideias", window.bancoCliente.from("conteudos_ideias").select("*"));
    est.ideias = resI.data || [];
    var resE = await U.consulta("conteudos_agenda", window.bancoCliente.from("conteudos_agenda").select("*"));
    est.eventos = resE.data || [];
    var resP = await U.consulta("conteudos_projetos", window.bancoCliente.from("conteudos_projetos").select("*"));
    est.projetos = resP.data || [];
    render();
  }

  /* ---------------------------------------------------------------------
     DESENHO DA PÁGINA
     --------------------------------------------------------------------- */
  function renderFrase() { el["cont-frase"].textContent = FRASES[est.frase]; }

  function render() {
    renderPerfis();
    var geral = est.perfil === "geral";
    var aba = geral ? "cal" : est.aba;
    // projeto aberto que sumiu (apagado) ou que é de outro perfil: volta para a lista
    var proj = projetoAtual();
    if (proj && proj.perfil !== est.perfil) { est.projetoId = null; proj = null; }
    if (est.projetoId && !proj) est.projetoId = null;
    renderAbas(geral, aba);
    var dentroDoProjeto = aba === "projetos" && !!proj;
    el["cont-bloco-ideias"].style.display = (aba === "ideias" || dentroDoProjeto) ? "" : "none";
    el["cont-bloco-projetos"].style.display = (aba === "projetos" && !proj) ? "" : "none";
    el["cont-bloco-cal"].style.display = aba === "cal" ? "" : "none";
    el["cont-projeto-topo"].style.display = dentroDoProjeto ? "" : "none";
    if (aba === "cal") renderCalendario();
    else if (aba === "projetos" && !proj) renderProjetos();
    else { if (dentroDoProjeto) renderTopoProjeto(proj); renderIdeias(); }
  }

  function renderPerfis() {
    el["cont-perfis"].innerHTML = "";
    PERFIS.concat([GERAL]).forEach(function (p) {
      var b = botao("cont-perfil" + (est.perfil === p.id ? " ativo" : ""), "", function () {
        est.perfil = p.id;
        est.projetoId = null;
        if (!achar(plataformasDo(p.id), est.plataforma)) est.plataforma = "instagram";
        est.filtro = "all";
        render();
      });
      b.setAttribute("aria-pressed", est.perfil === p.id ? "true" : "false");
      var anel = criar("div", "cont-anel");
      var avatar = criar("div", "cont-avatar");
      if (p.id === "geral") {
        avatar.classList.add("cont-avatar-geral");
        avatar.innerHTML = ICONE_CALENDARIO;
      } else if (p.foto) {
        avatar.style.backgroundImage = "url(" + p.foto + ")";
        avatar.setAttribute("role", "img");
        avatar.setAttribute("aria-label", p.nome);
      } else {
        avatar.classList.add("cont-avatar-ugc");
        avatar.appendChild(criar("b", "", "UGC"));
        avatar.appendChild(criar("small", "", "PRI BARON"));
      }
      anel.appendChild(avatar);
      b.appendChild(anel);
      b.appendChild(criar("span", "cont-perfil-nome", p.nome));
      b.appendChild(criar("span", "cont-perfil-sub", p.sub));
      el["cont-perfis"].appendChild(b);
    });
  }

  function renderAbas(geral, aba) {
    el["cont-abas"].innerHTML = "";
    el["cont-abas"].style.display = geral ? "none" : "";
    [["ideias", "Ideias de Conteúdos"], ["cal", "Calendário"], ["projetos", "Projetos"]].forEach(function (par) {
      var b = botao("cont-aba" + (aba === par[0] ? " ativo" : ""), par[1], function () { est.aba = par[0]; est.projetoId = null; est.filtro = "all"; render(); });
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", aba === par[0] ? "true" : "false");
      el["cont-abas"].appendChild(b);
    });
  }

  /* ---------- ideias ---------- */
  // Ideias soltas (aba Ideias) ou as ideias do projeto aberto (aba Projetos).
  function ideiasDoPerfil() {
    var proj = est.aba === "projetos" ? projetoAtual() : null;
    return est.ideias.filter(function (i) {
      if (i.perfil !== est.perfil) return false;
      return proj ? i.projeto_id === proj.id : !i.projeto_id;
    });
  }

  function renderIdeias() {
    var minhas = ideiasDoPerfil();

    el["cont-plataformas"].innerHTML = "";
    plataformasDo(est.perfil).forEach(function (p) {
      var n = minhas.filter(function (i) { return i.plataforma === p.id; }).length;
      var b = botao("cont-plat" + (est.plataforma === p.id ? " ativo" : ""), "", function () { est.plataforma = p.id; est.filtro = "all"; renderIdeias(); });
      var icone = criar("div", "cont-plat-icone");
      icone.innerHTML = ICONES_PLATAFORMA[p.id];
      var textos = criar("div");
      textos.appendChild(criar("span", "cont-plat-nome", p.rotulo));
      textos.appendChild(criar("span", "cont-plat-conta", n === 1 ? "1 ideia" : n + " ideias"));
      b.appendChild(icone);
      b.appendChild(textos);
      el["cont-plataformas"].appendChild(b);
    });

    var naPlataforma = minhas.filter(function (i) { return i.plataforma === est.plataforma; });
    el["cont-filtros"].innerHTML = "";
    [{ id: "all", rotulo: "Todos" }].concat(STATUS).forEach(function (s) {
      var n = s.id === "all" ? naPlataforma.length : naPlataforma.filter(function (i) { return i.status === s.id; }).length;
      el["cont-filtros"].appendChild(botao("cont-pilula" + (est.filtro === s.id ? " ativo" : ""), s.rotulo + " · " + n, function () { est.filtro = s.id; renderIdeias(); }));
    });

    var lista = naPlataforma.filter(function (i) { return est.filtro === "all" || i.status === est.filtro; });
    lista.sort(function (a, b) {
      var pa = a.status === "postado" ? 1 : 0, pb = b.status === "postado" ? 1 : 0;
      if (pa !== pb) return pa - pb;
      return String(a.data_postagem || "9").localeCompare(String(b.data_postagem || "9"));
    });

    el["cont-vazio"].style.display = lista.length === 0 ? "" : "none";
    el["cont-grade"].innerHTML = "";
    lista.forEach(function (ideia) { el["cont-grade"].appendChild(montarCartaoIdeia(ideia)); });
  }

  function montarCartaoIdeia(i) {
    var st = achar(STATUS, i.status) || STATUS[0];
    // O card é um bloco clicável (e não um botão) porque tem um link de verdade dentro: a Inspiração.
    var c = criar("div", "cont-ideia");
    c.tabIndex = 0;
    c.setAttribute("role", "button");
    c.addEventListener("click", function () { abrirGaveta(i); });
    c.addEventListener("keydown", function (e) {
      if (e.target === c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abrirGaveta(i); }
    });

    var chips = criar("div", "cont-ideia-chips");
    if (i.formato) chips.appendChild(criar("span", "cont-chip cont-chip-formato", i.formato));
    var chipStatus = criar("span", "cont-chip", (i.status === "postado" ? "✓ " : "") + st.rotulo);
    chipStatus.style.background = st.bg;
    chipStatus.style.color = st.fg;
    chips.appendChild(chipStatus);
    if (i.serie) chips.appendChild(criar("span", "cont-chip cont-chip-serie", "Série " + i.serie));
    if (i.publi) chips.appendChild(criar("span", "cont-chip cont-chip-publi", "Publi"));
    c.appendChild(chips);

    c.appendChild(criar("div", "cont-ideia-titulo", i.titulo));
    if (i.descricao) c.appendChild(criar("div", "cont-ideia-desc", i.descricao));
    if (i.status === "parcial" && i.pendente) {
      var p = criar("div", "cont-ideia-pendente");
      p.appendChild(criar("b", "", "Pendente: "));
      p.appendChild(document.createTextNode(i.pendente));
      c.appendChild(p);
    }

    var rodape = criar("div", "cont-ideia-rodape");
    if (i.data_postagem) {
      var s1 = criar("span");
      s1.innerHTML = ICONE_DATA;
      s1.appendChild(document.createTextNode("Postar " + br(i.data_postagem)));
      rodape.appendChild(s1);
    }
    if (i.publi && i.prazo) rodape.appendChild(criar("span", "cont-prazo", "Entrega " + br(i.prazo)));
    if (i.inspiracao) {
      // Se for um link, clicar em "Inspiração" já abre o conteúdo em outra aba, sem abrir a ideia.
      var url = urlInspiracao(i.inspiracao);
      var s2 = criar(url ? "a" : "span", url ? "cont-link-inspiracao" : "");
      s2.innerHTML = ICONE_LINK;
      s2.appendChild(document.createTextNode("Inspiração"));
      if (url) {
        s2.href = url;
        s2.target = "_blank";
        s2.rel = "noopener";
        s2.title = url;
        s2.addEventListener("click", function (e) { e.stopPropagation(); });
        s2.addEventListener("keydown", function (e) { e.stopPropagation(); });
      }
      rodape.appendChild(s2);
    }
    c.appendChild(rodape);
    return c;
  }

  /* ---------- calendário ---------- */
  function moverCalendario(n) {
    var a = parse(est.ancora);
    est.ancora = iso(est.calModo === "week" ? addDias(a, 7 * n) : new Date(a.getFullYear(), a.getMonth() + n, 1));
    renderCalendario();
  }

  // Itens do calendário: os que você adicionou à mão + as ideias que têm data de postagem.
  // As ideias entram sozinhas (como "Postar") e acompanham a data se você mudá-la na ideia.
  function eventosDasIdeias() {
    return est.ideias.filter(function (i) { return i.data_postagem; }).map(function (i) {
      return { id: "ideia-" + i.id, virtual: true, ideia: i, perfil: i.perfil, tipo: "postar", titulo: i.titulo, data: String(i.data_postagem).slice(0, 10) };
    });
  }
  function eventosVisiveis() {
    var geral = est.perfil === "geral";
    return est.eventos.concat(eventosDasIdeias()).filter(function (e) { return geral || e.perfil === est.perfil; });
  }
  // Clicar num item: ideia abre a gaveta da ideia; item manual abre a janelinha do calendário.
  function abrirItemDoCalendario(e) {
    if (e.virtual) abrirGaveta(e.ideia); else abrirEvento(e, null);
  }

  function renderCalendario() {
    var geral = est.perfil === "geral";
    var ancora = parse(est.ancora);
    var seg = segunda(ancora), fim = addDias(seg, 6);
    var rotulo;
    if (est.calModo === "week") {
      rotulo = seg.getMonth() === fim.getMonth()
        ? seg.getDate() + "–" + fim.getDate() + " de " + MESES[seg.getMonth()]
        : seg.getDate() + " " + MESES[seg.getMonth()].slice(0, 3) + " – " + fim.getDate() + " " + MESES[fim.getMonth()].slice(0, 3);
    } else {
      rotulo = MESES[ancora.getMonth()].charAt(0).toUpperCase() + MESES[ancora.getMonth()].slice(1) + " " + ancora.getFullYear();
    }
    el["cont-cal-rotulo"].textContent = rotulo;
    el["cont-legenda-geral"].style.display = geral ? "" : "none";

    el["cont-cal-modos"].innerHTML = "";
    [["week", "Semana"], ["month", "Mês"]].forEach(function (par) {
      el["cont-cal-modos"].appendChild(botao("cont-modo" + (est.calModo === par[0] ? " ativo" : ""), par[1], function () { est.calModo = par[0]; renderCalendario(); }));
    });

    el["cont-cal-corpo"].innerHTML = "";
    if (est.calModo === "week") desenharSemana(seg); else desenharMes(ancora);
  }

  function seloDoPerfil(perfilId) {
    var p = perfilDe(perfilId);
    var s = criar("span", "cont-selo");
    if (p.foto) s.style.backgroundImage = "url(" + p.foto + ")"; else s.textContent = "U";
    return s;
  }

  function botaoEvento(e, comSelo) {
    var t = achar(TIPOS, e.tipo) || TIPOS[0];
    var feito = e.virtual && e.ideia.status === "postado";
    var b = botao("cont-evento" + (feito ? " feito" : ""), "", function (ev) { ev.stopPropagation(); abrirItemDoCalendario(e); });
    b.style.background = t.bg;
    b.style.color = t.fg;
    b.style.boxShadow = "inset 3px 0 0 " + t.cor;
    if (comSelo) b.appendChild(seloDoPerfil(e.perfil));
    var txt = criar("span", "cont-evento-textos");
    var rotuloItem = t.rotulo.toUpperCase();
    if (e.virtual) {
      var pl = achar(PLATAFORMAS, e.ideia.plataforma);
      rotuloItem = (feito ? "✓ POSTADO" : "POSTAR") + (pl ? " · " + pl.rotulo.toUpperCase() : "");
    }
    txt.appendChild(criar("small", "", rotuloItem));
    txt.appendChild(criar("b", "", e.titulo || "(sem título)"));
    b.appendChild(txt);
    return b;
  }

  function desenharSemana(seg) {
    var geral = est.perfil === "geral";
    var evs = eventosVisiveis();
    var hoje = hojeISO();
    var grade = criar("div", "cont-semana");
    DIAS.forEach(function (nome, k) {
      var d = addDias(seg, k), s = iso(d);
      var cel = criar("div", "cont-dia" + (s === hoje ? " hoje" : ""));
      var topo = criar("div", "cont-dia-topo");
      var nomeEl = criar("div", "cont-dia-nome");
      nomeEl.appendChild(criar("small", "", nome));
      nomeEl.appendChild(criar("b", "", String(d.getDate())));
      topo.appendChild(nomeEl);
      var mais = botao("cont-dia-mais", "+", function () { abrirEvento(null, s); });
      mais.setAttribute("aria-label", "Adicionar em " + br(s));
      topo.appendChild(mais);
      cel.appendChild(topo);
      evs.filter(function (e) { return String(e.data).slice(0, 10) === s; }).forEach(function (e) { cel.appendChild(botaoEvento(e, geral)); });
      grade.appendChild(cel);
    });
    el["cont-cal-corpo"].appendChild(grade);
  }

  function desenharMes(ancora) {
    var evs = eventosVisiveis();
    var hoje = hojeISO();
    var primeiro = new Date(ancora.getFullYear(), ancora.getMonth(), 1);
    var ultimo = new Date(ancora.getFullYear(), ancora.getMonth() + 1, 0);
    var inicio = segunda(primeiro);
    var total = Math.ceil((((primeiro.getDay() + 6) % 7) + ultimo.getDate()) / 7) * 7;
    var limite = celular() ? 2 : 3;
    var grade = criar("div", "cont-mes");
    DIAS.forEach(function (nome) { grade.appendChild(criar("div", "cont-mes-cab", nome)); });
    for (var k = 0; k < total; k++) {
      (function (d) {
        var s = iso(d);
        var cel = criar("div", "cont-mes-celula" + (d.getMonth() !== ancora.getMonth() ? " fora" : "") + (s === hoje ? " hoje" : ""));
        cel.tabIndex = 0;
        cel.setAttribute("role", "button");
        cel.setAttribute("aria-label", "Ver a semana de " + br(s));
        var abrirSemana = function () { est.calModo = "week"; est.ancora = s; renderCalendario(); };
        cel.addEventListener("click", abrirSemana);
        cel.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirSemana(); } });
        cel.appendChild(criar("span", "cont-mes-num", String(d.getDate())));
        var lista = evs.filter(function (e) { return String(e.data).slice(0, 10) === s; });
        var caixa = criar("div", "cont-mes-eventos");
        lista.slice(0, limite).forEach(function (e) {
          var t = achar(TIPOS, e.tipo) || TIPOS[0];
          var chip = criar("span", "cont-mes-evento", e.titulo || "(sem título)");
          chip.style.background = t.bg;
          chip.style.color = t.fg;
          if (e.virtual && e.ideia.status === "postado") chip.classList.add("feito");
          chip.addEventListener("click", function (ev) { ev.stopPropagation(); abrirItemDoCalendario(e); });
          caixa.appendChild(chip);
        });
        cel.appendChild(caixa);
        if (lista.length > limite) cel.appendChild(criar("span", "cont-mes-mais", "+" + (lista.length - limite)));
        grade.appendChild(cel);
      })(addDias(inicio, k));
    }
    el["cont-cal-corpo"].appendChild(grade);
  }

  /* ---------------------------------------------------------------------
     PROJETOS
     --------------------------------------------------------------------- */
  var nomesPais = null;
  function nomePais(codigo) {
    if (!codigo) return "";
    if (!nomesPais) {
      try { nomesPais = new Intl.DisplayNames(["pt-BR"], { type: "region" }); } catch (erro) { nomesPais = { of: function (c) { return c; } }; }
    }
    try { return nomesPais.of(codigo) || codigo; } catch (erro) { return codigo; }
  }

  // Bandeira do país (imagem). Se a imagem não carregar, mostra o código do país no lugar.
  function criarBandeira(codigo, grande) {
    var classe = "cont-bandeira" + (grande ? " cont-bandeira-grande" : "");
    if (!codigo) {
      var globo = criar("span", classe + " cont-bandeira-vazia");
      globo.innerHTML = ICONE_GLOBO;
      return globo;
    }
    var c = String(codigo).toLowerCase();
    var img = document.createElement("img");
    img.className = classe;
    img.src = "https://flagcdn.com/w80/" + c + ".png";
    img.srcset = "https://flagcdn.com/w160/" + c + ".png 2x";
    img.alt = "Bandeira: " + nomePais(codigo);
    img.addEventListener("error", function () { img.replaceWith(criar("span", classe + " cont-bandeira-vazia", String(codigo).toUpperCase())); });
    return img;
  }

  function preencherPaises() {
    el["cp-pais"].innerHTML = "";
    var vazio = document.createElement("option");
    vazio.value = "";
    vazio.textContent = "Sem país (ex.: uma publicidade)";
    el["cp-pais"].appendChild(vazio);
    CODIGOS_PAIS.map(function (c) { return { codigo: c, nome: nomePais(c) }; })
      .sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); })
      .forEach(function (p) {
        var o = document.createElement("option");
        o.value = p.codigo;
        o.textContent = p.nome;
        el["cp-pais"].appendChild(o);
      });
  }

  function atualizarPreviaBandeira() {
    el["cp-bandeira"].innerHTML = "";
    el["cp-bandeira"].appendChild(criarBandeira(el["cp-pais"].value, false));
  }

  function projetoAtual() { return est.projetoId ? achar(est.projetos, est.projetoId) : null; }

  function renderProjetos() {
    var lista = est.projetos.filter(function (p) { return p.perfil === est.perfil; });
    lista.sort(function (a, b) { return String(b.criado_em || "").localeCompare(String(a.criado_em || "")); });
    el["cont-projetos-vazio"].style.display = lista.length === 0 ? "" : "none";
    el["cont-projetos-grade"].innerHTML = "";
    lista.forEach(function (p) {
      var ideias = est.ideias.filter(function (i) { return i.projeto_id === p.id; });
      var postadas = ideias.filter(function (i) { return i.status === "postado"; }).length;
      var b = botao("cont-projeto-card", "", function () { est.projetoId = p.id; est.filtro = "all"; est.plataforma = "instagram"; render(); });
      b.appendChild(criarBandeira(p.pais, true));
      var textos = criar("div");
      textos.appendChild(criar("span", "cont-projeto-nome", p.nome));
      var meta = (ideias.length === 1 ? "1 ideia" : ideias.length + " ideias") + (postadas ? " · " + postadas + (postadas === 1 ? " postada" : " postadas") : "");
      if (p.pais) meta = nomePais(p.pais) + " · " + meta;
      textos.appendChild(criar("span", "cont-projeto-meta", meta));
      b.appendChild(textos);
      el["cont-projetos-grade"].appendChild(b);
    });
  }

  function renderTopoProjeto(proj) {
    el["cont-projeto-titulo"].innerHTML = "";
    el["cont-projeto-titulo"].appendChild(criarBandeira(proj.pais, true));
    var t = criar("div");
    t.appendChild(document.createTextNode(proj.nome));
    if (proj.pais) t.appendChild(criar("small", "", nomePais(proj.pais)));
    el["cont-projeto-titulo"].appendChild(t);
  }

  function abrirFormProjeto(proj) {
    est.projetoEdit = proj ? { id: proj.id } : { id: null };
    el["cp-titulo-modal"].textContent = proj ? "Editar projeto" : "Novo projeto";
    el["cp-nome"].value = proj ? proj.nome : "";
    el["cp-pais"].value = proj && proj.pais ? proj.pais : "";
    el["cp-apagar"].style.display = proj ? "" : "none";
    atualizarPreviaBandeira();
    U.abrirModal("modal-cont-projeto");
    setTimeout(function () { el["cp-nome"].focus(); }, 50);
  }

  async function salvarProjeto(e) {
    e.preventDefault();
    var nome = el["cp-nome"].value.trim();
    if (!nome) { U.toast("Dê um nome ao projeto.", true); return; }
    var pais = el["cp-pais"].value || null;
    var editando = est.projetoEdit && est.projetoEdit.id;
    var consulta = editando
      ? window.bancoCliente.from("conteudos_projetos").update({ nome: nome, pais: pais }).eq("id", editando)
      : window.bancoCliente.from("conteudos_projetos").insert({ perfil: est.perfil, nome: nome, pais: pais }).select();
    var resultado = await U.consulta("conteudos_projetos", consulta);
    if (resultado.error) return;
    U.fecharModal("modal-cont-projeto");
    U.toast("Projeto salvo.");
    // projeto novo: já abre para você colocar as ideias
    if (!editando && resultado.data && resultado.data[0]) { est.aba = "projetos"; est.projetoId = resultado.data[0].id; est.filtro = "all"; est.plataforma = "instagram"; }
    await carregar();
  }

  async function apagarProjeto() {
    var proj = est.projetoEdit && est.projetoEdit.id ? achar(est.projetos, est.projetoEdit.id) : null;
    if (!proj) return;
    var n = est.ideias.filter(function (i) { return i.projeto_id === proj.id; }).length;
    var aviso = 'Excluir o projeto "' + proj.nome + '"?' + (n ? " As " + n + (n === 1 ? " ideia" : " ideias") + " dentro dele também serão apagadas." : "");
    if (!confirm(aviso)) return;
    var resultado = await U.consulta("conteudos_projetos", window.bancoCliente.from("conteudos_projetos").delete().eq("id", proj.id));
    if (resultado.error) return;
    U.fecharModal("modal-cont-projeto");
    est.projetoId = null;
    U.toast("Projeto excluído.");
    await carregar();
  }
  /* ---------------------------------------------------------------------
     GAVETA: NOVA IDEIA / EDITAR IDEIA
     --------------------------------------------------------------------- */
  function novaIdeia() {
    abrirGaveta({
      id: null, perfil: est.perfil, plataforma: est.plataforma, formato: "", titulo: "", descricao: "", status: "agravar",
      pendente: "", data_postagem: "", inspiracao: "", publi: est.perfil === "ugc", marca: "", prazo: "",
      marcar: "", legenda: "", links: "", mensagem: "",
      serie: "",
      projeto_id: (est.aba === "projetos" && projetoAtual()) ? projetoAtual().id : null
    });
  }

  function abrirGaveta(ideia) {
    est.rascunho = {
      id: ideia.id, perfil: ideia.perfil, plataforma: ideia.plataforma, formato: ideia.formato || "",
      titulo: ideia.titulo || "", descricao: ideia.descricao || "", status: ideia.status || "agravar",
      pendente: ideia.pendente || "", data_postagem: ideia.data_postagem ? String(ideia.data_postagem).slice(0, 10) : "",
      inspiracao: ideia.inspiracao || "", publi: !!ideia.publi, marca: ideia.marca || "",
      prazo: ideia.prazo ? String(ideia.prazo).slice(0, 10) : "",
      marcar: ideia.marcar || "", legenda: ideia.legenda || "", links: ideia.links || "", mensagem: ideia.mensagem || "",
      serie: ideia.serie || "",
      serieOriginal: ideia.serie || "",
      projeto_id: ideia.projeto_id || null
    };
    var r = est.rascunho;
    el["cont-gaveta-titulo"].textContent = r.id ? "Editar ideia" : "Nova ideia";
    el["ci-titulo"].value = r.titulo;
    el["ci-desc"].value = r.descricao;
    el["ci-pendente"].value = r.pendente;
    el["ci-serie"].value = r.serie;
    el["ci-serie-marca"].checked = !!r.serie;
    el["ci-serie-campo"].style.display = r.serie ? "" : "none";
    el["ci-marcar"].value = r.marcar;
    el["ci-legenda"].value = r.legenda;
    el["ci-links"].value = r.links;
    el["ci-mensagem"].value = r.mensagem;
    el["ci-data"].value = r.data_postagem;
    el["ci-inspiracao"].value = r.inspiracao;
    el["ci-publi"].checked = r.publi;
    el["ci-publi-campos"].style.display = r.publi ? "" : "none";
    el["ci-marca"].value = r.marca;
    el["ci-prazo"].value = r.prazo;
    el["ci-apagar"].style.display = r.id ? "" : "none";

    el["ci-plataforma"].innerHTML = "";
    plataformasDo(r.perfil).forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.rotulo;
      el["ci-plataforma"].appendChild(o);
    });
    el["ci-plataforma"].value = r.plataforma;

    desenharStatus();
    desenharFormatos();
    desenharKicker();
    atualizarLinkInspiracao();
    el["cont-gaveta"].classList.add("visivel");
    setTimeout(function () { el["ci-titulo"].focus(); }, 50);
  }

  function fecharGaveta() {
    el["cont-gaveta"].classList.remove("visivel");
  }

  function desenharKicker() {
    var p = perfilDe(est.rascunho.perfil);
    var pl = achar(PLATAFORMAS, est.rascunho.plataforma) || PLATAFORMAS[0];
    var proj = est.rascunho.projeto_id ? achar(est.projetos, est.rascunho.projeto_id) : null;
    el["cont-gaveta-kicker"].textContent = (p.nome + " · " + pl.rotulo + (proj ? " · " + proj.nome : "")).toUpperCase();
  }

  function desenharStatus() {
    el["ci-status"].innerHTML = "";
    STATUS.forEach(function (s) {
      var ativo = est.rascunho.status === s.id;
      var b = botao("cont-pilula" + (ativo ? " ativo" : ""), (s.id === "postado" ? "✓ " : "") + s.rotulo, function () {
        est.rascunho.status = s.id;
        desenharStatus();
      });
      b.style.borderWidth = "1.5px";
      b.style.borderColor = ativo ? s.fg : "";
      b.style.background = ativo ? s.bg : "";
      b.style.color = ativo ? s.fg : "";
      el["ci-status"].appendChild(b);
    });
    el["ci-pendente-wrap"].style.display = est.rascunho.status === "parcial" ? "" : "none";
  }

  function desenharFormatos() {
    el["ci-formato"].innerHTML = "";
    (FORMATOS[est.rascunho.plataforma] || []).forEach(function (f) {
      var ativo = est.rascunho.formato === f;
      var b = botao("cont-pilula" + (ativo ? " ativo" : ""), f, function () {
        est.rascunho.formato = ativo ? "" : f;
        desenharFormatos();
      });
      el["ci-formato"].appendChild(b);
    });
  }

  function atualizarLinkInspiracao() {
    var url = urlInspiracao(est.rascunho.inspiracao);
    el["ci-inspiracao-link"].style.display = url ? "" : "none";
    if (url) el["ci-inspiracao-link"].href = url;
  }

  // Copia o texto de um campo da gaveta (legenda, mensagem...) para colar na hora de postar.
  async function copiarCampo(idCampo) {
    var texto = el[idCampo].value;
    if (!texto.trim()) { U.toast("Esse campo está vazio.", true); return; }
    try {
      await navigator.clipboard.writeText(texto);
    } catch (erro) {
      el[idCampo].focus();
      el[idCampo].select();
      document.execCommand("copy");
    }
    U.toast("Copiado.");
  }

  async function salvarIdeia() {
    var r = est.rascunho;
    var dados = {
      perfil: r.perfil,
      plataforma: r.plataforma,
      formato: r.formato || null,
      titulo: (r.titulo || "").trim() || "Ideia sem título",
      descricao: r.descricao ? r.descricao : null,
      status: r.status,
      pendente: r.pendente ? r.pendente : null,
      data_postagem: r.data_postagem || null,
      inspiracao: (r.inspiracao || "").trim() || null,
      publi: !!r.publi,
      marca: r.publi && r.marca ? r.marca.trim() : null,
      prazo: r.publi && r.prazo ? r.prazo : null,
      marcar: r.marcar ? r.marcar : null,
      legenda: r.legenda ? r.legenda : null,
      links: r.links ? r.links : null,
      mensagem: r.mensagem ? r.mensagem : null
    };
    // só envia projeto_id para ideias de projeto (assim ideias soltas funcionam mesmo antes de criar a coluna)
    if (r.projeto_id) dados.projeto_id = r.projeto_id;
    // série: só envia se tiver número ou se precisar limpar (assim o resto salva mesmo antes de criar a coluna)
    var serie = (r.serie || "").trim();
    if (serie || r.serieOriginal) dados.serie = serie || null;
    var consulta = r.id
      ? window.bancoCliente.from("conteudos_ideias").update(dados).eq("id", r.id)
      : window.bancoCliente.from("conteudos_ideias").insert(dados);
    var resultado = await U.consulta("conteudos_ideias", consulta);
    if (resultado.error) return;
    est.plataforma = dados.plataforma;
    fecharGaveta();
    U.toast("Ideia salva.");
    await carregar();
  }

  async function apagarIdeia() {
    var r = est.rascunho;
    if (!r || !r.id) return;
    if (!confirm("Excluir esta ideia?")) return;
    var resultado = await U.consulta("conteudos_ideias", window.bancoCliente.from("conteudos_ideias").delete().eq("id", r.id));
    if (resultado.error) return;
    fecharGaveta();
    U.toast("Ideia excluída.");
    await carregar();
  }

  /* ---------------------------------------------------------------------
     JANELA: ITEM DO CALENDÁRIO
     --------------------------------------------------------------------- */
  function abrirEvento(evento, dataFixa) {
    est.evento = evento
      ? { id: evento.id, perfil: evento.perfil, tipo: evento.tipo, titulo: evento.titulo || "", data: String(evento.data).slice(0, 10) }
      : { id: null, perfil: est.perfil === "geral" ? "entracomigo" : est.perfil, tipo: "gravar", titulo: "", data: dataFixa || hojeISO() };
    el["ce-titulo-modal"].textContent = evento ? "Editar no calendário" : "Adicionar ao calendário";
    el["ce-titulo"].value = est.evento.titulo;
    el["ce-data"].value = est.evento.data;
    el["ce-perfil"].value = est.evento.perfil;
    el["ce-apagar"].style.display = evento ? "" : "none";
    desenharTipos();
    U.abrirModal("modal-cont-evento");
  }

  function desenharTipos() {
    el["ce-tipo"].innerHTML = "";
    TIPOS.forEach(function (t) {
      var ativo = est.evento.tipo === t.id;
      var b = botao("cont-pilula", t.rotulo, function () { est.evento.tipo = t.id; desenharTipos(); });
      b.style.borderWidth = "1.5px";
      b.style.borderColor = ativo ? t.cor : "";
      b.style.background = ativo ? t.bg : "";
      b.style.color = ativo ? t.fg : "";
      el["ce-tipo"].appendChild(b);
    });
  }

  async function salvarEvento(e) {
    e.preventDefault();
    var x = est.evento;
    if (!x.data) { U.toast("Escolha a data.", true); return; }
    var dados = { perfil: x.perfil, tipo: x.tipo, titulo: (x.titulo || "").trim() || null, data: x.data };
    var consulta = x.id
      ? window.bancoCliente.from("conteudos_agenda").update(dados).eq("id", x.id)
      : window.bancoCliente.from("conteudos_agenda").insert(dados);
    var resultado = await U.consulta("conteudos_agenda", consulta);
    if (resultado.error) return;
    U.fecharModal("modal-cont-evento");
    U.toast("Salvo no calendário.");
    await carregar();
  }

  async function apagarEvento() {
    var x = est.evento;
    if (!x || !x.id) return;
    if (!confirm("Excluir este item do calendário?")) return;
    var resultado = await U.consulta("conteudos_agenda", window.bancoCliente.from("conteudos_agenda").delete().eq("id", x.id));
    if (resultado.error) return;
    U.fecharModal("modal-cont-evento");
    U.toast("Item excluído.");
    await carregar();
  }
})();
