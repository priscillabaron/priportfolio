// ============================================================================
// Conexão com o Supabase, usada pelo site, pelo login e pelo admin.
// A chave abaixo é a chave PÚBLICA (anon/publishable): ela só consegue fazer
// o que as regras de segurança (RLS) do banco.sql permitirem. Nunca coloque
// aqui a chave secreta (service_role).
// ============================================================================
(function () {
  "use strict";

  var SUPABASE_URL = "https://nxyhhmyybibruqebovuf.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_Nuh1Fsp_8gElsYezVstazw_JRgbnPea";

  if (typeof window.supabase === "undefined") {
    console.error("Biblioteca do Supabase não carregou. Confira se a tag <script> do CDN vem antes de js/banco.js.");
    return;
  }

  window.bancoCliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
