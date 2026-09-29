// ============================================================================
// ABA: CALENDÁRIO — mês inteiro, segunda a domingo
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;
  var eventosAtuais = [];
  var campanhasPrazos = [];
  var mesReferencia = new Date();
  mesReferencia.setDate(1);
  var filtroTipo = "";

  var NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var ROTULO_TIPO = { gravar: "Gravar", editar: "Editar", postar: "Postar" };

  window.AdminCalendario = { iniciar: iniciar };

  async function iniciar() {
    document.getElementById("btn-novo-evento").addEventListener("click", function () { abrirFormEvento(null, null); });
    document.getElementById("form-evento").addEventListener("submit", salvarEvento);
    document.getElementById("btn-apagar-evento").addEventListener("click", apagarEventoAtual);
    document.getElementById("btn-mes-anterior").addEventListener("click", function () { mudarMes(-1); });
    document.getElementById("btn-mes-seguinte").addEventListener("click", function () { mudarMes(1); });
    document.getElementById("btn-mes-hoje").addEventListener("click", function () {
      mesReferencia = new Date(); mesReferencia.setDate(1); render();
    });
    document.querySelectorAll("[data-tipo-cal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-tipo-cal]").forEach(function (b) { b.classList.remove("ativo"); });
        btn.classList.add("ativo");
        filtroTipo = btn.getAttribute("data-tipo-cal");
        render();
      });
    });

    await carregarTudo();
  }

  async function carregarTudo() {
    var resEventos = await U.consulta("calendario", window.bancoCliente.from("calendario").select("*"));
    eventosAtuais = resEventos.data || [];

    var resCamp = await U.consulta("campanhas", window.bancoCliente.from("campanhas").select("id, campanha, cliente, prazo, status").not("prazo", "is", null));
    campanhasPrazos = (resCamp.data || []).filter(function (c) { return c.status !== "Entregue"; });

    render();
  }

  function mudarMes(delta) {
    mesReferencia.setMonth(mesReferencia.getMonth() + delta);
    render();
  }

  function paraISO(data) {
    return data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0") + "-" + String(data.getDate()).padStart(2, "0");
  }

  function itensDoDia(iso) {
    var itens = [];
    eventosAtuais.forEach(function (ev) {
      if (ev.data !== iso) return;
      if (filtroTipo && ev.tipo !== filtroTipo) return;
      itens.push({ tipo: "evento", dado: ev });
    });
    campanhasPrazos.forEach(function (c) {
      if (String(c.prazo).slice(0, 10) !== iso) return;
      if (filtroTipo) return; // prazos de campanha só aparecem sem filtro de tipo
      itens.push({ tipo: "prazo", dado: c });
    });
    return itens;
  }

  function render() {
    document.getElementById("calendario-mes-nome").textContent =
      NOMES_MES[mesReferencia.getMonth()].charAt(0).toUpperCase() + NOMES_MES[mesReferencia.getMonth()].slice(1) + " de " + mesReferencia.getFullYear();

    var grade = document.getElementById("grade-calendario");
    grade.innerHTML = "";
    ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].forEach(function (d) {
      grade.appendChild(U.criarEl("div", "cal-cabecalho", d));
    });

    var primeiroDiaMes = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1);
    var diaSemanaISO = (primeiroDiaMes.getDay() + 6) % 7; // 0 = segunda
    var inicioGrade = new Date(primeiroDiaMes);
    inicioGrade.setDate(inicioGrade.getDate() - diaSemanaISO);

    var hojeISO = U.hojeISO();

    for (var i = 0; i < 42; i++) {
      var diaAtual = new Date(inicioGrade);
      diaAtual.setDate(diaAtual.getDate() + i);
      var iso = paraISO(diaAtual);
      var foraDoMes = diaAtual.getMonth() !== mesReferencia.getMonth();

      var celula = U.criarEl("div", "cal-dia" + (foraDoMes ? " fora-do-mes" : "") + (iso === hojeISO ? " hoje" : ""));
      celula.appendChild(U.criarEl("span", "cal-numero", String(diaAtual.getDate())));

      var btnAdd = U.criarEl("button", "cal-add", "+");
      btnAdd.type = "button";
      btnAdd.title = "Adicionar nesse dia";
      btnAdd.addEventListener("click", function (isoFixo) {
        return function (e) { e.stopPropagation(); abrirFormEvento(null, isoFixo); };
      }(iso));
      celula.appendChild(btnAdd);
      celula.addEventListener("click", function (isoFixo) { return function () { abrirFormEvento(null, isoFixo); }; }(iso));

      var itens = itensDoDia(iso);
      var visiveis = itens.slice(0, 3);
      visiveis.forEach(function (item) {
        var el;
        if (item.tipo === "prazo") {
          el = U.criarEl("span", "cal-item cal-item-prazo", "Prazo: " + U.escapar(item.dado.campanha));
          el.title = "Prazo da campanha " + item.dado.campanha + (item.dado.cliente ? " (" + item.dado.cliente + ")" : "");
        } else {
          var ev = item.dado;
          el = U.criarEl("span", "cal-item cal-item-" + ev.tipo + (ev.status === "feito" ? " feito" : ""), U.escapar(ev.titulo));
          el.title = (ROTULO_TIPO[ev.tipo] || ev.tipo) + (ev.marca ? " · " + ev.marca : "");
          el.addEventListener("click", function (evFixo) { return function (e) { e.stopPropagation(); abrirFormEvento(evFixo, null); }; }(ev));
        }
        celula.appendChild(el);
      });
      if (itens.length > 3) {
        var maisBtn = U.criarEl("span", "cal-mais", "+" + (itens.length - 3) + " mais");
        maisBtn.addEventListener("click", function (isoFixo, itensFixo) {
          return function (e) { e.stopPropagation(); abrirDiaCompleto(isoFixo, itensFixo); };
        }(iso, itens));
        celula.appendChild(maisBtn);
      }

      grade.appendChild(celula);
    }

    renderizarAtrasados();
  }

  function abrirDiaCompleto(iso, itens) {
    document.getElementById("titulo-modal-dia-cal").textContent = U.formatarDataBr(iso);
    var corpo = document.getElementById("corpo-modal-dia-cal");
    corpo.innerHTML = "";
    itens.forEach(function (item) {
      var linha = U.criarEl("div");
      linha.style.cssText = "padding:8px 0; border-bottom:1px solid var(--borda);";
      if (item.tipo === "prazo") {
        linha.innerHTML = '<span class="pilula pilula-atraso">Prazo</span> ' + U.escapar(item.dado.campanha);
      } else {
        var ev = item.dado;
        linha.innerHTML = '<span class="cal-item cal-item-' + ev.tipo + '">' + (ROTULO_TIPO[ev.tipo] || ev.tipo) + "</span> " + U.escapar(ev.titulo);
        linha.style.cursor = "pointer";
        linha.addEventListener("click", function () { U.fecharModal("modal-dia-cal"); abrirFormEvento(ev, null); });
      }
      corpo.appendChild(linha);
    });
    U.abrirModal("modal-dia-cal");
  }

  function renderizarAtrasados() {
    var container = document.getElementById("lista-atrasados-cal");
    container.innerHTML = "";
    var hojeISO = U.hojeISO();
    var atrasados = eventosAtuais.filter(function (ev) { return ev.status !== "feito" && ev.data < hojeISO; });
    atrasados.sort(function (a, b) { return a.data < b.data ? -1 : 1; });

    if (atrasados.length === 0) {
      container.appendChild(U.criarEl("p", "aviso-vazio", "Nada atrasado. Tudo em dia por aqui."));
      return;
    }
    var lista = U.criarEl("div", "lista-atrasados");
    atrasados.forEach(function (ev) {
      var dias = U.diasEntre(ev.data, hojeISO);
      var linha = U.criarEl("div", "item-atrasado");
      linha.innerHTML = "<span>" + U.escapar(ev.titulo) + (ev.marca ? " · " + U.escapar(ev.marca) : "") + "</span><b>há " + dias + (dias === 1 ? " dia" : " dias") + "</b>";
      linha.style.cursor = "pointer";
      linha.addEventListener("click", function () { abrirFormEvento(ev, null); });
      lista.appendChild(linha);
    });
    container.appendChild(lista);
  }

  function abrirFormEvento(evento, dataFixa) {
    var form = document.getElementById("form-evento");
    form.reset();
    document.getElementById("evento-id").value = evento ? evento.id : "";
    document.getElementById("evento-titulo").value = evento ? (evento.titulo || "") : "";
    document.getElementById("evento-marca").value = evento ? (evento.marca || "") : "";
    document.getElementById("evento-tipo").value = evento ? evento.tipo : "gravar";
    document.getElementById("evento-data").value = evento ? evento.data : (dataFixa || U.hojeISO());
    document.getElementById("evento-status").value = evento ? evento.status : "a_fazer";
    document.getElementById("titulo-modal-evento").textContent = evento ? "Editar item" : "Novo item";
    document.getElementById("btn-apagar-evento").style.display = evento ? "inline-flex" : "none";
    U.abrirModal("modal-evento");
  }

  async function salvarEvento(e) {
    e.preventDefault();
    var id = document.getElementById("evento-id").value;
    var dados = {
      titulo: document.getElementById("evento-titulo").value.trim(),
      marca: document.getElementById("evento-marca").value.trim() || null,
      tipo: document.getElementById("evento-tipo").value,
      data: document.getElementById("evento-data").value,
      status: document.getElementById("evento-status").value
    };
    var resultado;
    if (id) {
      resultado = await U.consulta("calendario", window.bancoCliente.from("calendario").update(dados).eq("id", id));
    } else {
      resultado = await U.consulta("calendario", window.bancoCliente.from("calendario").insert(dados));
    }
    if (resultado.error) return;
    U.fecharModal("modal-evento");
    U.toast("Item salvo.");
    await carregarTudo();
  }

  async function apagarEventoAtual() {
    var id = document.getElementById("evento-id").value;
    if (!id) return;
    if (!confirm("Apagar este item da agenda?")) return;
    var resultado = await U.consulta("calendario", window.bancoCliente.from("calendario").delete().eq("id", id));
    if (resultado.error) return;
    U.fecharModal("modal-evento");
    U.toast("Item apagado.");
    await carregarTudo();
  }
})();
