/* Barra do topo: selo da próxima data especial, contagem regressiva e mensagens que trocam uma por vez.
   Tudo é calculado sozinho a partir de config/barra-topo.js. A "data de hoje" é sempre a de São Paulo,
   não a do computador de quem visita, e os dias são contados por data (sem horário), então não há erro de horário de verão. */
(function () {
  "use strict";

  const CFG = window.BARRA_TOPO_CONFIG || { vagas: "ultimas", janelaDias: 60, intervaloMs: 3500, whatsapp: "5511996975223", datas: [] };
  const DIA_MS = 86400000;
  const prefereReduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function doisDigitos(n) { return String(n).padStart(2, "0"); }

  // "AAAA-MM-DD" de hoje no fuso de São Paulo (ou da data simulada, nos testes)
  function hojeSP(agora) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora || new Date());
  }
  function emUTC(texto) {
    const p = texto.split("-");
    return Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function diasEntre(de, ate) { return Math.round((emUTC(ate) - emUTC(de)) / DIA_MS); }

  // Data (AAAA-MM-DD) de uma data especial em um ano. As móveis (Dia das Mães, Black Friday...) saem da regra.
  function dataNoAno(d, ano) {
    if (d.regra === "fixa") return ano + "-" + doisDigitos(d.mes) + "-" + doisDigitos(d.dia);
    const primeiro = new Date(Date.UTC(ano, d.mes - 1, 1)).getUTCDay();
    const dia = 1 + ((d.diaSemana - primeiro + 7) % 7) + (d.ordem - 1) * 7;
    return ano + "-" + doisDigitos(d.mes) + "-" + doisDigitos(dia);
  }

  // Próxima data especial a partir de hoje (hoje conta; no dia seguinte passa para a próxima).
  function proximaData(hoje) {
    if (CFG.dataManual && CFG.dataManual.data) {
      const d = CFG.datas.find(function (x) { return x.id === CFG.dataManual.id; }) || { id: CFG.dataManual.id, prep: "pro" };
      return { id: d.id, prep: d.prep, data: CFG.dataManual.data };
    }
    const ano = Number(hoje.slice(0, 4));
    let melhor = null;
    CFG.datas.forEach(function (d) {
      [ano, ano + 1].forEach(function (a) {
        const data = dataNoAno(d, a);
        if (data >= hoje && (!melhor || data < melhor.data)) melhor = { id: d.id, prep: d.prep, data: data };
      });
    });
    return melhor;
  }

  // Mês-alvo (1 a 12): até o dia 10 vale o mês atual; depois, o próximo.
  function mesAlvo(hoje) {
    if (CFG.mesManual) return Number(CFG.mesManual);
    const mes = Number(hoje.slice(5, 7));
    return Number(hoje.slice(8, 10)) <= 10 ? mes : (mes % 12) + 1;
  }

  // Tudo que a barra precisa saber para uma data. "idioma" só serve para os testes (a barra usa o idioma da página).
  function calcular(hoje, idioma) {
    const prox = proximaData(hoje);
    const n = prox ? diasEntre(hoje, prox.data) : null;
    const dentro = prox !== null && n <= CFG.janelaDias;
    const mes = mesAlvo(hoje);
    const nomeMes = Idiomas.t("barra.mes." + mes, null, idioma);
    const nomeData = prox ? Idiomas.t("barra.data." + prox.id, null, idioma) : "";
    let contagem = null;
    if (dentro) {
      const chave = n === 0 ? "barra.contagem.hoje" : (n === 1 ? "barra.contagem.um" : "barra.contagem.varios");
      contagem = Idiomas.t(chave, { n: n, prep: prox.prep, data: nomeData }, idioma);
    }
    return {
      dentro: dentro, n: n, mes: mes, nomeMes: nomeMes, nomeData: nomeData, idData: prox && prox.id,
      selo: dentro ? nomeData.toUpperCase() : Idiomas.t("barra.agenda", null, idioma),
      contagem: contagem
    };
  }

  function mensagens(c, idioma) {
    const p = { mes: c.nomeMes, data: c.nomeData };
    const lista = [
      Idiomas.t(CFG.vagas === "abertas" ? "barra.msg.abertas" : "barra.msg.ultimas", p, idioma),
      Idiomas.t("barra.msg.reserve", p, idioma),
      Idiomas.t("barra.msg.instagram", p, idioma),
      Idiomas.t("barra.msg.tiktok", p, idioma),
      Idiomas.t("barra.msg.youtube", p, idioma),
      Idiomas.t("barra.msg.ads", p, idioma)
    ];
    if (c.dentro) lista.push(Idiomas.t("barra.msg.criativos", p, idioma));
    lista.push(Idiomas.t("barra.msg.entrega", p, idioma));
    return lista;
  }

  /* ---------------- Tela ---------------- */
  const el = {
    barra: document.getElementById("barra-topo"),
    selo: document.getElementById("barra-selo"),
    seloLongo: document.getElementById("barra-selo-longo"),
    seloCurto: document.getElementById("barra-selo-curto"),
    contagem: document.getElementById("barra-contagem"),
    sep: document.getElementById("barra-sep"),
    msgs: document.getElementById("barra-msgs"),
    link: document.getElementById("barra-link")
  };
  let hojeMostrado = "";
  let indice = 0;
  let timer = null;
  let pausado = false;

  function textoSeloCurto(c) {
    if (!c.dentro) return c.selo;
    const chave = c.n === 0 ? "barra.selo.hoje" : (c.n === 1 ? "barra.selo.um" : "barra.selo.curto");
    return Idiomas.t(chave, { data: c.nomeData.toUpperCase(), n: c.n });
  }

  function mostrar(i) {
    const itens = el.msgs.children;
    if (!itens.length) return;
    const anterior = el.msgs.querySelector(".ativa");
    if (anterior) { anterior.classList.remove("ativa"); anterior.classList.add("saindo"); const a = anterior; setTimeout(function () { a.classList.remove("saindo"); }, 450); }
    itens[i].classList.remove("saindo");
    itens[i].classList.add("ativa");
  }

  function iniciarRodizio() {
    clearInterval(timer);
    timer = null;
    if (prefereReduzir || el.msgs.children.length < 2) return;
    timer = setInterval(function () {
      if (pausado || document.hidden) return;
      indice = (indice + 1) % el.msgs.children.length;
      mostrar(indice);
    }, CFG.intervaloMs || 3500);
  }

  function renderizar(agora) {
    if (!el.barra) return;
    const hoje = hojeSP(agora);
    hojeMostrado = hoje;
    const c = calcular(hoje);
    el.seloLongo.textContent = c.selo;
    el.seloCurto.textContent = textoSeloCurto(c);
    el.selo.hidden = false;
    el.contagem.textContent = c.contagem || "";
    el.contagem.hidden = !c.contagem;
    el.sep.hidden = !c.contagem;

    const lista = mensagens(c);
    el.msgs.innerHTML = "";
    lista.forEach(function (texto) {
      const s = document.createElement("span");
      s.className = "barra-msg";
      s.textContent = texto;
      el.msgs.appendChild(s);
    });
    indice = 0;
    el.msgs.children[0].classList.add("ativa"); // movimento reduzido: fica só a primeira mensagem, parada

    el.link.textContent = Idiomas.t("barra.reservar");
    const wa = Idiomas.t("barra.wa", { mes: c.nomeMes });
    el.link.href = "https://wa.me/" + (CFG.whatsapp || "5511996975223") + "?text=" + encodeURIComponent(wa);
    iniciarRodizio();
  }

  /* ---------------- Testes ---------------- */
  // BarraTopo.testar() no console: confere os resultados esperados (em português) e a regra do fuso.
  function testar() {
    const esperados = [
      ["2026-10-29", "BLACK FRIDAY", "Faltam 29 dias pra Black Friday", "novembro"],
      ["2026-11-05", "BLACK FRIDAY", "Faltam 22 dias pra Black Friday", "novembro"],
      ["2026-11-20", "BLACK FRIDAY", "Faltam 7 dias pra Black Friday", "dezembro"],
      ["2026-11-26", "BLACK FRIDAY", "Falta 1 dia pra Black Friday", "dezembro"],
      ["2026-11-27", "BLACK FRIDAY", "É hoje: Black Friday!", "dezembro"],
      ["2026-11-28", "NATAL", "Faltam 27 dias pro Natal", "dezembro"],
      ["2026-12-24", "NATAL", "Falta 1 dia pro Natal", "janeiro"],
      ["2026-12-26", "AGENDA ABERTA", null, "janeiro"],
      ["2027-01-15", "DIA DO CONSUMIDOR", "Faltam 59 dias pro Dia do Consumidor", "fevereiro"],
      ["2027-03-14", "DIA DO CONSUMIDOR", "Falta 1 dia pro Dia do Consumidor", "abril"]
    ];
    const linhas = esperados.map(function (e) {
      const c = calcular(e[0], "pt");
      const ok = c.selo === e[1] && c.contagem === e[2] && c.nomeMes === e[3];
      return { data: e[0], ok: ok, selo: c.selo, contagem: c.contagem, mes: c.nomeMes, esperado: e.slice(1).join(" | ") };
    });
    // datas móveis: conferência do briefing
    const mov = {
      "blackfriday 2026": [dataNoAno(CFG.datas.find(function (d) { return d.id === "blackfriday"; }), 2026), "2026-11-27"],
      "blackfriday 2027": [dataNoAno(CFG.datas.find(function (d) { return d.id === "blackfriday"; }), 2027), "2027-11-26"],
      "maes 2027": [dataNoAno(CFG.datas.find(function (d) { return d.id === "maes"; }), 2027), "2027-05-09"],
      "pais 2027": [dataNoAno(CFG.datas.find(function (d) { return d.id === "pais"; }), 2027), "2027-08-08"]
    };
    Object.keys(mov).forEach(function (k) { linhas.push({ data: k, ok: mov[k][0] === mov[k][1], selo: mov[k][0], esperado: mov[k][1] }); });
    // fuso: 23h do dia 29/10 em São Paulo já é dia 30 em Lisboa e outros fusos; a barra tem de dizer 29
    const instante = new Date(Date.UTC(2026, 9, 30, 2, 0, 0)); // 30/10 02:00 UTC = 29/10 23:00 em São Paulo
    linhas.push({ data: "fuso (23h em SP)", ok: hojeSP(instante) === "2026-10-29", selo: hojeSP(instante), esperado: "2026-10-29" });
    return linhas;
  }

  window.BarraTopo = { calcular: calcular, hojeSP: hojeSP, dataNoAno: dataNoAno, diasEntre: diasEntre, testar: testar, renderizar: renderizar };

  if (!el.barra) return;
  el.barra.addEventListener("mouseenter", function () { pausado = true; });
  el.barra.addEventListener("mouseleave", function () { pausado = false; });
  el.barra.addEventListener("focusin", function () { pausado = true; });
  el.barra.addEventListener("focusout", function () { pausado = false; });

  // Recalcula ao trocar de idioma e na virada do dia (horário de São Paulo), para quem deixa a aba aberta.
  Idiomas.aoMudar(function () { renderizar(); });
  function conferirDia() { if (hojeSP() !== hojeMostrado) renderizar(); }
  setInterval(conferirDia, 60000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) conferirDia(); });
  renderizar();
})();
