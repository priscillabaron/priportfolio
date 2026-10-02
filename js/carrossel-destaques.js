/* Carrossel dos "Conteúdos de destaque": o vídeo do meio fica grande e os vizinhos ficam
   esmaecidos. Passa sozinho a cada poucos segundos, ou com as setas, o teclado ou o dedo.
   Pausa quando o mouse ou o foco estão em cima e não passa sozinho para quem pediu menos movimento. */
(function () {
  "use strict";

  const FUNDOS = ["#E8E1DA", "#E2E8EC", "#EEE4DE", "#E5E3E6"];
  const INTERVALO_MS = 4500;
  const prefereReduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let encerrar = null; // limpa timer e observador do carrossel anterior ao montar de novo

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function criarSlide(item, indice, total, emBreve) {
    const slide = el("div", "destaques-slide");
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", Idiomas.t("destaques.slide", { i: indice + 1, n: total }));

    if (item.marca) slide.appendChild(el("p", "destaques-marca", item.marca));

    const temLink = !emBreve && item.link && item.link !== "#";
    const capa = el(temLink ? "a" : "div", "destaques-capa");
    capa.style.background = FUNDOS[indice % FUNDOS.length];
    if (temLink) {
      capa.href = item.link;
      capa.target = "_blank";
      capa.rel = "noopener";
      capa.setAttribute("aria-label", Idiomas.t("destaques.assistir", { t: item.titulo }));
    }
    if (emBreve) {
      capa.appendChild(el("span", "destaques-marca-dagua", "p.b."));
    } else {
      const play = el("span", "destaques-play");
      play.setAttribute("aria-hidden", "true");
      capa.appendChild(play);
    }
    slide.appendChild(capa);

    if (item.destaque) slide.appendChild(el("p", "destaques-metrica", item.destaque));
    if (item.titulo) slide.appendChild(el("p", "destaques-legenda", item.titulo));
    return { el: slide, capa: capa };
  }

  // palco: elemento que contém o trilho e as setas. itens: vídeos com {marca, destaque, titulo, link}.
  function montar(palco, itens, emBreve) {
    if (encerrar) encerrar();
    const trilho = palco.querySelector(".destaques-trilho");
    const anterior = palco.querySelector(".destaques-seta-ant");
    const proximo = palco.querySelector(".destaques-seta-prox");
    trilho.innerHTML = "";
    const total = itens.length;
    palco.classList.toggle("sem-setas", emBreve || total < 2);
    anterior.setAttribute("aria-label", Idiomas.t("destaques.anterior"));
    proximo.setAttribute("aria-label", Idiomas.t("destaques.proximo"));
    palco.setAttribute("aria-label", Idiomas.t("destaques.carrossel"));

    const slides = itens.map(function (item, i) {
      const s = criarSlide(item, i, total, emBreve);
      trilho.appendChild(s.el);
      return s;
    });

    let atual = 0;
    function deslocamento(i) {
      let d = i - atual;
      if (d > total / 2) d -= total;
      if (d < -total / 2) d += total;
      return d;
    }
    function desenhar() {
      slides.forEach(function (s, i) {
        const d = deslocamento(i);
        s.el.dataset.pos = d === 0 ? "0" : (d === 1 ? "1" : (d === -1 ? "-1" : "fora"));
        s.el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
        s.capa.tabIndex = d === 0 ? 0 : -1;
      });
    }
    function ir(novo) {
      atual = ((novo % total) + total) % total;
      desenhar();
    }
    desenhar();

    slides.forEach(function (s, i) {
      s.el.addEventListener("click", function (e) {
        if (deslocamento(i) !== 0) { e.preventDefault(); ir(i); reiniciar(); }
      });
    });
    anterior.onclick = function () { ir(atual - 1); reiniciar(); };
    proximo.onclick = function () { ir(atual + 1); reiniciar(); };
    palco.onkeydown = function (e) {
      if (e.key === "ArrowLeft") { ir(atual - 1); reiniciar(); }
      if (e.key === "ArrowRight") { ir(atual + 1); reiniciar(); }
    };

    // Dedo: arrastar para o lado passa para o vídeo vizinho.
    let inicioX = null;
    trilho.ontouchstart = function (e) { inicioX = e.touches[0].clientX; };
    trilho.ontouchend = function (e) {
      if (inicioX === null) return;
      const dx = e.changedTouches[0].clientX - inicioX;
      inicioX = null;
      if (Math.abs(dx) > 40) { ir(atual + (dx < 0 ? 1 : -1)); reiniciar(); }
    };

    // Passagem automática
    let timer = null, pausado = false, visivel = false, observador = null;
    function reiniciar() {
      if (timer) clearInterval(timer);
      timer = null;
      if (prefereReduzir || emBreve || total < 2) return;
      timer = setInterval(function () {
        if (!pausado && visivel && !document.hidden) ir(atual + 1);
      }, INTERVALO_MS);
    }
    palco.onmouseenter = function () { pausado = true; };
    palco.onmouseleave = function () { pausado = false; };
    palco.onfocusin = function () { pausado = true; };
    palco.onfocusout = function () { pausado = false; };
    observador = new IntersectionObserver(function (entradas) { visivel = entradas[0].isIntersecting; }, { threshold: 0.35 });
    observador.observe(palco);
    reiniciar();

    encerrar = function () {
      if (timer) clearInterval(timer);
      if (observador) observador.disconnect();
      encerrar = null;
    };
  }

  window.CarrosselDestaques = { montar: montar };
})();
