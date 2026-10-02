// ============================================================================
// ABA: PROSPECÇÃO. Manda o e-mail de apresentação para várias marcas.
// Os destinatários vêm sempre da tabela "marcas" (aba Marcas).
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;

  var EMAIL_DONA = "pribaronparcerias@gmail.com";
  // Nome da função de envio publicada no Supabase (o Supabase gerou este nome sozinho).
  var NOME_FUNCAO = "bright-endpoint";
  var TAMANHO_LOTE = 100;
  var CHAVE_RASCUNHO = "prospeccaoRascunhoV1";
  var ROTULOS_SITUACAO = {
    lead: "Só os leads",
    conversando: "Só quem está conversando",
    cliente: "Só quem já é cliente",
    parada: "Só as marcas paradas"
  };
  var ORDEM_SITUACAO = ["lead", "conversando", "cliente", "parada"];
  var RODAPE_SAIR = "Se não quiser receber mais e-mails, é só responder com SAIR.";

  var marcas = [];
  var optouts = {};
  var envios = [];
  var totalOk = null;
  var totalErro = null;
  var tabelasFaltando = {};
  var colunasFaltando = [];
  var listaEscolhida = "selecionadas";
  var modoEscrita = "texto";
  var modoEnvio = "resend";
  var jaReceberam = {};
  var fila = [];
  var filaIndice = 0;
  var enviando = false;
  var testeFeito = false;
  var resolverPergunta = null;
  var temporizadorPreview = null;
  var temporizadorAssunto = null;

  window.AdminProspeccao = { iniciar: iniciar };

  // ---- utilidades --------------------------------------------------------------
  function $(id) { return document.getElementById(id); }

  function esc(t) {
    return String(t === null || t === undefined ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function emailNorm(e) { return String(e || "").trim().toLowerCase(); }
  function emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim()); }
  function primeiroNome(t) { return String(t || "").trim().split(/\s+/)[0] || ""; }
  function situacaoDe(m) { return String(m.situacao != null ? m.situacao : (m.status || "")).toLowerCase(); }
  function ehTabelaAusente(erro) {
    return !!erro && (erro.code === "42P01" || erro.code === "42703" || erro.code === "PGRST205" || erro.code === "PGRST204");
  }
  function linkNorm(l) {
    var t = String(l || "").trim();
    if (!t) return "";
    return /^(https?:|mailto:)/i.test(t) ? t : "https://" + t;
  }
  function plural(n, um, varios) { return n === 1 ? um : varios; }

  // Troca {{nome}} e {{marca}}. Dentro de HTML, os valores são "escapados".
  function trocar(texto, nome, marca, comoHtml) {
    var n = comoHtml ? esc(nome) : nome;
    var m = comoHtml ? esc(marca) : marca;
    return String(texto || "")
      .replace(/\{\{\s*nome\s*\}\}/gi, function () { return n; })
      .replace(/\{\{\s*marca\s*\}\}/gi, function () { return m; });
  }

  // ---- montagem do e-mail ------------------------------------------------------
  function paragrafosHtml(texto) {
    var seguro = esc(texto.replace(/\r\n/g, "\n").trim());
    seguro = seguro.replace(/(https?:\/\/[^\s<]+)/g, function (url) {
      var sobra = "";
      var m = url.match(/[.,;:!?)]+$/);
      if (m) { sobra = m[0]; url = url.slice(0, url.length - sobra.length); }
      return '<a href="' + url + '" style="color:#3e5e82;">' + url + "</a>" + sobra;
    });
    return seguro.split(/\n{2,}/).map(function (p) {
      return '<p style="margin:0 0 16px;">' + p.replace(/\n/g, "<br>") + "</p>";
    }).join("\n");
  }

  function montarHtmlModelo(c) {
    var botao = "";
    if (c.botaoTexto && c.botaoLink) {
      botao = '<p style="margin:24px 0;"><a href="' + esc(linkNorm(c.botaoLink)) + '" style="display:inline-block;background:#3e5e82;color:#ffffff;padding:14px 26px;border-radius:8px;text-decoration:none;font-weight:bold;">' + esc(c.botaoTexto) + "</a></p>";
    }
    return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n' +
      '<body style="margin:0;background:#ffffff;">\n' +
      '<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1f2933;">\n' +
      paragrafosHtml(c.texto || "") + "\n" +
      botao + "\n" +
      '<p style="font-size:12px;color:#8a949e;margin:32px 0 0;border-top:1px solid #e6e9ec;padding-top:14px;">' + RODAPE_SAIR + "</p>\n" +
      "</div>\n</body>\n</html>";
  }

  function htmlParaTexto(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,style").forEach(function (el) { el.remove(); });
    doc.querySelectorAll("a[href]").forEach(function (a) {
      var t = a.textContent.trim();
      var h = a.getAttribute("href");
      a.textContent = (t && t !== h) ? t + " (" + h + ")" : h;
    });
    doc.querySelectorAll("br").forEach(function (b) { b.replaceWith("\n"); });
    doc.querySelectorAll("p,div,h1,h2,h3,h4,li,tr").forEach(function (el) { el.appendChild(doc.createTextNode("\n\n")); });
    return doc.body.textContent.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function lerCampos() {
    return {
      assunto: $("pro-assunto").value.trim(),
      texto: $("pro-texto").value,
      botaoTexto: $("pro-botao-texto").value.trim(),
      botaoLink: $("pro-botao-link").value.trim(),
      html: $("pro-html").value
    };
  }

  function htmlAtual(c) {
    return modoEscrita === "html" ? c.html : montarHtmlModelo(c);
  }

  function conteudoVazio(c) {
    return modoEscrita === "html" ? !c.html.trim() : !c.texto.trim();
  }

  function textoPlanoDe(item, c) {
    if (modoEscrita === "html") return htmlParaTexto(trocar(c.html, item.nome, item.marca, true));
    var t = trocar(c.texto, item.nome, item.marca, false).trim();
    if (c.botaoTexto && c.botaoLink) t += "\n\n" + c.botaoTexto + ": " + linkNorm(c.botaoLink);
    return t + "\n\n--\n" + RODAPE_SAIR;
  }

  // ---- rascunho salvo no navegador (só os campos do e-mail) --------------------
  function salvarRascunho() {
    try {
      var c = lerCampos();
      localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(c));
    } catch (e) { /* sem armazenamento, segue normal */ }
  }
  function carregarRascunho() {
    try {
      var bruto = localStorage.getItem(CHAVE_RASCUNHO);
      if (!bruto) return;
      var c = JSON.parse(bruto);
      $("pro-assunto").value = c.assunto || "";
      $("pro-texto").value = c.texto || "";
      $("pro-botao-texto").value = c.botaoTexto || "";
      $("pro-botao-link").value = c.botaoLink || "";
      $("pro-html").value = c.html || "";
    } catch (e) { /* ignora */ }
  }

  // ---- janela de pergunta (promessa: true = confirmou) -------------------------
  function perguntar(opcoes) {
    return new Promise(function (resolve) {
      $("pro-confirma-titulo").textContent = opcoes.titulo || "Confirmar";
      $("pro-confirma-texto").textContent = opcoes.texto || "";
      $("pro-confirma-aviso").innerHTML = opcoes.aviso ? '<div class="pro-aviso">' + opcoes.aviso + "</div>" : "";
      $("pro-confirma-sim").textContent = opcoes.sim || "Confirmar";
      $("pro-confirma-nao").textContent = opcoes.nao || "Cancelar";
      resolverPergunta = resolve;
      U.abrirModal("modal-pro-confirma");
    });
  }
  function fecharPergunta(resposta) {
    var r = resolverPergunta;
    resolverPergunta = null;
    U.fecharModal("modal-pro-confirma");
    if (r) r(resposta);
  }

  // ---- início --------------------------------------------------------------------
  async function iniciar() {
    carregarRascunho();
    ligarEventos();
    atualizarPreview();
    await recarregar();
  }

  function ligarEventos() {
    $("pro-lista").addEventListener("change", function () {
      listaEscolhida = $("pro-lista").value;
      renderizarLista();
      atualizarPreview();
    });

    document.querySelectorAll("[data-modo-escrita]").forEach(function (b) {
      b.addEventListener("click", function () {
        modoEscrita = b.getAttribute("data-modo-escrita");
        document.querySelectorAll("[data-modo-escrita]").forEach(function (x) { x.classList.toggle("ativo", x === b); });
        $("pro-grupo-texto").style.display = modoEscrita === "texto" ? "" : "none";
        $("pro-grupo-html").style.display = modoEscrita === "html" ? "" : "none";
        atualizarPreview();
      });
    });

    document.querySelectorAll("[data-modo-envio]").forEach(function (b) {
      b.addEventListener("click", function () {
        modoEnvio = b.getAttribute("data-modo-envio");
        document.querySelectorAll("[data-modo-envio]").forEach(function (x) { x.classList.toggle("ativo", x === b); });
        $("pro-acoes-resend").style.display = modoEnvio === "resend" ? "" : "none";
        $("pro-acoes-rascunho").style.display = modoEnvio === "rascunho" ? "" : "none";
        $("pro-nota-modo-envio").textContent = modoEnvio === "resend"
          ? "O Resend manda tudo sozinho. Ele só entrega para outras pessoas depois que você verificar um domínio seu."
          : "Funciona sem Resend. O sistema monta o e-mail de cada marca e abre o Gmail já preenchido, você só clica em enviar.";
        renderizarLista();
      });
    });

    ["pro-assunto", "pro-texto", "pro-botao-texto", "pro-botao-link", "pro-html"].forEach(function (id) {
      $(id).addEventListener("input", function () {
        salvarRascunho();
        clearTimeout(temporizadorPreview);
        temporizadorPreview = setTimeout(atualizarPreview, 150);
        if (id === "pro-assunto") {
          clearTimeout(temporizadorAssunto);
          temporizadorAssunto = setTimeout(atualizarJaReceberam, 500);
        }
      });
    });
    $("pro-pular-enviados").addEventListener("change", renderizarLista);

    $("pro-html-modelo").addEventListener("click", comecarDoModelo);
    $("pro-btn-tela-cheia").addEventListener("click", abrirTelaCheia);
    $("pro-btn-teste").addEventListener("click", enviarTeste);
    $("pro-btn-disparar").addEventListener("click", disparar);
    $("pro-btn-fila").addEventListener("click", montarFila);
    $("pro-ir-marcas-vazio").addEventListener("click", irParaMarcas);
    $("pro-optout-add").addEventListener("click", adicionarOptout);
    $("pro-busca-historico").addEventListener("input", U.debounce(renderizarHistorico, 200));

    $("pro-confirma-sim").addEventListener("click", function () { fecharPergunta(true); });
    $("pro-confirma-nao").addEventListener("click", function () { fecharPergunta(false); });
    new MutationObserver(function () {
      if (!$("modal-pro-confirma").classList.contains("visivel") && resolverPergunta) {
        var r = resolverPergunta;
        resolverPergunta = null;
        r(false);
      }
    }).observe($("modal-pro-confirma"), { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("aba-ativada", function (e) {
      if (e.detail === "prospeccao" && !enviando) recarregar();
    });
  }

  function irParaMarcas() {
    var item = document.querySelector('.nav-item[data-aba="marcas"]');
    if (item) item.click();
  }

  // ---- carregar dados -------------------------------------------------------------
  function registrarFalta(nome, resultado) {
    if (resultado.error && ehTabelaAusente(resultado.error)) tabelasFaltando[nome] = true;
  }

  async function recarregar() {
    tabelasFaltando = {};
    colunasFaltando = [];

    var r1 = await U.consulta("marcas", window.bancoCliente.from("marcas").select("*"));
    marcas = r1.data || [];
    if (marcas.length) {
      if (!("selecionada" in marcas[0])) colunasFaltando.push("marcas.selecionada");
      if (!("prospeccao_enviada_em" in marcas[0])) colunasFaltando.push("marcas.prospeccao_enviada_em");
    }

    var r2 = await U.consulta("email_optout", window.bancoCliente.from("email_optout").select("email, criado_em").order("criado_em", { ascending: false }));
    registrarFalta("email_optout", r2);
    optouts = {};
    (r2.data || []).forEach(function (o) { optouts[emailNorm(o.email)] = o; });

    var r3 = await U.consulta("email_envios", window.bancoCliente.from("email_envios").select("*").order("criado_em", { ascending: false }).limit(500));
    registrarFalta("email_envios", r3);
    envios = r3.data || [];

    var rOk = await U.consulta("email_envios", window.bancoCliente.from("email_envios").select("id", { count: "exact", head: true }).eq("status", "ok"));
    totalOk = (!rOk.error && typeof rOk.count === "number") ? rOk.count : null;
    var rErro = await U.consulta("email_envios", window.bancoCliente.from("email_envios").select("id", { count: "exact", head: true }).eq("status", "erro"));
    totalErro = (!rErro.error && typeof rErro.count === "number") ? rErro.count : null;

    renderizarTudo();
    atualizarJaReceberam();
  }

  async function atualizarJaReceberam() {
    var assunto = $("pro-assunto").value.trim();
    jaReceberam = {};
    if (assunto && !tabelasFaltando.email_envios) {
      var r = await U.consulta("email_envios", window.bancoCliente.from("email_envios").select("email").eq("assunto_modelo", assunto).eq("status", "ok").limit(5000));
      (r.data || []).forEach(function (x) { jaReceberam[emailNorm(x.email)] = true; });
    }
    renderizarLista();
  }

  function renderizarTudo() {
    renderizarAvisoTabelas();
    renderizarCapaECartoes();
    renderizarLista();
    renderizarOptout();
    renderizarHistorico();
    atualizarPreview();
  }

  function renderizarAvisoTabelas() {
    var faltas = Object.keys(tabelasFaltando).concat(colunasFaltando);
    var aviso = $("pro-aviso-tabelas");
    if (faltas.length === 0) { aviso.style.display = "none"; return; }
    aviso.style.display = "block";
    aviso.textContent = "Ainda falta algo no banco: " + faltas.join(", ") + ". Rode o arquivo disparo.sql no Supabase. Enquanto isso o resto da aba continua funcionando.";
  }

  // ---- capa e cartões ---------------------------------------------------------------
  function marcasUnicasComEmail() {
    var vistos = {};
    var lista = [];
    marcas.forEach(function (m) {
      var e = emailNorm(m.email);
      if (!emailValido(e)) return;
      if (!vistos[e]) { vistos[e] = { email: e, enviada: false }; lista.push(vistos[e]); }
      if (m.prospeccao_enviada_em) vistos[e].enviada = true;
    });
    return lista;
  }

  function renderizarCapaECartoes() {
    $("pro-total-enviados").textContent = (totalOk && totalOk > 0) ? totalOk.toLocaleString("pt-BR") : "-";

    var unicas = marcasUnicasComEmail();
    var aEnviar = unicas.filter(function (u) { return !u.enviada && !optouts[u.email]; }).length;
    var jaRec = unicas.filter(function (u) { return u.enviada; }).length;
    var qtdOptout = tabelasFaltando.email_optout ? null : Object.keys(optouts).length;

    var cartoes = [
      { cor: "var(--azul)", valor: String(unicas.length), nome: "marcas com e-mail", ctx: "de " + marcas.length + " na sua base" },
      { cor: "var(--verde)", valor: String(aEnviar), nome: "a enviar", ctx: "ainda sem e-mail de apresentação" },
      { cor: "#c98a0a", valor: String(jaRec), nome: "já receberam", ctx: "marcadas como enviadas" },
      { cor: "#2f80c4", valor: totalErro === null ? "-" : String(totalErro), nome: "falhas", ctx: "veja no histórico abaixo" },
      { cor: "var(--vermelho)", valor: qtdOptout === null ? "-" : String(qtdOptout), nome: "descadastrados", ctx: "nunca mais recebem" }
    ];
    var caixa = $("pro-cartoes");
    caixa.innerHTML = "";
    cartoes.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "pro-cartao";
      el.style.setProperty("--cor", c.cor);
      el.innerHTML = "<b>" + esc(c.valor) + '</b><p class="pro-cartao-nome">' + esc(c.nome) + '</p><p class="pro-cartao-ctx">' + esc(c.ctx) + "</p>";
      caixa.appendChild(el);
    });

    var semEmail = unicas.length === 0;
    $("pro-sem-email").style.display = semEmail ? "block" : "none";
    $("pro-envio").style.display = semEmail ? "none" : "block";
  }

  // ---- listas de destinatários -------------------------------------------------------
  function listasDisponiveis() {
    var l = [
      { id: "selecionadas", rotulo: "Só as marcas selecionadas", filtro: function (m) { return !!m.selecionada; } },
      { id: "teste", rotulo: "Só pra mim (teste)" },
      { id: "todas", rotulo: "Todas as marcas que têm e-mail", filtro: function () { return true; } }
    ];
    var vistas = {};
    marcas.forEach(function (m) { var s = situacaoDe(m); if (s) vistas[s] = true; });
    var chaves = Object.keys(vistas).sort(function (a, b) {
      var ia = ORDEM_SITUACAO.indexOf(a), ib = ORDEM_SITUACAO.indexOf(b);
      if (ia === -1) ia = 99; if (ib === -1) ib = 99;
      return ia - ib || (a < b ? -1 : 1);
    });
    chaves.forEach(function (s) {
      l.push({ id: "sit:" + s, rotulo: ROTULOS_SITUACAO[s] || ("Situação: " + s), filtro: function (m) { return situacaoDe(m) === s; } });
    });
    return l;
  }

  function listaAtual() {
    var todas = listasDisponiveis();
    var achada = todas.filter(function (l) { return l.id === listaEscolhida; })[0];
    if (!achada) { listaEscolhida = "selecionadas"; achada = todas[0]; }
    return achada;
  }

  function calcular(lista) {
    if (lista.id === "teste") {
      return { destinatarios: [{ email: EMAIL_DONA, nome: "Priscilla", marca: "Priscilla Baron", ids: [] }], semEmail: 0, descadastrados: 0, repetidos: 0, marcasNaLista: 1 };
    }
    var base = marcas.filter(lista.filtro);
    var semEmail = 0, repetidos = 0;
    var vistos = {};
    var unicos = [];
    base.forEach(function (m) {
      var e = emailNorm(m.email);
      if (!emailValido(e)) { semEmail++; return; }
      if (vistos[e]) { vistos[e].ids.push(m.id); repetidos++; return; }
      var d = { email: e, nome: primeiroNome(m.contato_nome) || primeiroNome(m.nome), marca: String(m.nome || "").trim(), ids: [m.id] };
      vistos[e] = d;
      unicos.push(d);
    });
    var finais = unicos.filter(function (d) { return !optouts[d.email]; });
    return { destinatarios: finais, semEmail: semEmail, descadastrados: unicos.length - finais.length, repetidos: repetidos, marcasNaLista: base.length };
  }

  function renderizarLista() {
    var select = $("pro-lista");
    var todas = listasDisponiveis();
    var atual = listaAtual();
    select.innerHTML = "";
    todas.forEach(function (l) {
      var op = document.createElement("option");
      op.value = l.id;
      var qtd = calcular(l).destinatarios.length;
      op.textContent = l.rotulo + " · " + qtd;
      if (l.id === atual.id) op.selected = true;
      select.appendChild(op);
    });

    var calc = calcular(atual);
    var pular = $("pro-pular-enviados").checked && atual.id !== "teste";
    var jaTem = pular ? calc.destinatarios.filter(function (d) { return jaReceberam[d.email]; }).length : 0;
    var vaiReceber = calc.destinatarios.length - jaTem;

    var partes = [];
    partes.push("<b>" + vaiReceber + " " + plural(vaiReceber, "marca", "marcas") + "</b> vão receber");
    if (calc.semEmail) partes.push("<span>" + calc.semEmail + " ficaram de fora por não ter e-mail</span>");
    if (calc.repetidos) partes.push("<span>" + calc.repetidos + " com e-mail repetido (manda uma vez só)</span>");
    if (calc.descadastrados) partes.push("<span>" + calc.descadastrados + plural(calc.descadastrados, " descadastrado pulado", " descadastrados pulados") + "</span>");
    if (jaTem) partes.push("<span>" + jaTem + " já receberam este assunto, pulados</span>");
    $("pro-contagem").innerHTML = partes.join(" · ");

    var alerta = $("pro-alerta-lista");
    var bloqueado = false;
    if (atual.id === "selecionadas" && calc.marcasNaLista === 0) {
      alerta.style.display = "block";
      alerta.innerHTML = 'Você ainda não selecionou nenhuma marca. Vá na aba Marcas, marque as caixinhas e volte aqui.<br><button type="button" class="btn btn-primario" id="pro-ir-marcas-selecionar">Ir para Marcas</button>';
      $("pro-ir-marcas-selecionar").addEventListener("click", irParaMarcas);
      bloqueado = true;
    } else if (calc.destinatarios.length === 0) {
      alerta.style.display = "block";
      alerta.textContent = "Nenhuma marca com e-mail nesta lista.";
      bloqueado = true;
    } else {
      alerta.style.display = "none";
    }

    var travar = bloqueado || enviando;
    $("pro-btn-disparar").disabled = travar;
    $("pro-btn-fila").disabled = travar;
    $("pro-btn-teste").disabled = enviando;
  }

  // ---- prévia ----------------------------------------------------------------------
  function exemplo() {
    var lista = listaAtual();
    if (lista.id !== "teste") {
      var d = calcular(lista).destinatarios[0];
      if (d) return { nome: d.nome || "Camila", marca: d.marca || "Marca Exemplo", real: true };
    }
    return { nome: "Camila", marca: "Marca Exemplo", real: false };
  }

  function documentoPrevia(c, ex) {
    if (conteudoVazio(c)) {
      return '<html><body style="margin:0;font-family:Arial,sans-serif;color:#8a949e;"><div style="padding:36px 24px;text-align:center;font-size:14px;">Escreva o e-mail ao lado e ele aparece aqui, do jeito que vai chegar.</div></body></html>';
    }
    return trocar(htmlAtual(c), ex.nome, ex.marca, true);
  }

  function ajustarAltura(iframe) {
    try {
      var doc = iframe.contentDocument;
      if (doc && doc.documentElement) iframe.style.height = Math.max(220, doc.documentElement.scrollHeight) + "px";
    } catch (e) { /* sem acesso, mantém a altura padrão */ }
  }

  function atualizarPreview() {
    var c = lerCampos();
    var ex = exemplo();
    var assunto = trocar(c.assunto || "(sem assunto)", ex.nome, ex.marca, false);
    $("pro-prev-assunto").textContent = assunto;
    var iframe = $("pro-prev-iframe");
    iframe.onload = function () { ajustarAltura(iframe); };
    iframe.srcdoc = documentoPrevia(c, ex);
    $("pro-prev-exemplo").textContent = "Prévia com o nome de exemplo: " + ex.nome + " (" + ex.marca + ")";
  }

  function abrirTelaCheia() {
    var c = lerCampos();
    var ex = exemplo();
    $("pro-cheia-assunto").textContent = trocar(c.assunto || "(sem assunto)", ex.nome, ex.marca, false);
    var iframe = $("pro-cheia-iframe");
    iframe.onload = function () { ajustarAltura(iframe); };
    iframe.srcdoc = documentoPrevia(c, ex);
    U.abrirModal("modal-pro-tela-cheia");
  }

  async function comecarDoModelo() {
    var c = lerCampos();
    if ($("pro-html").value.trim()) {
      var ok = await perguntar({
        titulo: "Substituir o HTML?",
        texto: "O campo de HTML já tem conteúdo. Começar do modelo pronto vai apagar o que está lá.",
        sim: "Substituir", nao: "Manter o meu"
      });
      if (!ok) return;
    }
    $("pro-html").value = montarHtmlModelo(c);
    salvarRascunho();
    atualizarPreview();
  }

  // ---- chamar a função do carteiro ------------------------------------------------------
  async function descreverErroFuncao(erro) {
    try {
      if (erro && erro.context && typeof erro.context.json === "function") {
        var j = await erro.context.json();
        if (j && j.erro) return j.erro;
      }
    } catch (e) { /* segue */ }
    if (erro && erro.context && erro.context.status === 404) return "A função de envio ainda não foi publicada no Supabase.";
    return "Não consegui falar com a função de envio. Confira se ela foi publicada no Supabase e se você está logada.";
  }

  async function chamarFuncao(corpo) {
    try {
      var r = await window.bancoCliente.functions.invoke(NOME_FUNCAO, { body: corpo });
      if (r.error) return { erroTexto: await descreverErroFuncao(r.error) };
      return { dados: r.data };
    } catch (e) {
      return { erroTexto: "Não consegui falar com a função de envio. Confira sua internet e se a função foi publicada." };
    }
  }

  function validar(c) {
    if (!c.assunto) return "Escreva o assunto do e-mail.";
    if (conteudoVazio(c)) return modoEscrita === "html" ? "Cole o HTML do e-mail." : "Escreva o texto do e-mail.";
    if ((c.botaoTexto && !c.botaoLink) || (!c.botaoTexto && c.botaoLink)) {
      if (modoEscrita === "texto") return "Para ter o botão, preencha o texto e o link dele (ou deixe os dois vazios).";
    }
    return "";
  }

  // ---- teste ---------------------------------------------------------------------------
  async function enviarTeste() {
    if (enviando) return;
    var c = lerCampos();
    var erro = validar(c);
    if (erro) { U.toast(erro, true); return; }
    var ex = exemplo();
    enviando = true;
    renderizarLista();
    $("pro-btn-teste").textContent = "Enviando teste...";
    var r = await chamarFuncao({ teste: true, assunto: c.assunto, html: htmlAtual(c), destinatarios: [{ email: EMAIL_DONA, nome: ex.nome, marca: ex.marca }] });
    $("pro-btn-teste").textContent = "Enviar teste pra mim";
    enviando = false;
    renderizarLista();
    mostrarResumo("");
    if (r.erroTexto) { mostrarResumo('<div class="pro-erro">' + esc(r.erroTexto) + "</div>"); return; }
    var d = r.dados || {};
    if (d.enviados > 0) {
      testeFeito = true;
      mostrarResumo('<div class="pro-ok">Teste enviado para ' + esc(EMAIL_DONA) + ". Abra o e-mail no celular e confira o nome e a marca antes de disparar.</div>");
    } else {
      mostrarResumo('<div class="pro-erro">O teste não saiu. ' + esc((d.erros && d.erros[0]) || "Confira a chave do Resend nos segredos do Supabase.") + "</div>");
    }
  }

  function mostrarResumo(html) { $("pro-resumo-envio").innerHTML = html; }

  // ---- disparo pelo Resend ------------------------------------------------------------
  async function prepararDestinatarios(lista, c) {
    var calc = calcular(lista);
    var dest = calc.destinatarios.slice();
    var pulados = 0;
    if ($("pro-pular-enviados").checked && lista.id !== "teste") {
      await atualizarJaReceberam();
      var antes = dest.length;
      dest = dest.filter(function (d) { return !jaReceberam[d.email]; });
      pulados = antes - dest.length;
    }
    return { dest: dest, pulados: pulados, calc: calc };
  }

  async function disparar() {
    if (enviando) return;
    var lista = listaAtual();
    var c = lerCampos();
    var erro = validar(c);
    if (erro) { U.toast(erro, true); return; }
    var prep = await prepararDestinatarios(lista, c);
    if (lista.id === "selecionadas" && prep.calc.marcasNaLista === 0) { renderizarLista(); return; }
    if (prep.dest.length === 0) { U.toast("Ninguém para enviar nesta lista (todos já receberam ou não têm e-mail).", true); return; }

    var avisos = [];
    if (modoEscrita === "html" && !/\bSAIR\b/i.test(c.html)) {
      avisos.push("O seu HTML não tem o rodapé do SAIR. Quem receber não vai saber como pedir para sair.");
    }
    if (!testeFeito) avisos.push("Você ainda não mandou o teste nesta sessão.");

    var n = prep.dest.length;
    var ok = await perguntar({
      titulo: "Confirmar disparo",
      texto: "Vai para " + n + " " + plural(n, "marca", "marcas") + ", da lista \"" + lista.rotulo + "\", e não dá pra desfazer.",
      aviso: avisos.map(esc).join("<br>"),
      sim: "Enviar para " + n, nao: "Cancelar"
    });
    if (!ok) return;
    await executarDisparo(prep.dest, c, lista, prep.pulados);
  }

  async function marcarComoEnviadas(emailsOk, dest) {
    var mapa = {};
    dest.forEach(function (d) { mapa[d.email] = d.ids; });
    var ids = [];
    emailsOk.forEach(function (e) { (mapa[e] || []).forEach(function (id) { ids.push(id); }); });
    if (ids.length === 0) return;
    var hoje = U.hojeISO();
    for (var i = 0; i < ids.length; i += 100) {
      var r = await U.consulta("marcas", window.bancoCliente.from("marcas").update({ prospeccao_enviada_em: hoje }).in("id", ids.slice(i, i + 100)));
      if (r.error) return;
    }
    marcas.forEach(function (m) { if (ids.indexOf(m.id) !== -1) m.prospeccao_enviada_em = hoje; });
  }

  async function executarDisparo(dest, c, lista, puladosIniciais) {
    enviando = true;
    renderizarLista();
    mostrarResumo("");
    var html = htmlAtual(c);
    var totais = { enviados: 0, falhas: 0, pulados: puladosIniciais, cota: false, dominio: false, faltaram: 0, erroGeral: "", erros: [] };
    var barra = $("pro-progresso");
    barra.classList.add("visivel");
    atualizarProgresso(0, dest.length);

    for (var i = 0; i < dest.length; i += TAMANHO_LOTE) {
      var loteCompleto = dest.slice(i, i + TAMANHO_LOTE);
      var corpo = { assunto: c.assunto, html: html, destinatarios: loteCompleto.map(function (d) { return { email: d.email, nome: d.nome, marca: d.marca }; }) };
      var r = await chamarFuncao(corpo);
      if (r.erroTexto) { totais.erroGeral = r.erroTexto; totais.faltaram = dest.length - i; break; }
      var d = r.dados || {};
      totais.enviados += d.enviados || 0;
      totais.falhas += d.falhas || 0;
      totais.pulados += d.pulados || 0;
      (d.erros || []).forEach(function (e) { if (totais.erros.length < 5) totais.erros.push(e); });
      var emailsOk = (d.resultados || []).filter(function (x) { return x.ok; }).map(function (x) { return x.email; });
      await marcarComoEnviadas(emailsOk, dest);
      atualizarProgresso(Math.min(i + TAMANHO_LOTE, dest.length), dest.length);
      if (d.cota_acabou) { totais.cota = true; totais.faltaram = (d.faltaram || 0) + (dest.length - i - loteCompleto.length); break; }
      if (d.dominio_nao_verificado) { totais.dominio = true; totais.faltaram = (d.faltaram || 0) + (dest.length - i - loteCompleto.length); break; }
    }

    enviando = false;
    mostrarResumo(montarResumoFinal(totais));
    await recarregar();

    if (lista.id === "selecionadas" && totais.enviados > 0) {
      var limpar = await perguntar({
        titulo: "Limpar a seleção?",
        texto: "O disparo terminou. Quer limpar a seleção de marcas agora? Se for mandar a mesma lista de novo, é melhor manter.",
        sim: "Limpar seleção", nao: "Manter a seleção"
      });
      if (limpar) {
        var r2 = await U.consulta("marcas", window.bancoCliente.from("marcas").update({ selecionada: false }).eq("selecionada", true));
        if (!r2.error) { marcas.forEach(function (m) { m.selecionada = false; }); renderizarLista(); U.toast("Seleção limpa."); }
      }
    }
  }

  function atualizarProgresso(feitos, total) {
    var pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
    $("pro-progresso-barra").style.width = pct + "%";
    $("pro-progresso-texto").textContent = feitos + " de " + total + " processados";
  }

  function montarResumoFinal(t) {
    var linhas = '<b>' + t.enviados + "</b> enviados · <b>" + t.falhas + "</b> falhas · <b>" + t.pulados + "</b> pulados";
    var html = '<div class="' + (t.falhas || t.cota || t.dominio || t.erroGeral ? "pro-aviso" : "pro-ok") + '" style="margin-top:12px;">' + linhas;
    if (t.cota) {
      html += "<br><br><b>A cota diária do Resend acabou.</b> Foram enviados " + t.enviados + " e faltaram " + t.faltaram + ". Volte amanhã, cole o mesmo assunto e o mesmo texto e deixe marcada a caixinha \"Pular quem já recebeu este mesmo assunto\". Assim ele manda só para quem faltou.";
    }
    if (t.dominio) {
      html += "<br><br><b>O Resend ainda só entrega e-mail para você mesma.</b> Isso acontece enquanto não houver um domínio seu verificado lá. Faltaram " + t.faltaram + ". Enquanto isso, use o Modo rascunho (Gmail).";
    }
    if (t.erroGeral) {
      html += "<br><br><b>O disparo parou:</b> " + esc(t.erroGeral) + " Faltaram " + t.faltaram + ". Para continuar, deixe marcada a caixinha de pular quem já recebeu e dispare de novo.";
    }
    if (t.erros.length) {
      html += "<br><br>Primeiros erros:<br>" + t.erros.map(esc).join("<br>");
    }
    return html + "</div>";
  }

  // ---- modo rascunho (Gmail) ------------------------------------------------------------
  async function montarFila() {
    var lista = listaAtual();
    var c = lerCampos();
    var erro = validar(c);
    if (erro) { U.toast(erro, true); return; }
    var prep = await prepararDestinatarios(lista, c);
    fila = prep.dest.slice();
    filaIndice = 0;
    renderizarFila(prep.pulados);
  }

  function renderizarFila(pulados) {
    var caixa = $("pro-fila");
    if (fila.length === 0) {
      caixa.innerHTML = '<div class="pro-ok">Fila vazia. Todo mundo desta lista já foi atendido' + (pulados ? " (" + pulados + " pulados por já terem recebido)" : "") + ".</div>";
      return;
    }
    if (filaIndice >= fila.length) {
      caixa.innerHTML = '<div class="pro-ok">Fila concluída. Todos os rascunhos foram tratados.</div>';
      renderizarTudo();
      return;
    }
    var c = lerCampos();
    var item = fila[filaIndice];
    var assunto = trocar(c.assunto, item.nome, item.marca, false);
    var texto = textoPlanoDe(item, c);
    caixa.innerHTML =
      '<div class="pro-fila-card">' +
      "<h4>Marca " + (filaIndice + 1) + " de " + fila.length + ": " + esc(item.marca) + "</h4>" +
      '<p class="pro-fila-linha"><b>Para:</b> ' + esc(item.email) + "</p>" +
      '<p class="pro-fila-linha"><b>Assunto:</b> ' + esc(assunto) + "</p>" +
      '<div class="pro-fila-texto" id="pro-fila-texto">' + esc(texto) + "</div>" +
      '<div class="pro-acoes">' +
      '<button class="btn btn-outline" id="pro-fila-copiar">Copiar o texto</button>' +
      '<button class="btn btn-primario" id="pro-fila-gmail">Abrir no Gmail</button>' +
      '<button class="btn btn-outline" id="pro-fila-marcar">Marquei como enviada</button>' +
      '<button class="btn btn-outline" id="pro-fila-pular">Pular</button>' +
      "</div></div>";

    $("pro-fila-copiar").addEventListener("click", function () { copiarTexto(texto); });
    $("pro-fila-gmail").addEventListener("click", function () {
      var url = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(item.email) +
        "&su=" + encodeURIComponent(assunto) + "&body=" + encodeURIComponent(texto);
      window.open(url, "_blank", "noopener");
    });
    $("pro-fila-marcar").addEventListener("click", function () { marcarRascunhoEnviado(item, assunto, c); });
    $("pro-fila-pular").addEventListener("click", function () { filaIndice++; renderizarFila(0); });
  }

  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      U.toast("Texto copiado.");
    } catch (e) {
      var area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); U.toast("Texto copiado."); } catch (e2) { U.toast("Não consegui copiar. Selecione o texto e copie com Ctrl+C.", true); }
      document.body.removeChild(area);
    }
  }

  async function marcarRascunhoEnviado(item, assunto, c) {
    var hoje = U.hojeISO();
    if (item.ids.length) {
      var r = await U.consulta("marcas", window.bancoCliente.from("marcas").update({ prospeccao_enviada_em: hoje }).in("id", item.ids));
      if (!r.error) marcas.forEach(function (m) { if (item.ids.indexOf(m.id) !== -1) m.prospeccao_enviada_em = hoje; });
    }
    var log = await U.consulta("email_envios", window.bancoCliente.from("email_envios").insert({
      email: item.email, assunto: assunto, assunto_modelo: c.assunto, status: "ok", resend_id: "rascunho"
    }));
    if (log.error) U.toast("Marquei a marca, mas não consegui gravar no histórico. Rode o disparo.sql.", true);
    filaIndice++;
    renderizarFila(0);
    renderizarCapaECartoes();
  }

  // ---- descadastro --------------------------------------------------------------------------
  function renderizarOptout() {
    var caixa = $("pro-optout-lista");
    caixa.innerHTML = "";
    if (tabelasFaltando.email_optout) {
      caixa.innerHTML = '<p class="aviso-vazio">A tabela de descadastro ainda não existe. Rode o arquivo disparo.sql no Supabase.</p>';
      return;
    }
    var emails = Object.keys(optouts);
    if (emails.length === 0) {
      caixa.innerHTML = '<p class="aviso-vazio">Ninguém pediu para sair até agora.</p>';
      return;
    }
    emails.forEach(function (e) {
      var linha = document.createElement("div");
      linha.className = "pro-optout-item";
      var span = document.createElement("span");
      span.textContent = e;
      var btn = document.createElement("button");
      btn.className = "btn btn-icone";
      btn.title = "Voltar a receber";
      btn.innerHTML = U.icone("apagar");
      btn.addEventListener("click", function () { removerOptout(e); });
      linha.appendChild(span);
      linha.appendChild(btn);
      caixa.appendChild(linha);
    });
  }

  async function adicionarOptout() {
    var e = emailNorm($("pro-optout-email").value);
    if (!emailValido(e)) { U.toast("Digite um e-mail válido.", true); return; }
    var r = await U.consulta("email_optout", window.bancoCliente.from("email_optout").insert({ email: e }));
    if (r.error) {
      if (r.error.code === "23505") U.toast("Esse e-mail já estava no descadastro.");
      return;
    }
    $("pro-optout-email").value = "";
    U.toast("Adicionado ao descadastro. Esse e-mail não recebe mais nada.");
    await recarregar();
  }

  async function removerOptout(email) {
    var ok = await perguntar({
      titulo: "Voltar a receber?",
      texto: email + " voltará a poder receber os seus e-mails. Só faça isso se a pessoa pediu.",
      sim: "Remover do descadastro", nao: "Manter"
    });
    if (!ok) return;
    var r = await U.consulta("email_optout", window.bancoCliente.from("email_optout").delete().eq("email", email));
    if (!r.error) { U.toast("Removido do descadastro."); await recarregar(); }
  }

  // ---- histórico ------------------------------------------------------------------------------
  function renderizarHistorico() {
    var corpo = $("pro-corpo-historico");
    var vazio = $("pro-historico-vazio");
    corpo.innerHTML = "";
    if (tabelasFaltando.email_envios) {
      vazio.style.display = "block";
      vazio.textContent = "A tabela de registro ainda não existe. Rode o arquivo disparo.sql no Supabase.";
      return;
    }
    var termo = $("pro-busca-historico").value.trim().toLowerCase();
    var lista = envios.filter(function (x) { return !termo || String(x.email || "").toLowerCase().indexOf(termo) !== -1; });
    if (lista.length === 0) {
      vazio.style.display = "block";
      vazio.textContent = envios.length === 0 ? "Nenhum e-mail enviado ainda. O que você enviar aparece aqui." : "Nenhum envio encontrado para essa busca.";
      return;
    }
    vazio.style.display = "none";
    lista.forEach(function (x) {
      var tr = document.createElement("tr");
      var quando = x.criado_em ? new Date(x.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
      var resultado = x.status === "ok"
        ? '<span class="pilula pilula-cliente">enviado' + (x.resend_id === "rascunho" ? " (Gmail)" : "") + "</span>"
        : '<span class="pilula pilula-atraso">erro</span> <span style="font-size:.74rem;color:var(--texto-suave);">' + esc(x.erro || "") + "</span>";
      tr.innerHTML = "<td>" + esc(x.email) + "</td><td>" + esc(x.assunto || "") + "</td><td style=\"white-space:nowrap;\">" + esc(quando) + "</td><td>" + resultado + "</td>";
      corpo.appendChild(tr);
    });
  }
})();
