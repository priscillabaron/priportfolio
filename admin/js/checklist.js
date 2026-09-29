// ============================================================================
// ABA: CHECKLIST — conteúdo vem de window.Biblioteca (js/biblioteca.js)
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;
  var chavesMarcadas = {};

  window.AdminChecklist = { iniciar: iniciar };

  async function iniciar() {
    document.querySelectorAll(".sub-aba-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".sub-aba-btn").forEach(function (b) { b.classList.remove("ativa"); });
        document.querySelectorAll(".sub-conteudo").forEach(function (c) { c.classList.remove("ativa"); });
        btn.classList.add("ativa");
        document.getElementById("sub-" + btn.getAttribute("data-sub")).classList.add("ativa");
      });
    });

    if (!window.Biblioteca) {
      var aba = document.getElementById("aba-checklist");
      aba.innerHTML = '<div class="aviso-erro">Não encontrei o arquivo js/biblioteca.js. Confira se ele existe nessa pasta.</div>';
      return;
    }

    await carregarMarcados();
    renderizarChecklist();
    renderizarReferencias();
    renderizarTipos();
    renderizarNichos();
    renderizarRevisao();
  }

  async function carregarMarcados() {
    var resultado = await U.consulta("marcados", window.bancoCliente.from("marcados").select("chave"));
    chavesMarcadas = {};
    (resultado.data || []).forEach(function (linha) { chavesMarcadas[linha.chave] = true; });
  }

  // ---- SUB-ABA: CHECKLIST DO PORTFÓLIO ---------------------------------------
  function renderizarChecklist() {
    var B = window.Biblioteca;
    var container = document.getElementById("lista-secoes-checklist");
    container.innerHTML = "";

    var totalItens = 0, totalMarcados = 0;

    B.CHECKLIST.forEach(function (secao) {
      totalItens += secao.itens.length;
      var marcadosNaSecao = secao.itens.filter(function (item, i) { return chavesMarcadas[secao.id + "-" + i]; }).length;
      totalMarcados += marcadosNaSecao;

      var caixa = U.criarEl("div", "check-secao");
      var cabecalho = U.criarEl("div", "check-secao-cabecalho");
      cabecalho.appendChild(U.criarEl("span", "check-secao-emoji", secao.emoji));
      var info = U.criarEl("div", "check-secao-info");
      info.appendChild(U.criarEl("p", "check-secao-nome", U.escapar(secao.nome)));
      info.appendChild(U.criarEl("p", "check-secao-resumo", U.escapar(secao.resumo)));
      cabecalho.appendChild(info);

      var barraWrap = U.criarEl("div", "check-secao-barra");
      var barra = U.criarEl("div", "barra-progresso");
      var barraPreench = U.criarEl("div", "barra-progresso-preenchida");
      var pct = secao.itens.length ? Math.round((marcadosNaSecao / secao.itens.length) * 100) : 0;
      barraPreench.style.width = pct + "%";
      barra.appendChild(barraPreench);
      barraWrap.appendChild(barra);
      var textoBarra = U.criarEl("p", null, marcadosNaSecao + "/" + secao.itens.length);
      textoBarra.style.cssText = "font-size:.68rem; color:var(--texto-suave); text-align:right; margin-top:4px;";
      barraWrap.appendChild(textoBarra);
      cabecalho.appendChild(barraWrap);

      cabecalho.addEventListener("click", function () { caixa.classList.toggle("aberta"); });
      caixa.appendChild(cabecalho);

      var corpo = U.criarEl("div", "check-secao-corpo");
      corpo.appendChild(U.criarEl("p", "check-secao-porque", "<b>Por quê:</b> " + U.escapar(secao.porque)));

      secao.itens.forEach(function (item, i) {
        var chave = secao.id + "-" + i;
        var linhaItem = U.criarEl("div", "check-item" + (chavesMarcadas[chave] ? " marcado" : ""));
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!chavesMarcadas[chave];
        checkbox.id = "chk-" + chave;
        checkbox.addEventListener("change", function () { alternarItem(chave, checkbox.checked, linhaItem, caixa, secao); });
        linhaItem.appendChild(checkbox);
        var textoWrap = document.createElement("div");
        var label = document.createElement("label");
        label.setAttribute("for", "chk-" + chave);
        label.className = "check-item-t";
        label.textContent = item.t;
        textoWrap.appendChild(label);
        textoWrap.appendChild(U.criarEl("p", "check-item-d", U.escapar(item.d)));
        linhaItem.appendChild(textoWrap);
        corpo.appendChild(linhaItem);
      });

      caixa.appendChild(corpo);
      container.appendChild(caixa);
    });

    atualizarProgressoGeral(totalMarcados, totalItens);
  }

  async function alternarItem(chave, marcado, linhaEl, secaoEl, secao) {
    linhaEl.classList.toggle("marcado", marcado);
    if (marcado) {
      chavesMarcadas[chave] = true;
      await U.consulta("marcados", window.bancoCliente.from("marcados").insert({ chave: chave }));
    } else {
      delete chavesMarcadas[chave];
      await U.consulta("marcados", window.bancoCliente.from("marcados").delete().eq("chave", chave));
    }
    // recalcula as barrinhas sem fechar a seção
    var totalItens = 0, totalMarcados = 0;
    window.Biblioteca.CHECKLIST.forEach(function (s) {
      totalItens += s.itens.length;
      totalMarcados += s.itens.filter(function (item, i) { return chavesMarcadas[s.id + "-" + i]; }).length;
    });
    atualizarProgressoGeral(totalMarcados, totalItens);
    var marcadosNaSecao = secao.itens.filter(function (item, i) { return chavesMarcadas[secao.id + "-" + i]; }).length;
    var pct = secao.itens.length ? Math.round((marcadosNaSecao / secao.itens.length) * 100) : 0;
    var preench = secaoEl.querySelector(".check-secao-barra .barra-progresso-preenchida");
    var textoBarra = secaoEl.querySelector(".check-secao-barra p");
    if (preench) preench.style.width = pct + "%";
    if (textoBarra) textoBarra.textContent = marcadosNaSecao + "/" + secao.itens.length;
  }

  function atualizarProgressoGeral(marcados, total) {
    var pct = total > 0 ? Math.round((marcados / total) * 100) : 0;
    document.getElementById("barra-progresso-geral").style.width = pct + "%";
    document.getElementById("progresso-geral-texto").textContent = marcados + " de " + total + " (" + pct + "%)";
  }

  // ---- SUB-ABA: REFERÊNCIAS DE VÍDEO -----------------------------------------
  function renderizarReferencias() {
    var B = window.Biblioteca;
    var container = document.getElementById("grade-referencias");
    container.innerHTML = "";
    B.REFERENCIAS.forEach(function (ref) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "ref-card";
      var capa = U.criarEl("div", "ref-capa", ref.emoji);
      var corpo = U.criarEl("div", "ref-corpo");
      corpo.appendChild(U.criarEl("p", "ref-titulo", U.escapar(ref.titulo)));
      var meta = U.criarEl("div", "ref-meta");
      [ref.estilo, ref.duracao, ref.marca].forEach(function (m) {
        if (m) meta.appendChild(U.criarEl("span", null, U.escapar(m)));
      });
      corpo.appendChild(meta);
      card.appendChild(capa);
      card.appendChild(corpo);
      card.addEventListener("click", function () { abrirReferencia(ref); });
      container.appendChild(card);
    });
  }

  function abrirReferencia(ref) {
    document.getElementById("titulo-modal-referencia").textContent = ref.emoji + " " + ref.titulo;
    var corpo = document.getElementById("corpo-modal-referencia");
    corpo.innerHTML = "";

    var meta = U.criarEl("div", "ref-meta");
    [ref.estilo, ref.audiencia, ref.duracao, ref.marca].forEach(function (m) {
      if (m) meta.appendChild(U.criarEl("span", null, U.escapar(m)));
    });
    corpo.appendChild(meta);

    corpo.appendChild(U.criarEl("p", "check-secao-porque", '<b>Gancho:</b> "' + U.escapar(ref.gancho) + '"'));
    corpo.appendChild(criarBlocoTexto("Por que funciona", ref.porque));
    corpo.appendChild(criarBlocoTexto("Diferencial", ref.diferencial));
    corpo.appendChild(criarBlocoTexto("Erro comum", ref.erro));

    var tituloRoteiro = U.criarEl("p", "painel-titulo", "Roteiro em blocos");
    tituloRoteiro.style.marginTop = "18px";
    corpo.appendChild(tituloRoteiro);
    ref.roteiro.forEach(function (bloco) {
      var linha = U.criarEl("div", "roteiro-bloco");
      linha.appendChild(U.criarEl("span", "roteiro-tempo", U.escapar(bloco.t)));
      linha.appendChild(U.criarEl("div", "roteiro-obs", bloco.o));
      corpo.appendChild(linha);
    });

    if (ref.youtube) {
      var btnAssistir = document.createElement("a");
      btnAssistir.href = ref.youtube;
      btnAssistir.target = "_blank";
      btnAssistir.rel = "noopener";
      btnAssistir.className = "btn btn-primario";
      btnAssistir.style.marginTop = "16px";
      btnAssistir.innerHTML = U.icone("externo") + " Assistir";
      corpo.appendChild(btnAssistir);
    }

    U.abrirModal("modal-referencia");
  }

  function criarBlocoTexto(titulo, texto) {
    var bloco = U.criarEl("div");
    bloco.style.marginTop = "14px";
    bloco.innerHTML = "<p style='font-weight:800; font-size:.82rem; margin-bottom:4px;'>" + titulo + "</p><p style='font-size:.84rem; color:var(--texto-suave);'>" + U.escapar(texto) + "</p>";
    return bloco;
  }

  // ---- SUB-ABA: ROTEIROS (TIPOS) ----------------------------------------------
  function renderizarTipos() {
    var B = window.Biblioteca;
    var container = document.getElementById("lista-tipos");
    container.innerHTML = "";
    B.TIPOS.forEach(function (tipo) {
      var card = U.criarEl("div", "tipo-card");
      var cabecalho = U.criarEl("div", "tipo-cabecalho");
      cabecalho.appendChild(U.criarEl("span", "tipo-emoji", tipo.emoji));
      cabecalho.appendChild(U.criarEl("span", "tipo-nome", U.escapar(tipo.nome)));
      cabecalho.appendChild(U.criarEl("span", "tipo-duracao", U.escapar(tipo.duracao)));
      cabecalho.addEventListener("click", function () { card.classList.toggle("aberta"); });
      card.appendChild(cabecalho);

      var corpo = U.criarEl("div", "tipo-corpo");
      corpo.appendChild(U.criarEl("p", "tipo-porque", "<b>Quando usar:</b> " + U.escapar(tipo.porque)));
      tipo.beats.forEach(function (bloco) {
        var linha = U.criarEl("div", "roteiro-bloco");
        linha.appendChild(U.criarEl("span", "roteiro-tempo", U.escapar(bloco.t)));
        linha.appendChild(U.criarEl("div", "roteiro-obs", bloco.o));
        corpo.appendChild(linha);
      });
      if (tipo.erros && tipo.erros.length) {
        var erros = U.criarEl("ul", "tipo-erros", "<b>Erros comuns:</b>");
        tipo.erros.forEach(function (erro) { erros.appendChild(U.criarEl("li", null, U.escapar(erro))); });
        corpo.appendChild(erros);
      }
      card.appendChild(corpo);
      container.appendChild(card);
    });
  }

  // ---- SUB-ABA: IDEIAS POR NICHO ----------------------------------------------
  function renderizarNichos() {
    var B = window.Biblioteca;
    var container = document.getElementById("lista-nichos");
    container.innerHTML = "";
    B.NICHOS.forEach(function (nicho) {
      var card = U.criarEl("div", "nicho-card");
      var cabecalho = U.criarEl("div", "nicho-cabecalho");
      cabecalho.appendChild(U.criarEl("span", "nicho-emoji", nicho.emoji));
      cabecalho.appendChild(U.criarEl("span", "nicho-nome", U.escapar(nicho.nome)));
      cabecalho.addEventListener("click", function () { card.classList.toggle("aberta"); });
      card.appendChild(cabecalho);

      var corpo = U.criarEl("div", "nicho-corpo");
      nicho.ideias.forEach(function (ideia) {
        var caixa = U.criarEl("div", "ideia-card");
        caixa.appendChild(U.criarEl("p", "ideia-t", U.escapar(ideia.t)));
        caixa.appendChild(U.criarEl("p", "ideia-gancho", '"' + U.escapar(ideia.gancho) + '"'));
        corpo.appendChild(caixa);
      });
      card.appendChild(corpo);
      container.appendChild(card);
    });
  }

  // ---- SUB-ABA: REVISAR MEU ROTEIRO -------------------------------------------
  function renderizarRevisao() {
    var B = window.Biblioteca;
    var container = document.getElementById("lista-revisao");
    container.innerHTML = "";
    B.REVISAO.forEach(function (bloco, indiceBloco) {
      var caixa = U.criarEl("div", "revisao-bloco");
      caixa.appendChild(U.criarEl("p", "revisao-bloco-titulo", bloco.emoji + " " + U.escapar(bloco.bloco)));
      bloco.itens.forEach(function (item, indiceItem) {
        var linha = U.criarEl("div", "check-item");
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        var id = "rev-" + indiceBloco + "-" + indiceItem;
        checkbox.id = id;
        checkbox.addEventListener("change", function () { linha.classList.toggle("marcado", checkbox.checked); });
        linha.appendChild(checkbox);
        var textoWrap = document.createElement("div");
        var label = document.createElement("label");
        label.setAttribute("for", id);
        label.className = "check-item-t";
        label.textContent = item.t;
        textoWrap.appendChild(label);
        textoWrap.appendChild(U.criarEl("p", "check-item-d", U.escapar(item.d)));
        linha.appendChild(textoWrap);
        caixa.appendChild(linha);
      });
      container.appendChild(caixa);
    });

    if (B.COMO_USAR && B.COMO_USAR.length) {
      var dicas = U.criarEl("div", "revisao-bloco");
      dicas.appendChild(U.criarEl("p", "revisao-bloco-titulo", "💡 Como usar as frases de gancho"));
      var lista = document.createElement("ul");
      lista.style.cssText = "margin:0; padding-left:18px; display:grid; gap:8px;";
      B.COMO_USAR.forEach(function (dica) {
        var li = document.createElement("li");
        li.style.fontSize = ".84rem";
        li.style.color = "var(--texto-suave)";
        li.textContent = dica;
        lista.appendChild(li);
      });
      dicas.appendChild(lista);
      container.appendChild(dicas);
    }
  }
})();
