/* Player dos vídeos do portfólio (YouTube Shorts dentro do próprio site, sem abrir o YouTube).
   - Passar o mouse em cima: o vídeo roda sem som.
   - Clicar (ou tocar, no celular): passa a ter som. Clicar de novo pausa.
   - Só um vídeo pode ter som por vez: ao ligar o som de um, os outros com som são pausados.
   O vídeo só é carregado quando a pessoa passa o mouse ou toca, para a página abrir rápido. */
(function () {
  "use strict";

  const todos = [];          // todos os players da página
  const porJanela = new Map(); // janela do iframe -> player (para ouvir o que o YouTube responde)
  const MAX_IFRAMES = 14;    // quantos vídeos ficam carregados ao mesmo tempo
  const MAX_AQUECIDOS = 10;  // quantos vídeos da tela ficam preparados (pausados) para tocar na hora
  // "any-hover": notebook com tela de toque também conta (o mouse é reconhecido pelo tipo do evento, mais abaixo)
  const temMouse = window.matchMedia("(any-hover: hover)");
  const economiaDeDados = !!(navigator.connection && navigator.connection.saveData);

  // Prepara os vídeos que aparecem na tela, um de cada vez, para o play ser instantâneo ao passar o mouse.
  const filaAquecer = [];
  let aquecendo = false;
  function agendarAquecer(p) {
    if (filaAquecer.indexOf(p) === -1) filaAquecer.push(p);
    proximoAquecer();
  }
  function proximoAquecer() {
    if (aquecendo) return;
    const p = filaAquecer.shift();
    if (!p) return;
    aquecendo = true;
    p.aquecer();
    setTimeout(function () { aquecendo = false; proximoAquecer(); }, 200);
  }

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
    let estadoAtual = -1;   // último estado que o YouTube informou (1 = rodando, 3 = carregando, 2 = pausado)
    let tempoAtual = 0;     // quanto do vídeo já passou, em segundos
    let legendasDesligadas = false;
    let duracaoAtual = 0;
    let reiniciando = false;
    let timerRevelar = null;
    let timerEscurecer = null;
    let timerFalha = null;
    let recebeu = false;    // o YouTube já respondeu alguma coisa?
    let criadoEm = 0;       // quando o player atual foi criado
    let preparando = false; // player carregado só para ficar pronto (pausa sozinho no começo)
    let preparado = false;  // já pausou no começo com o vídeo baixado: dá play na hora

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
    // capa na maior qualidade que existir: maxres, depois sd, depois hq
    const tamanhos = ["maxresdefault", "sddefault", "hqdefault"];
    let passo = 0;
    function proximaCapa() {
      if (passo >= tamanhos.length) return;
      foto.src = "https://i.ytimg.com/vi/" + id + "/" + tamanhos[passo++] + ".jpg";
    }
    foto.addEventListener("error", proximaCapa);
    foto.addEventListener("load", function () {
      if (foto.naturalWidth > 0 && foto.naturalWidth < 300) proximaCapa(); // imagem reserva minúscula do YouTube
    });
    proximaCapa();
    capa.insertBefore(foto, capa.firstChild);

    // camada transparente por cima: recebe o mouse e o toque (o vídeo não rouba a rolagem do carrossel)
    const toque = document.createElement("div");
    toque.className = "pv-toque";
    capa.appendChild(toque);

    // botão de play: só aparece se o vídeo não começar sozinho (o navegador pode não deixar). O clique sempre inicia.
    const iconePlay = document.createElement("span");
    iconePlay.className = "pv-play";
    iconePlay.setAttribute("aria-hidden", "true");
    capa.appendChild(iconePlay);

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

    // sem legendas do YouTube (o módulo de legenda só carrega depois que o vídeo começa, então o comando se repete)
    function semLegendas() {
      if (!iframe) return;
      ["captions", "cc"].forEach(function (modulo) {
        try { iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unloadModule", args: [modulo] }), "*"); } catch (e) { /* tudo bem */ }
      });
    }

    function liberarFila() {
      if (pronto) return;
      pronto = true;
      clearInterval(timerOla);
      const pendentes = fila;
      fila = [];
      semLegendas();
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

    // aquecendo = true: carrega o player escondido e, assim que ele começa a rodar (sem som), pausa no início:
    // o vídeo já fica baixado e é só dar play quando a pessoa passar o mouse
    function garantirIframe(aquecendo) {
      if (iframe) return;
      criadoEm = Date.now();
      preparando = !!aquecendo;
      iframe = document.createElement("iframe");
      const origem = location.origin && location.origin !== "null" ? "&origin=" + encodeURIComponent(location.origin) : "";
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id +
        "?enablejsapi=1&autoplay=1&mute=" + (comSom ? 0 : 1) + "&controls=0&playsinline=1" +
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
      recebeu = false;
      preparando = false;
      preparado = false;
      fila = [];
      tocando = false;
      estadoAtual = -1;
      tempoAtual = 0;
      duracaoAtual = 0;
      reiniciando = false;
      legendasDesligadas = false;
      clearTimeout(timerRevelar);
      timerRevelar = null;
      clearTimeout(timerEscurecer);
      timerEscurecer = null;
      clearTimeout(timerMostrar);
      clearTimeout(timerFalha);
      capa.classList.remove("tocando", "com-som", "sem-autoplay", "so-youtube");
      atualizarSelo();
    }

    // Só se o YouTube nunca avisar nada (mensagens bloqueadas), mostra o vídeo mesmo assim depois de um tempo.
    // Normalmente a capa fica visível até o vídeo estar mesmo rodando, para nunca aparecer um quadro preto.
    let timerMostrar = null;
    function garantirVisivel() {
      clearTimeout(timerMostrar);
      timerMostrar = setTimeout(function () { if (tocando && !recebeu) capa.classList.add("tocando"); }, 8000);
    }

    // Se em alguns segundos o vídeo não começou sozinho (o navegador não deixou), mostra o play: clicar sempre inicia.
    function vigiarInicio() {
      clearTimeout(timerFalha);
      timerFalha = setTimeout(function () {
        if (tocando && !capa.classList.contains("tocando")) {
          // 1ª vez: o navegador não deixou tocar sozinho (o clique resolve). Se já foi um clique e ainda não toca,
          // o player do YouTube não está funcionando aqui: o próximo clique abre o vídeo no YouTube.
          capa.classList.add(comSom ? "so-youtube" : "sem-autoplay");
          atualizarSelo();
        }
      }, 3500);
    }

    function atualizarSelo() {
      // só aparece quando está tocando sem som; com som, nada por cima do vídeo
      if (capa.classList.contains("so-youtube")) selo.textContent = "↗ " + t("video.abrir", "Abrir o vídeo");
      else if (capa.classList.contains("sem-autoplay") && tocando) selo.textContent = "▶ " + t("video.assistir", "Clique para assistir");
      else if (tocando && !comSom) selo.textContent = "🔇 " + t("video.ouvir", "Clique para ouvir");
      else selo.textContent = "";
    }
    function tocarMudo() {
      if (comSom || !permitido()) return;
      garantirIframe(false);
      enviar("mute");
      if (tempoAtual > 1) { enviar("seekTo", [0, true]); tempoAtual = 0; } // já tinha rodado: começa do início
      enviar("playVideo");
      tocando = true;
      garantirVisivel();
      vigiarInicio();
      atualizarSelo();
    }
    // Pausar = o vídeo volta a ser só a capa, mas o player continua carregado (escondido) para tocar na hora de novo.
    // O iframe é bem mais largo que o card, então o que o YouTube desenha em volta fica fora da vista.
    function pausar() {
      if (!iframe) return;
      tocando = false;
      enviar("pauseVideo");
      clearTimeout(timerRevelar);
      timerRevelar = null;
      clearTimeout(timerEscurecer);
      timerEscurecer = null;
      clearTimeout(timerMostrar);
      clearTimeout(timerFalha);
      capa.classList.remove("tocando", "com-som", "sem-autoplay", "so-youtube");
      atualizarSelo();
    }
    function ligarSom() {
      // só um vídeo com som por vez
      todos.forEach(function (p) { if (p !== api && p.estaComSom()) p.parar(); });
      // se já estava rodando sem som (passou o mouse), o clique só liga o som e volta ao começo, sem recarregar nada
      const jaRodava = !!iframe && pronto;
      comSom = true;
      garantirIframe(false);
      enviar("unMute");
      enviar("setVolume", [100]);
      // volta ao começo só se já passou um pouco (se acabou de começar, já está no começo)
      if (jaRodava && tempoAtual > 0.6) { enviar("seekTo", [0, true]); tempoAtual = 0; }
      enviar("playVideo");
      tocando = true;
      garantirVisivel();
      vigiarInicio();
      capa.classList.add("com-som");
      atualizarSelo();
    }
    function parar() {
      comSom = false;
      enviar("mute");
      pausar();
    }
    function aquecer() {
      if (iframe || !visivel || !permitido() || document.hidden) return;
      const carregados = todos.filter(function (p) { return p.temIframe(); }).length;
      if (carregados >= MAX_AQUECIDOS) return;
      garantirIframe(true);
    }

    // Só mouse (ou caneta) dispara o play ao passar; o dedo usa o clique. Pelo tipo do evento, não pelo aparelho.
    function eMouse(e) { return e.pointerType === "mouse" || e.pointerType === "pen"; }
    toque.addEventListener("pointerenter", function (e) { if (eMouse(e)) tocarMudo(); });
    toque.addEventListener("pointerleave", function (e) { if (eMouse(e) && !comSom) pausar(); });
    function alternar(e) {
      if (!permitido()) return; // deixa o clique seguir (ex.: trazer o slide vizinho para o meio)
      e.preventDefault();
      e.stopPropagation();
      if (capa.classList.contains("so-youtube")) { window.open(link, "_blank", "noopener"); return; }
      if (comSom) { parar(); return; }
      // só recria o player se ele nunca respondeu (travado); se está carregando, o clique só liga o som e não perde tempo
      if (iframe && !recebeu && Date.now() - criadoEm > 4000) descarregar();
      ligarSom();
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
        if (!visivel) {
          // saiu da tela: para (ninguém fica ouvindo sem ver) e libera o player
          comSom = false;
          descarregar();
        } else if (temMouse.matches && !economiaDeDados && !iframe) {
          agendarAquecer(api);
        }
      }, { threshold: 0.2 }).observe(capa);
    }

    const api = {
      parar: parar,
      estaComSom: function () { return comSom; },
      estaTocando: function () { return tocando; },
      temIframe: function () { return !!iframe; },
      aquecer: aquecer,
      descarregar: descarregar,
      aoReceber: function (d) {
        recebeu = true;
        if (d.event === "onReady" || d.event === "initialDelivery" || d.event === "infoDelivery" || d.event === "onStateChange") liberarFila();
        if (d.info && typeof d.info === "object") {
          if (typeof d.info.playerState === "number") estadoAtual = d.info.playerState;
          if (typeof d.info.currentTime === "number") {
            // se o tempo está andando, o vídeo está rodando (mesmo que o aviso de estado tenha se perdido)
            if (tocando && d.info.currentTime > tempoAtual + 0.1 && estadoAtual !== 1) estadoAtual = 1;
            tempoAtual = d.info.currentTime;
          }
          if (typeof d.info.duration === "number" && d.info.duration > 0) duracaoAtual = d.info.duration;
        } else if (d.event === "onStateChange" && typeof d.info === "number") {
          estadoAtual = d.info;
        }
        if (preparando && estadoAtual === 1) {
          preparando = false;
          if (!tocando) { enviar("pauseVideo"); enviar("seekTo", [0, true]); tempoAtual = 0; preparado = true; }
        }
        if (estadoAtual === 1 && !legendasDesligadas) {
          legendasDesligadas = true; // uma vez por vez que o vídeo começa
          semLegendas();
          setTimeout(semLegendas, 700);
          setTimeout(semLegendas, 2000);
        } else if (estadoAtual !== 1 && estadoAtual !== -1) {
          legendasDesligadas = false;
        }
        // Repete o vídeo sozinho (sem usar a lista do YouTube, que traz botões de anterior e próximo)
        if (tocando && iframe) {
          const acabando = duracaoAtual > 1 && tempoAtual >= duracaoAtual - 0.35;
          if ((estadoAtual === 0 || acabando) && !reiniciando) {
            reiniciando = true;
            enviar("seekTo", [0, true]);
            enviar("playVideo");
            setTimeout(function () { reiniciando = false; }, 1500);
          }
        }
        // O vídeo só aparece por cima da capa quando já está rodando de verdade (sem quadro preto no começo).
        // Player já preparado (vídeo baixado e parado no começo) aparece quase na hora; o frio espera rodar estável.
        // Depois de um clique (comSom) também aparece rápido: a pessoa já está ouvindo e espera ver.
        const rapido = preparado || comSom;
        if (tocando && estadoAtual === 1 && tempoAtual > (rapido ? 0 : 0.12)) {
          clearTimeout(timerEscurecer);
          timerEscurecer = null;
          if (!timerRevelar && !capa.classList.contains("tocando")) {
            timerRevelar = setTimeout(function () {
              timerRevelar = null;
              if (tocando && estadoAtual === 1) { capa.classList.add("tocando"); capa.classList.remove("sem-autoplay"); atualizarSelo(); }
            }, rapido ? 80 : 220);
          }
        } else if (estadoAtual !== 1 && estadoAtual !== -1) {
          clearTimeout(timerRevelar);
          timerRevelar = null;
          // carregando por um instante (ex.: voltou ao começo): mantém o vídeo na tela em vez de piscar a capa
          if (estadoAtual === 3 && tocando && capa.classList.contains("tocando")) {
            if (!timerEscurecer) timerEscurecer = setTimeout(function () { timerEscurecer = null; if (estadoAtual !== 1) capa.classList.remove("tocando"); }, 2500);
          } else {
            capa.classList.remove("tocando");
          }
        }
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
