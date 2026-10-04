// ============================================================================
// Liga tudo: espera a sessão ser confirmada, monta o menu e inicia cada aba.
// Se uma aba der erro ao carregar, as outras continuam funcionando.
// ============================================================================
(function () {
  "use strict";

  // ---- menu lateral / gaveta no celular --------------------------------------
  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.addEventListener("click", function () {
      var aba = item.getAttribute("data-aba");
      document.querySelectorAll(".nav-item").forEach(function (b) { b.classList.remove("ativo"); });
      item.classList.add("ativo");
      document.querySelectorAll(".aba").forEach(function (a) { a.classList.remove("ativa"); });
      document.getElementById("aba-" + aba).classList.add("ativa");
      document.dispatchEvent(new CustomEvent("aba-ativada", { detail: aba }));
      fecharGaveta();
    });
  });

  function abrirGaveta() {
    document.getElementById("sidebar").classList.add("aberta");
    document.getElementById("overlay-menu").classList.add("visivel");
  }
  function fecharGaveta() {
    document.getElementById("sidebar").classList.remove("aberta");
    document.getElementById("overlay-menu").classList.remove("visivel");
  }
  var btnAbrir = document.getElementById("btn-abrir-menu");
  if (btnAbrir) btnAbrir.addEventListener("click", abrirGaveta);
  var overlay = document.getElementById("overlay-menu");
  if (overlay) overlay.addEventListener("click", fecharGaveta);

  // ---- inicia cada aba, sem deixar uma quebrar as outras ---------------------
  async function iniciarModulo(nome, modulo) {
    try {
      await modulo.iniciar();
    } catch (erro) {
      console.error("Erro ao iniciar a aba " + nome + ":", erro);
      window.AdminUtil.toast("A aba " + nome + " teve um problema, mas o resto do painel continua funcionando.", true);
    }
  }

  async function tudoPronto() {
    var sessao = await window.AdminAuth.sessaoPronta;
    if (!sessao) return; // já foi redirecionado pro login

    await iniciarModulo("Portfólio", window.AdminPortfolio);
    await iniciarModulo("Marcas", window.AdminMarcas);
    await iniciarModulo("Prospecção", window.AdminProspeccao);
    await iniciarModulo("Calendário", window.AdminCalendario);
    await iniciarModulo("Campanhas", window.AdminCampanhas);
    await iniciarModulo("Checklist", window.AdminChecklist);
    await iniciarModulo("Conteúdos", window.AdminConteudos);
  }

  tudoPronto();
})();
