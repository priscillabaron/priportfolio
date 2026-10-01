// ============================================================================
// ABA: MARCAS — base de contatos de empresas
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;
  var marcasAtuais = [];
  var termoBusca = "";
  var filtroSituacao = "";

  window.AdminMarcas = { iniciar: iniciar };

  var PILULAS = {
    lead: { classe: "pilula-lead", rotulo: "Lead" },
    conversando: { classe: "pilula-conversando", rotulo: "Conversando" },
    cliente: { classe: "pilula-cliente", rotulo: "Cliente" },
    parada: { classe: "pilula-parada", rotulo: "Parada" }
  };

  async function iniciar() {
    document.getElementById("btn-nova-marca").addEventListener("click", function () { abrirFormMarca(null); });
    document.getElementById("form-marca").addEventListener("submit", salvarMarca);
    document.getElementById("btn-apagar-marca").addEventListener("click", apagarMarcaAtual);
    document.getElementById("btn-baixar-marcas").addEventListener("click", baixarCSV);

    document.getElementById("busca-marcas").addEventListener("input", U.debounce(function (e) {
      termoBusca = e.target.value.trim().toLowerCase();
      renderizarTabela();
    }, 200));
    document.getElementById("filtro-situacao").addEventListener("change", function (e) {
      filtroSituacao = e.target.value;
      renderizarTabela();
    });

    await carregarMarcas();
  }

  async function carregarMarcas() {
    var resultado = await U.consulta("marcas",
      window.bancoCliente.from("marcas").select("*").order("criado_em", { ascending: false })
    );
    marcasAtuais = resultado.data || [];
    renderizarTabela();
  }

  function marcasFiltradas() {
    return marcasAtuais.filter(function (m) {
      if (filtroSituacao && m.situacao !== filtroSituacao) return false;
      if (termoBusca) {
        var alvo = ((m.nome || "") + " " + (m.instagram || "") + " " + (m.email || "") + " " + (m.contato_nome || "") + " " + (m.pais || "") + " " + (m.nicho || "")).toLowerCase();
        if (alvo.indexOf(termoBusca) === -1) return false;
      }
      return true;
    });
  }

  function renderizarTabela() {
    var corpo = document.getElementById("corpo-tabela-marcas");
    var aviso = document.getElementById("aviso-marcas-vazio");
    corpo.innerHTML = "";
    var lista = marcasFiltradas();

    if (marcasAtuais.length === 0) {
      aviso.style.display = "block";
      aviso.textContent = "Nenhuma marca cadastrada ainda. Elas também chegam sozinhas aqui quando alguém preenche o formulário do seu portfólio.";
      return;
    }
    if (lista.length === 0) {
      aviso.style.display = "block";
      aviso.textContent = "Nenhuma marca encontrada com esse filtro.";
      return;
    }
    aviso.style.display = "none";

    lista.forEach(function (marca) {
      var tr = document.createElement("tr");
      tr.className = "linha-clicavel";

      var tdNome = document.createElement("td");
      tdNome.innerHTML = "<b>" + U.escapar(marca.nome) + "</b>";
      if (String(marca.nome || "").toLowerCase().indexOf("exemplo") !== -1) {
        tdNome.innerHTML += ' <span class="pilula pilula-exemplo">exemplo</span>';
      }
      tr.appendChild(tdNome);

      var tdContatoNome = document.createElement("td");
      tdContatoNome.textContent = marca.contato_nome || "—";
      tr.appendChild(tdContatoNome);

      var tdPais = document.createElement("td");
      tdPais.textContent = marca.pais || "—";
      tr.appendChild(tdPais);

      var tdNicho = document.createElement("td");
      tdNicho.textContent = marca.nicho || "—";
      tr.appendChild(tdNicho);

      var tdInsta = document.createElement("td");
      if (marca.instagram) {
        var linkInsta = document.createElement("a");
        linkInsta.href = "https://instagram.com/" + marca.instagram.replace("@", "");
        linkInsta.target = "_blank";
        linkInsta.rel = "noopener";
        linkInsta.style.cssText = "display:inline-flex; align-items:center; gap:5px; color:var(--azul);";
        linkInsta.innerHTML = U.icone("instagram") + U.escapar(marca.instagram);
        linkInsta.addEventListener("click", function (e) { e.stopPropagation(); });
        tdInsta.appendChild(linkInsta);
      } else {
        tdInsta.textContent = "—";
      }
      tr.appendChild(tdInsta);

      var tdEmail = document.createElement("td");
      tdEmail.textContent = marca.email || "—";
      tr.appendChild(tdEmail);

      var tdTel = document.createElement("td");
      tdTel.style.whiteSpace = "nowrap";
      if (marca.telefone) {
        var linkWpp = document.createElement("a");
        var numeroLimpo = String(marca.telefone).replace(/\D/g, "");
        linkWpp.href = "https://wa.me/" + (numeroLimpo.length <= 11 ? "55" + numeroLimpo : numeroLimpo);
        linkWpp.target = "_blank";
        linkWpp.rel = "noopener";
        linkWpp.style.cssText = "display:inline-flex; align-items:center; gap:5px; color:var(--verde); white-space:nowrap;";
        linkWpp.innerHTML = U.icone("whatsapp") + U.escapar(marca.telefone);
        linkWpp.addEventListener("click", function (e) { e.stopPropagation(); });
        tdTel.appendChild(linkWpp);
      } else {
        tdTel.textContent = "—";
      }
      tr.appendChild(tdTel);

      var tdSituacao = document.createElement("td");
      var pilulaInfo = PILULAS[marca.situacao] || PILULAS.lead;
      tdSituacao.innerHTML = '<span class="pilula ' + pilulaInfo.classe + '">' + pilulaInfo.rotulo + "</span>";
      tr.appendChild(tdSituacao);

      var tdContato = document.createElement("td");
      tdContato.textContent = marca.ultimo_contato ? U.formatarDataBr(marca.ultimo_contato) : "—";
      tr.appendChild(tdContato);

      var tdAcoes = document.createElement("td");
      var btnEditar = document.createElement("button");
      btnEditar.className = "btn-icone";
      btnEditar.innerHTML = U.icone("editar");
      tdAcoes.appendChild(btnEditar);
      tr.appendChild(tdAcoes);

      tr.addEventListener("click", function () { abrirFormMarca(marca); });

      corpo.appendChild(tr);
    });
  }

  function abrirFormMarca(marca) {
    var form = document.getElementById("form-marca");
    form.reset();
    document.getElementById("marca-id").value = marca ? marca.id : "";
    document.getElementById("marca-nome").value = marca ? (marca.nome || "") : "";
    document.getElementById("marca-contato-nome").value = marca ? (marca.contato_nome || "") : "";
    document.getElementById("marca-pais").value = marca ? (marca.pais || "") : "";
    document.getElementById("marca-nicho").value = marca ? (marca.nicho || "") : "";
    document.getElementById("marca-instagram").value = marca ? (marca.instagram || "") : "";
    document.getElementById("marca-telefone").value = marca ? (marca.telefone || "") : "";
    document.getElementById("marca-email").value = marca ? (marca.email || "") : "";
    document.getElementById("marca-situacao").value = marca ? (marca.situacao || "lead") : "lead";
    document.getElementById("marca-ultimo-contato").value = marca && marca.ultimo_contato ? String(marca.ultimo_contato).slice(0, 10) : "";
    document.getElementById("marca-obs").value = marca ? (marca.obs || "") : "";
    document.getElementById("titulo-modal-marca").textContent = marca ? "Editar marca" : "Nova marca";
    document.getElementById("btn-apagar-marca").style.display = marca ? "inline-flex" : "none";
    U.abrirModal("modal-marca");
  }

  async function salvarMarca(e) {
    e.preventDefault();
    var id = document.getElementById("marca-id").value;
    var dados = {
      nome: document.getElementById("marca-nome").value.trim(),
      contato_nome: document.getElementById("marca-contato-nome").value.trim() || null,
      pais: document.getElementById("marca-pais").value.trim() || null,
      nicho: document.getElementById("marca-nicho").value.trim() || null,
      instagram: document.getElementById("marca-instagram").value.trim() || null,
      telefone: document.getElementById("marca-telefone").value.trim() || null,
      email: document.getElementById("marca-email").value.trim() || null,
      situacao: document.getElementById("marca-situacao").value,
      ultimo_contato: document.getElementById("marca-ultimo-contato").value || null,
      obs: document.getElementById("marca-obs").value.trim() || null
    };
    var resultado;
    if (id) {
      resultado = await U.consulta("marcas", window.bancoCliente.from("marcas").update(dados).eq("id", id));
    } else {
      resultado = await U.consulta("marcas", window.bancoCliente.from("marcas").insert(dados));
    }
    if (resultado.error) return;
    U.fecharModal("modal-marca");
    U.toast("Marca salva.");
    await carregarMarcas();
  }

  async function apagarMarcaAtual() {
    var id = document.getElementById("marca-id").value;
    if (!id) return;
    if (!confirm("Apagar esta marca? Essa ação não pode ser desfeita.")) return;
    var resultado = await U.consulta("marcas", window.bancoCliente.from("marcas").delete().eq("id", id));
    if (resultado.error) return;
    U.fecharModal("modal-marca");
    U.toast("Marca apagada.");
    await carregarMarcas();
  }

  function baixarCSV() {
    var lista = marcasFiltradas();
    U.baixarCSV("marcas.csv", [
      { rotulo: "Nome", valor: function (m) { return m.nome; } },
      { rotulo: "Pessoa de contato", valor: function (m) { return m.contato_nome; } },
      { rotulo: "País", valor: function (m) { return m.pais; } },
      { rotulo: "Nicho", valor: function (m) { return m.nicho; } },
      { rotulo: "Instagram", valor: function (m) { return m.instagram; } },
      { rotulo: "E-mail", valor: function (m) { return m.email; } },
      { rotulo: "Telefone", valor: function (m) { return m.telefone; } },
      { rotulo: "Situação", valor: function (m) { return (PILULAS[m.situacao] || {}).rotulo || m.situacao; } },
      { rotulo: "Observação", valor: function (m) { return m.obs; } },
      { rotulo: "Último contato", valor: function (m) { return m.ultimo_contato ? U.formatarDataBr(m.ultimo_contato) : ""; } }
    ], lista);
  }
})();
