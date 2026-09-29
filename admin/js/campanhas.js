// ============================================================================
// ABA: CAMPANHAS — funil comercial, do briefing ao pagamento
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;
  var campanhasAtuais = [];
  var filtroAtual = "todas";
  var termoBusca = "";
  var ordemColuna = "criado_em";
  var ordemAsc = false;

  var FUNIL = ["Briefing", "Roteiro", "Aprovação Roteiro", "Gravação", "Edição", "Aprovado", "Entregue"];

  window.AdminCampanhas = { iniciar: iniciar };

  async function iniciar() {
    document.getElementById("btn-nova-campanha").addEventListener("click", function () { abrirFormCampanha(null); });
    document.getElementById("form-campanha").addEventListener("submit", salvarCampanha);
    document.getElementById("btn-apagar-campanha").addEventListener("click", apagarCampanhaAtual);
    document.getElementById("btn-baixar-campanhas").addEventListener("click", baixarCSV);

    document.querySelectorAll("[data-filtro-camp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-filtro-camp]").forEach(function (b) { b.classList.remove("ativo"); });
        btn.classList.add("ativo");
        filtroAtual = btn.getAttribute("data-filtro-camp");
        render();
      });
    });
    document.getElementById("busca-campanhas").addEventListener("input", U.debounce(function (e) {
      termoBusca = e.target.value.trim().toLowerCase();
      render();
    }, 200));
    document.querySelectorAll("#cabecalho-campanhas th.ordenavel").forEach(function (th) {
      th.addEventListener("click", function () {
        var coluna = th.getAttribute("data-col");
        if (ordemColuna === coluna) { ordemAsc = !ordemAsc; } else { ordemColuna = coluna; ordemAsc = true; }
        render();
      });
    });

    await carregarCampanhas();
  }

  async function carregarCampanhas() {
    var resultado = await U.consulta("campanhas",
      window.bancoCliente.from("campanhas").select("*").order("criado_em", { ascending: false })
    );
    campanhasAtuais = resultado.data || [];
    render();
  }

  function listaFiltrada() {
    return campanhasAtuais.filter(function (c) {
      if (filtroAtual === "ativas" && !c.ativa) return false;
      if (filtroAtual === "finalizadas" && c.ativa) return false;
      if (termoBusca) {
        var alvo = ((c.campanha || "") + " " + (c.cliente || "")).toLowerCase();
        if (alvo.indexOf(termoBusca) === -1) return false;
      }
      return true;
    });
  }

  function ordenar(lista) {
    var copia = lista.slice();
    copia.sort(function (a, b) {
      var va, vb;
      if (ordemColuna === "status") {
        va = FUNIL.indexOf(a.status); vb = FUNIL.indexOf(b.status);
      } else if (ordemColuna === "valor" || ordemColuna === "qtd") {
        va = Number(a[ordemColuna]) || 0; vb = Number(b[ordemColuna]) || 0;
      } else if (ordemColuna === "prazo") {
        va = a.prazo || "9999"; vb = b.prazo || "9999";
      } else {
        va = (a[ordemColuna] || "").toString().toLowerCase();
        vb = (b[ordemColuna] || "").toString().toLowerCase();
      }
      if (va < vb) return ordemAsc ? -1 : 1;
      if (va > vb) return ordemAsc ? 1 : -1;
      return 0;
    });
    return copia;
  }

  function render() {
    renderizarStats();
    renderizarCabecalhoOrdem();

    var corpo = document.getElementById("corpo-tabela-campanhas");
    var aviso = document.getElementById("aviso-campanhas-vazio");
    corpo.innerHTML = "";
    var lista = ordenar(listaFiltrada());

    if (campanhasAtuais.length === 0) {
      aviso.style.display = "block";
      aviso.textContent = "Nenhuma campanha cadastrada ainda. Clique em \"Nova campanha\" pra começar.";
      return;
    }
    if (lista.length === 0) {
      aviso.style.display = "block";
      aviso.textContent = "Nenhuma campanha encontrada com esse filtro.";
      return;
    }
    aviso.style.display = "none";

    var hojeISO = U.hojeISO();

    lista.forEach(function (c) {
      var tr = document.createElement("tr");
      tr.className = "linha-clicavel" + (c.favorita ? " linha-favorita" : "");

      var tdEstrela = document.createElement("td");
      var btnEstrela = document.createElement("button");
      btnEstrela.className = "btn-icone";
      btnEstrela.style.color = c.favorita ? "var(--amarelo-escuro)" : "var(--texto-suave)";
      btnEstrela.innerHTML = U.icone(c.favorita ? "estrelaCheia" : "estrelaVazia");
      btnEstrela.addEventListener("click", function (e) { e.stopPropagation(); alternarFavorita(c); });
      tdEstrela.appendChild(btnEstrela);
      tr.appendChild(tdEstrela);

      var tdCampanha = document.createElement("td");
      tdCampanha.innerHTML = "<b>" + U.escapar(c.campanha) + "</b>";
      if (String(c.campanha || "").toLowerCase().indexOf("exemplo") !== -1) {
        tdCampanha.innerHTML += ' <span class="pilula pilula-exemplo">exemplo</span>';
      }
      tr.appendChild(tdCampanha);

      tr.appendChild(criarTd(c.cliente || "—"));

      var tdTipo = document.createElement("td");
      tdTipo.innerHTML = '<span class="pilula ' + (c.tipo === "Publicidade" ? "pilula-conversando" : "pilula-lead") + '">' + U.escapar(c.tipo) + "</span>";
      tr.appendChild(tdTipo);

      var tdStatus = document.createElement("td");
      var indiceFunil = FUNIL.indexOf(c.status);
      var classeStatus = c.status === "Entregue" ? "pilula-cliente" : (indiceFunil >= 3 ? "pilula-conversando" : "pilula-lead");
      tdStatus.innerHTML = '<span class="pilula ' + classeStatus + '">' + U.escapar(c.status) + "</span>";
      tr.appendChild(tdStatus);

      tr.appendChild(criarTd(String(c.qtd != null ? c.qtd : "—")));
      tr.appendChild(criarTd(U.formatarMoeda(c.valor)));

      var tdPrazo = document.createElement("td");
      var textoPrazo = c.prazo ? U.formatarDataBr(c.prazo) : "—";
      tdPrazo.innerHTML = U.escapar(textoPrazo);
      if (c.prazo && c.status !== "Entregue") {
        var dias = U.diasEntre(hojeISO, c.prazo); // dias que faltam até o prazo (negativo = atrasado)
        if (dias < 0) {
          tdPrazo.innerHTML += ' <span class="pilula pilula-atraso">' + Math.abs(dias) + (Math.abs(dias) === 1 ? " dia atrasado" : " dias atrasado") + "</span>";
        } else if (dias <= 3) {
          tdPrazo.innerHTML += ' <span class="pilula pilula-vence">vence em ' + dias + (dias === 1 ? " dia" : " dias") + "</span>";
        }
      }
      tr.appendChild(tdPrazo);

      var tdPagamento = document.createElement("td");
      tdPagamento.innerHTML = '<span class="pilula ' + (c.pagamento === "pago" ? "pilula-cliente" : "pilula-parada") + '">' + (c.pagamento === "pago" ? "Pago" : "Pendente") + "</span>";
      tr.appendChild(tdPagamento);

      var tdAcoes = document.createElement("td");
      var btnEditar = document.createElement("button");
      btnEditar.className = "btn-icone";
      btnEditar.innerHTML = U.icone("editar");
      tdAcoes.appendChild(btnEditar);
      tr.appendChild(tdAcoes);

      tr.addEventListener("click", function () { abrirFormCampanha(c); });
      corpo.appendChild(tr);
    });
  }

  function criarTd(texto) {
    var td = document.createElement("td");
    td.textContent = texto;
    return td;
  }

  function renderizarCabecalhoOrdem() {
    document.querySelectorAll("#cabecalho-campanhas th.ordenavel").forEach(function (th) {
      var coluna = th.getAttribute("data-col");
      var seta = th.querySelector(".seta-ordem");
      th.classList.toggle("ordem-ativa", coluna === ordemColuna);
      if (coluna === ordemColuna) seta.textContent = ordemAsc ? "↑" : "↓";
      else seta.textContent = "↕";
    });
  }

  function renderizarStats() {
    var lista = campanhasAtuais;
    var total = lista.length;
    var ativas = lista.filter(function (c) { return c.ativa; }).length;
    var valorTotal = lista.reduce(function (soma, c) { return soma + (Number(c.valor) || 0); }, 0);
    var qtdTotal = lista.reduce(function (soma, c) { return soma + (Number(c.qtd) || 0); }, 0);
    var ticketMedio = qtdTotal > 0 ? valorTotal / qtdTotal : 0;
    var aReceber = lista.filter(function (c) { return c.pagamento !== "pago"; }).reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0);
    var jaRecebido = lista.filter(function (c) { return c.pagamento === "pago"; }).reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0);

    var container = document.getElementById("stats-campanhas");
    container.innerHTML = "";
    var itens = [
      { rotulo: "total de campanhas", valor: String(total) },
      { rotulo: "ativas", valor: String(ativas) },
      { rotulo: "valor total", valor: U.formatarMoeda(valorTotal), sub: "ticket médio por vídeo: " + U.formatarMoeda(ticketMedio) },
      { rotulo: "a receber", valor: U.formatarMoeda(aReceber), sub: "já recebido: " + U.formatarMoeda(jaRecebido) }
    ];
    itens.forEach(function (item) {
      var card = U.criarEl("div", "stat-card");
      card.appendChild(U.criarEl("span", "stat-valor", item.valor));
      card.appendChild(U.criarEl("p", "stat-rotulo", item.rotulo));
      if (item.sub) card.appendChild(U.criarEl("p", "stat-sub", item.sub));
      container.appendChild(card);
    });
  }

  async function alternarFavorita(campanha) {
    campanha.favorita = !campanha.favorita;
    render();
    await U.consulta("campanhas", window.bancoCliente.from("campanhas").update({ favorita: campanha.favorita }).eq("id", campanha.id));
  }

  function abrirFormCampanha(c) {
    var form = document.getElementById("form-campanha");
    form.reset();
    document.getElementById("campanha-id").value = c ? c.id : "";
    document.getElementById("campanha-nome").value = c ? (c.campanha || "") : "";
    document.getElementById("campanha-cliente").value = c ? (c.cliente || "") : "";
    document.getElementById("campanha-tipo").value = c ? c.tipo : "Conteúdo";
    document.getElementById("campanha-status").value = c ? c.status : "Briefing";
    document.getElementById("campanha-qtd").value = c ? c.qtd : 1;
    document.getElementById("campanha-valor").value = c ? c.valor : 0;
    document.getElementById("campanha-prazo").value = c && c.prazo ? String(c.prazo).slice(0, 10) : "";
    document.getElementById("campanha-pagamento").value = c ? c.pagamento : "pendente";
    document.getElementById("campanha-ativa").checked = c ? !!c.ativa : true;
    document.getElementById("campanha-favorita").checked = c ? !!c.favorita : false;
    document.getElementById("titulo-modal-campanha").textContent = c ? "Editar campanha" : "Nova campanha";
    document.getElementById("btn-apagar-campanha").style.display = c ? "inline-flex" : "none";
    U.abrirModal("modal-campanha");
  }

  async function salvarCampanha(e) {
    e.preventDefault();
    var id = document.getElementById("campanha-id").value;
    var dados = {
      campanha: document.getElementById("campanha-nome").value.trim(),
      cliente: document.getElementById("campanha-cliente").value.trim() || null,
      tipo: document.getElementById("campanha-tipo").value,
      status: document.getElementById("campanha-status").value,
      qtd: Number(document.getElementById("campanha-qtd").value) || 1,
      valor: Number(document.getElementById("campanha-valor").value) || 0,
      prazo: document.getElementById("campanha-prazo").value || null,
      pagamento: document.getElementById("campanha-pagamento").value,
      ativa: document.getElementById("campanha-ativa").checked,
      favorita: document.getElementById("campanha-favorita").checked
    };
    var resultado;
    if (id) {
      resultado = await U.consulta("campanhas", window.bancoCliente.from("campanhas").update(dados).eq("id", id));
    } else {
      resultado = await U.consulta("campanhas", window.bancoCliente.from("campanhas").insert(dados));
    }
    if (resultado.error) return;
    U.fecharModal("modal-campanha");
    U.toast("Campanha salva.");
    await carregarCampanhas();
  }

  async function apagarCampanhaAtual() {
    var id = document.getElementById("campanha-id").value;
    if (!id) return;
    if (!confirm("Apagar esta campanha?")) return;
    var resultado = await U.consulta("campanhas", window.bancoCliente.from("campanhas").delete().eq("id", id));
    if (resultado.error) return;
    U.fecharModal("modal-campanha");
    U.toast("Campanha apagada.");
    await carregarCampanhas();
  }

  function baixarCSV() {
    var lista = ordenar(listaFiltrada());
    U.baixarCSV("campanhas.csv", [
      { rotulo: "Campanha", valor: function (c) { return c.campanha; } },
      { rotulo: "Cliente", valor: function (c) { return c.cliente; } },
      { rotulo: "Tipo", valor: function (c) { return c.tipo; } },
      { rotulo: "Status", valor: function (c) { return c.status; } },
      { rotulo: "Quantidade", valor: function (c) { return c.qtd; } },
      { rotulo: "Valor", valor: function (c) { return c.valor; } },
      { rotulo: "Prazo", valor: function (c) { return c.prazo ? U.formatarDataBr(c.prazo) : ""; } },
      { rotulo: "Pagamento", valor: function (c) { return c.pagamento === "pago" ? "Pago" : "Pendente"; } }
    ], lista);
  }
})();
