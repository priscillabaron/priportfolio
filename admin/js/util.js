// ============================================================================
// Funções auxiliares usadas por todas as abas do painel.
// ============================================================================
(function () {
  "use strict";

  window.AdminUtil = {};

  // ---- criar elementos DOM rapidamente ------------------------------------
  window.AdminUtil.criarEl = function (tag, className, html) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (html !== undefined) el.innerHTML = html;
    return el;
  };

  // ---- ícones (traço, sem emoji) ------------------------------------------
  window.AdminUtil.icone = function (nome) {
    var mapa = {
      editar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      apagar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
      olhoAberto: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
      olhoFechado: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.8 19.8 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a19.9 19.9 0 0 1-2.35 3.4"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
      arrastar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.36 7.58L3 20l1.08-5.44A8.5 8.5 0 1 1 21 11.5z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>',
      estrelaCheia: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.1 8.6 22 9.6 17 14.6 18.2 21.5 12 18.2 5.8 21.5 7 14.6 2 9.6 8.9 8.6"/></svg>',
      estrelaVazia: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linejoin="round"><polygon points="12 2 15.1 8.6 22 9.6 17 14.6 18.2 21.5 12 18.2 5.8 21.5 7 14.6 2 9.6 8.9 8.6"/></svg>',
      externo: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
      chevron: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
    };
    return mapa[nome] || "";
  };

  // ---- toast (avisinho no canto) -------------------------------------------
  var toastEl = null;
  var toastTimer = null;
  window.AdminUtil.toast = function (texto, ehErro) {
    if (!toastEl) toastEl = document.getElementById("toast");
    if (!toastEl) return;
    toastEl.textContent = texto;
    toastEl.className = "toast visivel" + (ehErro ? " erro" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("visivel"); }, 3200);
  };

  // ---- modais ---------------------------------------------------------------
  window.AdminUtil.abrirModal = function (id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.add("visivel");
  };
  window.AdminUtil.fecharModal = function (id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.remove("visivel");
  };
  document.addEventListener("click", function (e) {
    var alvo = e.target.closest("[data-fechar-modal]");
    if (alvo) window.AdminUtil.fecharModal(alvo.getAttribute("data-fechar-modal"));
    if (e.target.classList.contains("modal-fundo")) e.target.classList.remove("visivel");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-fundo.visivel").forEach(function (m) { m.classList.remove("visivel"); });
    }
  });

  // ---- formatação -------------------------------------------------------
  window.AdminUtil.formatarMoeda = function (valor) {
    var n = Number(valor) || 0;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  window.AdminUtil.formatarDataBr = function (isoDate) {
    if (!isoDate) return "—";
    var partes = String(isoDate).slice(0, 10).split("-");
    if (partes.length !== 3) return isoDate;
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  };
  window.AdminUtil.hojeISO = function () {
    var d = new Date();
    var mes = String(d.getMonth() + 1).padStart(2, "0");
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
  };
  window.AdminUtil.diasEntre = function (dataISO, referenciaISO) {
    var a = new Date(dataISO + "T00:00:00");
    var b = new Date((referenciaISO || window.AdminUtil.hojeISO()) + "T00:00:00");
    return Math.round((b - a) / 86400000);
  };
  window.AdminUtil.escapar = function (texto) {
    var div = document.createElement("div");
    div.textContent = texto === null || texto === undefined ? "" : String(texto);
    return div.innerHTML;
  };
  window.AdminUtil.debounce = function (fn, espera) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, espera || 250);
    };
  };

  // ---- baixar CSV (com BOM, abre certo no Excel) ---------------------------
  window.AdminUtil.baixarCSV = function (nomeArquivo, colunas, linhas) {
    var separador = ";";
    function limpar(v) {
      var texto = v === null || v === undefined ? "" : String(v);
      texto = texto.replace(/"/g, '""');
      if (texto.indexOf(separador) !== -1 || texto.indexOf("\n") !== -1 || texto.indexOf('"') !== -1) {
        texto = '"' + texto + '"';
      }
      return texto;
    }
    var cabecalho = colunas.map(function (c) { return limpar(c.rotulo); }).join(separador);
    var corpo = linhas.map(function (linha) {
      return colunas.map(function (c) { return limpar(c.valor(linha)); }).join(separador);
    }).join("\r\n");
    var conteudo = "﻿" + cabecalho + "\r\n" + corpo;
    var blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---- consulta segura ao banco --------------------------------------------
  // Roda uma consulta do Supabase; se a tabela ou coluna esperada não existir
  // (banco.sql não foi rodado, ou foi alterado), avisa no topo do painel em
  // vez de travar a página inteira.
  var tabelasComProblema = {};
  window.AdminUtil.avisarTabelaAusente = function (nomeTabela) {
    if (tabelasComProblema[nomeTabela]) return;
    tabelasComProblema[nomeTabela] = true;
    var aviso = document.getElementById("aviso-tabelas");
    if (!aviso) return;
    aviso.style.display = "block";
    var nomes = Object.keys(tabelasComProblema);
    var soConteudos = nomes.every(function (n) { return n.indexOf("conteudos_") === 0; });
    var algumConteudos = nomes.some(function (n) { return n.indexOf("conteudos_") === 0; });
    var arquivo = soConteudos ? "conteudos.sql" : (algumConteudos ? "banco.sql e o conteudos.sql" : "banco.sql");
    aviso.textContent = "Não encontrei a tabela ou uma coluna esperada em: " + nomes.join(", ") + ". Rode o arquivo " + arquivo + " no Supabase. O resto do painel continua funcionando normalmente.";
  };
  window.AdminUtil.consulta = async function (nomeTabela, promessa) {
    try {
      var resultado = await promessa;
      if (resultado.error) {
        var codigo = resultado.error.code;
        if (codigo === "42P01" || codigo === "42703" || codigo === "PGRST205" || codigo === "PGRST204") {
          window.AdminUtil.avisarTabelaAusente(nomeTabela);
        } else {
          console.error("Erro em " + nomeTabela + ":", resultado.error);
          window.AdminUtil.toast("Deu erro ao falar com " + nomeTabela + ".", true);
        }
        return { data: [], error: resultado.error };
      }
      return resultado;
    } catch (erro) {
      console.error("Erro em " + nomeTabela + ":", erro);
      window.AdminUtil.avisarTabelaAusente(nomeTabela);
      return { data: [], error: erro };
    }
  };
})();
