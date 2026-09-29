// ============================================================================
// Confere a sessão ANTES de qualquer outra coisa aparecer na tela.
// Sem sessão válida, manda direto pro login.
// ============================================================================
(function () {
  "use strict";

  window.AdminAuth = {};

  window.AdminAuth.sessaoPronta = (async function () {
    var resultado;
    try {
      resultado = await window.bancoCliente.auth.getSession();
    } catch (erro) {
      window.location.href = "../login/";
      return null;
    }

    var sessao = resultado.data ? resultado.data.session : null;
    if (!sessao) {
      window.location.href = "../login/";
      return null;
    }

    // Sessão confirmada: agora sim a página pode aparecer.
    document.getElementById("tela-carregando").style.display = "none";
    document.getElementById("admin-wrap").style.display = "flex";

    var emailEl = document.getElementById("sidebar-email");
    if (emailEl) emailEl.textContent = sessao.user.email;

    return sessao;
  })();

  document.addEventListener("DOMContentLoaded", function () {
    var btnSair = document.getElementById("btn-sair");
    if (btnSair) {
      btnSair.addEventListener("click", async function () {
        await window.bancoCliente.auth.signOut();
        window.location.href = "../login/";
      });
    }
  });

  // Se a sessão expirar ou for encerrada em outra aba, manda pro login.
  window.bancoCliente.auth.onAuthStateChange(function (evento) {
    if (evento === "SIGNED_OUT") {
      window.location.href = "../login/";
    }
  });
})();
