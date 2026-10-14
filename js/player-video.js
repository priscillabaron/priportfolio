/* Player dos vídeos do portfólio (YouTube Shorts dentro do próprio site, sem abrir o YouTube).
   - Passar o mouse em cima: o vídeo roda sem som.
   - Clicar (ou tocar, no celular): passa a ter som. Clicar de novo pausa.
   - Só um vídeo pode ter som por vez: ao ligar o som de um, os outros com som são pausados.
   O vídeo só é carregado quando a pessoa passa o mouse ou toca, para a página abrir rápido. */
(function () {
  "use strict";

  const todos = [];          // todos os players da página
  const porJanela = new Map(); // janela do iframe -> player (para ouvir o que o YouTube responde)
  const MAX_IFRAMES = 4;     // quantos vídeos ficam carregados ao mesmo tempo
  const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)");

  function t(chave, padrao) {
    try { if (window.Idiomas && Idiomas.existe(chave)) return Idiomas.t(chave); } catch (e) { /* usa o padrão */ }
    return padrao;
  }

  // Aceita youtube.com/shorts/ID, youtu.be/ID, youtube.com/watch?v=ID e /embed/ID.
  function idDoVideo(link) {
    try {
      const u = new URL(link);
      const host = u.hostname.replace(/^www\./, "");
      if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] || "";
      if (host.endsWith("youtube.com")) {
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        const m = u.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/);
        if (m) return m[1];
      }
    } catch (e) { /* link inválido */ }
    return "";
  }

  // O YouTube avisa por mensagem quando o player está pronto e quando o vídeo está rodando.
  window.addEventListener("message", function (e) {
    const p = porJanela.get(e.source);
    if (!p) return;
    let d = e.data;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (err) { return; } }
    if (!d || typeof d !== "object") return;
    p.aoReceber(d);
  });

  function anexar(capa, link, opcoes) {
    const opc = opcoes || {};
    const id = idDoVideo(link);
    if (!id) return null;

    let iframe = null;
    let pronto = false;
    let fila = [];
    let timerOla = null;
    let comSom = false;
    let tocando = false;
    let visivel = true;

    capa.classList.add("pv");
    capa.setAttribute("role", "button");
    if (opc.titulo) capa.setAttribute("aria-label", t("destaques.assistir", "{t}, assistir vídeo").replace("{t}", opc.titulo));
    if (opc.focavel !== false) capa.tabIndex = 0;

    // capa do vídeo (a imagem do próprio YouTube) enquanto o vídeo não roda
    const foto = document.createElement("img");
    foto.className = "pv-foto";
    foto.alt = "";
    foto.loading = "lazy";
    foto.decoding = "async";
    foto.referrerPolicy = "no-referrer";
    foto.addEventListener("error", function () {
      if (foto.dataset.tentou) return;
      foto.dataset.tentou = "1";
      foto.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    });
    foto.src = "https://i.ytimg.com/vi/" + id + "/sddefault.jpg";
    capa.insertBefore(foto, capa.firstChild);

    // camada transparente por cima: recebe o mouse e o toque (o vídeo não rouba a rolagem do carrossel)
    const toque = document.createElement("div");
    toque.className = "pv-toque";
    capa.appendChild(toque);

    const selo = document.createElement("span");
    selo.className = "pv-selo";
    selo.setAttribute("aria-hidden", "true");
    capa.appendChild(selo);

    function permitido() { return !opc.ativo || opc.ativo(); }

    function enviar(func, args) {
      if (!iframe) return;
      const msg = JSON.stringify({ event: "command", func: func, args: args || [] });
      if (!pronto) { fila.push(msg); return; }
      try { iframe.contentWindow.postMessage(msg, "*"); } catch (e) { /* iframe saiu */ }
    }

    function liberarFila() {
      if (pronto) return;
      pronto = true;
      clearInterval(timerOla);
      const pendentes = fila;
      fila = [];
      // sem legendas do YouTube (a conta de quem assiste pode ter legenda automática ligada)
      ["captions", "cc"].forEach(function (modulo) {
        try { iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unloadModule", args: [modulo] }), "*"); } catch (e) { /* tudo bem */ }
      });
      pendentes.forEach(function (m) { try { iframe.contentWindow.postMessage(m, "*"); } catch (e) { /* tudo bem */ } });
    }

    // Mantém no máximo MAX_IFRAMES vídeos carregados: remove os parados mais antigos.
    function limparAntigos() {
      const carregados = todos.filter(function (p) { return p.temIframe(); });
      if (carregados.length <= MAX_IFRAMES) return;
      for (let i = 0; i < carregados.length && carregados.length - i > MAX_IFRAMES; i++) {
        const p = carregados[i];
        if (p !== api && !p.estaComSom() && !p.estaTocando()) p.descarregar();
      }
    }

    function garantirIframe() {
      if (iframe) return;
      iframe = document.createElement("iframe");
      const origem = location.origin && location.origin !== "null" ? "&origin=" + encodeURIComponent(location.origin) : "";
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id +
        "?enablejsapi=1&autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=" + id +
        "&rel=0&modestbranding=1&fs=0&disablekb=1&iv_load_policy=3&cc_load_policy=0&showinfo=0" + origem;
      iframe.title = opc.titulo || "Vídeo";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("tabindex", "-1");
      iframe.setAttribute("aria-hidden", "true");
      iframe.className = "pv-iframe";
      iframe.addEventListener("load", function () {
        porJanela.set(iframe.contentWindow, api);
        // "puxa conversa" com o player até ele responder
        let tentativas = 0;
        timerOla = setInterval(function () {
          if (pronto || !iframe || ++tentativas > 40) { clearInterval(timerOla); return; }
          try { iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); } catch (e) { /* tudo bem */ }
        }, 250);
      });
      capa.insertBefore(iframe, toque);
      limparAntigos();
    }

    function descarregar() {
      if (!iframe) return;
      porJanela.delete(iframe.contentWindow);
      clearInterval(timerOla);
      iframe.remove();
      iframe = null;
      pronto = false;
      fila = [];
      tocando = false;
      capa.classList.remove("tocando", "com-som");
      atualizarSelo();
    }

    // Se o YouTube não avisar que começou, mostra o vídeo mesmo assim depois de um tempinho.
    let timerMostrar = null;
    function garantirVisivel() {
      clearTimeout(timerMostrar);
      timerMostrar = setTimeout(function () { if (tocando) capa.classList.add("tocando"); }, 2000);
    }

    function atualizarSelo() {
      if (comSom) selo.textContent = "🔊 " + t("video.comSom", "Com som · pausar");
      else if (tocando) selo.textContent = "🔇 " + t("video.ouvir", "Ativar o som");
      else selo.textContent = "";
    }

    function tocarMudo() {
      if (comSom || !permitido()) return;
      garantirIframe();
      enviar("mute");
      enviar("playVideo");
      tocando = true;
      garantirVisivel();
      atualizarSelo();
    }
    function pausar() {
      enviar("pauseVideo");
      tocando = false;
      capa.classList.remove("tocando", "com-som");
      atualizarSelo();
    }
    function ligarSom() {
      // só um vídeo com som por vez
      todos.forEach(function (p) { if (p !== api && p.estaComSom()) p.parar(); });
      garantirIframe();
      enviar("unMute");
      enviar("setVolume", [100]);
      enviar("playVideo");
      comSom = true;
      tocando = true;
      garantirVisivel();
      capa.classList.add("com-som");
      atualizarSelo();
    }
    function parar() {
      comSom = false;
      pausar();
    }

    toque.addEventListener("mouseenter", function () { if (temMouse.matches) tocarMudo(); });
    toque.addEventListener("mouseleave", function () { if (temMouse.matches && !comSom) pausar(); });
    function alternar(e) {
      if (!permitido()) return; // deixa o clique seguir (ex.: trazer o slide vizinho para o meio)
      e.preventDefault();
      e.stopPropagation();
      if (comSom) parar(); else ligarSom();
    }
    toque.addEventListener("click", alternar);
    capa.addEventListener("keydown", function (e) {
      if (e.target !== capa) return;
      if (e.key === "Enter" || e.key === " ") alternar(e);
    });

    // Se o vídeo com som sai da tela, para (ninguém fica ouvindo sem ver).
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        visivel = entradas[0].isIntersecting;
        if (!visivel && (comSom || tocando)) parar();
      }, { threshold: 0.2 }).observe(capa);
    }

    const api = {
      parar: parar,
      estaComSom: function () { return comSom; },
      estaTocando: function () { return tocando; },
      temIframe: function () { return !!iframe; },
      descarregar: descarregar,
      aoReceber: function (d) {
        if (d.event === "onReady" || d.event === "initialDelivery" || d.event === "infoDelivery" || d.event === "onStateChange") liberarFila();
        const estado = d.info && typeof d.info.playerState === "number" ? d.info.playerState : (d.event === "onStateChange" && typeof d.info === "number" ? d.info : null);
        if (estado === 1 && tocando) capa.classList.add("tocando");
        if ((estado === 2 || estado === 0 || estado === 5) && !tocando) capa.classList.remove("tocando");
      }
    };
    todos.push(api);
    return api;
  }

  function algumComSom() {
    return todos.some(function (p) { return p.estaComSom(); });
  }

  window.PlayerVideo = { anexar: anexar, idDoVideo: idDoVideo, algumComSom: algumComSom };
})();
