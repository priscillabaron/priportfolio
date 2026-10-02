/* Página de um nicho: mostra todos os vídeos daquele nicho e os links para os outros.
   O nome do nicho vem do atributo data-nicho do <body> de cada página. */
(function () {
  "use strict";

  const nomeNicho = document.body.getAttribute("data-nicho");
  const lista = Nichos.lista;
  const posicao = lista.indexOf(nomeNicho);

  const CONTATO = {
    whatsappNumero: "5511996975223",
    email: "pribaronparcerias@gmail.com",
    instagramUsuario: "@entracomigo"
  };

  /* ---- Menu e altura do cabeçalho ---- */
  const header = document.querySelector(".site-header");
  const botaoMenu = document.getElementById("botao-menu");
  const menuPrincipal = document.getElementById("menu-principal");
  function ajustarAlturaHeader() {
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  }
  ajustarAlturaHeader();
  window.addEventListener("resize", ajustarAlturaHeader);
  function definirMenu(aberto) {
    menuPrincipal.classList.toggle("aberto", aberto);
    botaoMenu.setAttribute("aria-expanded", aberto ? "true" : "false");
    botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  }
  botaoMenu.addEventListener("click", function () {
    definirMenu(botaoMenu.getAttribute("aria-expanded") !== "true");
  });
  menuPrincipal.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { definirMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") definirMenu(false); });

  /* ---- Rodapé ---- */
  const rodapeRedesEl = document.getElementById("rodape-redes");
  [
    { texto: "Instagram " + CONTATO.instagramUsuario, href: "https://instagram.com/" + CONTATO.instagramUsuario.replace("@", "") },
    { texto: "WhatsApp", href: "https://wa.me/" + CONTATO.whatsappNumero },
    { texto: "E-mail", href: "mailto:" + CONTATO.email }
  ].forEach(function (r) {
    const a = document.createElement("a");
    a.href = r.href;
    a.textContent = r.texto;
    if (r.href.indexOf("http") === 0) { a.target = "_blank"; a.rel = "noopener"; }
    rodapeRedesEl.appendChild(a);
  });
  document.getElementById("ano-atual").textContent = new Date().getFullYear();

  /* ---- Entrada suave ---- */
  const observer = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visivel");
        observer.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });

  /* ---- Título, botão de contato e lista dos outros nichos ---- */
  const tituloEl = document.getElementById("nicho-titulo");
  tituloEl.textContent = "";
  tituloEl.appendChild(Nichos.montarTitulo(nomeNicho, "span"));
  document.getElementById("nicho-numero").textContent = "Nicho " + String(posicao + 1).padStart(2, "0");
  document.getElementById("cta-nicho").textContent = nomeNicho;
  document.getElementById("cta-whatsapp").href = "https://wa.me/" + CONTATO.whatsappNumero +
    "?text=" + encodeURIComponent("Oi, Priscilla! Vi seu portfólio e quero um conteúdo no nicho " + nomeNicho + ".");

  const outrosEl = document.getElementById("nicho-outros");
  lista.forEach(function (nome, i) {
    const a = document.createElement("a");
    a.className = "nicho-pilula";
    a.href = "../" + Nichos.slug(nome) + "/";
    a.appendChild(Nichos.criarTexto("span", "vitrine-aba-numero", String(i + 1).padStart(2, "0")));
    a.appendChild(document.createTextNode(nome));
    if (nome === nomeNicho) a.setAttribute("aria-current", "page");
    outrosEl.appendChild(a);
  });

  /* ---- Vídeos do nicho ---- */
  const grade = document.getElementById("nicho-grade");
  const contagem = document.getElementById("nicho-contagem");

  function mostrarVideos(videos) {
    grade.innerHTML = "";
    const emBreve = videos.length === 0;
    const itens = emBreve ? [0, 1, 2, 3].map(function () { return { titulo: "Vídeo em breve" }; }) : videos;
    itens.forEach(function (v, i) { grade.appendChild(Nichos.montarCartao(v, i, emBreve)); });
    contagem.textContent = emBreve
      ? "Os primeiros vídeos desse nicho chegam em breve."
      : (videos.length === 1 ? "1 vídeo nesse nicho" : videos.length + " vídeos nesse nicho");
  }

  async function carregar() {
    let videos = [];
    try {
      if (!window.bancoCliente) throw new Error("Supabase não carregou");
      const resultado = await window.bancoCliente
        .from("videos")
        .select("*")
        .eq("visivel", true)
        .order("ordem", { ascending: true });
      if (resultado.error) throw resultado.error;
      const alvo = Nichos.chave(nomeNicho);
      videos = (resultado.data || []).filter(function (v) { return Nichos.chave(v.nicho) === alvo; });
    } catch (erro) {
      console.error("Não consegui carregar os vídeos desse nicho:", erro);
    }
    mostrarVideos(videos);
  }
  contagem.textContent = "Carregando vídeos...";
  carregar();

  /* ---- Registro de visita (mesmo modelo da home) ---- */
  (async function registrarVisita() {
    try {
      if (!window.bancoCliente) return;
      let origem = "direto";
      if (document.referrer) {
        try { origem = new URL(document.referrer).hostname.replace(/^www\./, ""); }
        catch (e) { origem = "direto"; }
      }
      await window.bancoCliente.from("visitas").insert({ pagina: "nicho: " + nomeNicho, origem: origem });
    } catch (erro) {
      // Sem internet ou banco fora do ar: a visita simplesmente não é contada.
    }
  })();
})();
