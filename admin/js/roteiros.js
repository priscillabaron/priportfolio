// ============================================================================
// ABA: ROTEIROS
// Transcreve vídeos do Instagram, TikTok e YouTube a partir do link (Supadata),
// guarda tudo numa biblioteca com etiqueta "Meu" / "De outra".
// Tabelas: roteiros e configuracoes (arquivo sql-roteiros.sql).
// A chave da Supadata NUNCA fica no código: ela é digitada no painel e guardada
// na tabela configuracoes (só quem está logada consegue ler).
// ============================================================================
(function () {
  "use strict";
  var U = window.AdminUtil;

  var API = "https://api.supadata.ai/v1";
  var NOME_CHAVE = "supadata_api_key";
  var ESPERA_ENTRE_CONSULTAS_MS = 5000;
  var LIMITE_ESPERA_S = 6 * 60;

  window.AdminRoteiros = { iniciar: iniciar, transcreverLink: transcreverLink };

  var FONTES = {
    instagram: { rotulo: "Instagram", emoji: "📸", cor: "#c13584" },
    tiktok: { rotulo: "TikTok", emoji: "🎵", cor: "#111827" },
    youtube: { rotulo: "YouTube", emoji: "▶️", cor: "#d62828" },
    manual: { rotulo: "Escrito à mão", emoji: "✍️", cor: "#5d6573" }
  };

  var est = {
    itens: [],
    filtro: "todos",     // todos | minha | outra | tag:<nome>
    busca: "",
    chave: "",
    chaveCarregada: false,
    rodando: {},         // ids que estão sendo transcritos agora
    ocupado: false,
    cronometro: null,
    editando: null,      // linha aberta no modal (ou null para uma nova)
    copiouTimers: {}
  };
  var el = {};

  /* ---------------------------------------------------------------------
     AJUDANTES
     --------------------------------------------------------------------- */
  function criar(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }
  function $(id) { return document.getElementById(id); }
  function cliente() { return window.bancoCliente; }
  function semAcento(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function agoraISO() { return new Date().toISOString(); }
  function dataBr(iso) {
    if (!iso) return "";
    var d = String(iso).length <= 10 ? new Date(iso + "T12:00:00") : new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  }
  // 1234 vira "1,2 mil"; 3400000 vira "3,4 mi"
  function formatarViews(n) {
    try { return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(n); }
    catch (e) { return String(n); }
  }
  async function copiarTexto(texto) {
    try { await navigator.clipboard.writeText(texto); }
    catch (erro) {
      var a = document.createElement("textarea");
      a.value = texto;
      a.style.position = "fixed";
      a.style.opacity = "0";
      document.body.appendChild(a);
      a.select();
      try { document.execCommand("copy"); } catch (e2) { /* tudo bem */ }
      a.remove();
    }
  }

  /* ---------------------------------------------------------------------
     LINKS
     --------------------------------------------------------------------- */
  // Tira lixo do link: /reels/ vira /reel/, some igsh e utm_
  function limparLink(texto) {
    var t = String(texto || "").trim();
    if (!/^https?:\/\//i.test(t)) return t;
    try {
      var u = new URL(t);
      u.pathname = u.pathname.replace(/\/reels\//i, "/reel/");
      var apagar = [];
      u.searchParams.forEach(function (v, k) {
        if (/^igsh/i.test(k) || /^utm_/i.test(k)) apagar.push(k);
      });
      apagar.forEach(function (k) { u.searchParams.delete(k); });
      var s = u.toString();
      return s.replace(/\?$/, "");
    } catch (e) { return t; }
  }
  function descobrirFonte(url) {
    var h = "";
    try { h = new URL(url).hostname.toLowerCase(); } catch (e) { return ""; }
    if (h.indexOf("instagram.com") >= 0) return "instagram";
    if (h.indexOf("tiktok.com") >= 0) return "tiktok";
    if (h.indexOf("youtube.com") >= 0 || h === "youtu.be" || h.indexOf(".youtu.be") >= 0) return "youtube";
    return "";
  }
  // O @ só existe no link em instagram.com/<perfil>/reel/<id> e tiktok.com/@<perfil>/...
  function descobrirPerfil(url, fonte) {
    try {
      var partes = new URL(url).pathname.split("/").filter(Boolean);
      if (fonte === "instagram" && partes.length >= 3 && /^(reel|reels|p|tv)$/i.test(partes[1])) {
        return partes[0].replace(/^@/, "");
      }
      if (fonte === "tiktok" && partes[0] && partes[0].charAt(0) === "@") return partes[0].slice(1);
      if (fonte === "youtube" && partes[0] && partes[0].charAt(0) === "@") return partes[0].slice(1);
    } catch (e) { /* sem perfil */ }
    return "";
  }
  function urlDeEmbed(item) {
    var url = item.url || "";
    var fonte = item.fonte;
    var m;
    try {
      var u = new URL(url);
      if (fonte === "instagram") {
        m = u.pathname.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
        if (m) return "https://www.instagram.com/reel/" + m[1] + "/embed";
      } else if (fonte === "youtube") {
        var id = "";
        if (u.hostname.indexOf("youtu.be") >= 0) id = u.pathname.split("/").filter(Boolean)[0] || "";
        else if (u.searchParams.get("v")) id = u.searchParams.get("v");
        else { m = u.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]+)/); if (m) id = m[1]; }
        if (id) return "https://www.youtube.com/embed/" + id;
      } else if (fonte === "tiktok") {
        m = u.pathname.match(/\/video\/(\d+)/);
        if (m) return "https://www.tiktok.com/embed/v2/" + m[1];
      }
    } catch (e) { /* sem embed */ }
    return "";
  }

  /* ---------------------------------------------------------------------
     CHAVE DA SUPADATA
     --------------------------------------------------------------------- */
  async function carregarChave() {
    if (!cliente()) return;
    var r = await U.consulta("configuracoes", cliente().from("configuracoes").select("valor").eq("chave", NOME_CHAVE).limit(1));
    est.chave = (r.data && r.data[0] && r.data[0].valor) || "";
    est.chaveCarregada = !r.error;
  }

  async function salvarChave() {
    var nova = el["rot-chave"].value.trim();
    if (!nova) { U.toast("Cole a chave da Supadata no campo.", true); el["rot-chave"].focus(); return; }
    var r = await U.consulta("configuracoes", cliente().from("configuracoes").upsert({ chave: NOME_CHAVE, valor: nova, updated_at: agoraISO() }));
    if (r.error) { U.toast("Não consegui guardar a chave. Rode o arquivo sql-roteiros.sql no Supabase.", true); return; }
    est.chave = nova;
    el["rot-chave"].value = "";
    desenharChave();
    U.toast("Chave guardada.");
    carregarSaldo();
  }

  async function removerChave() {
    if (!window.confirm("Remover a chave da Supadata deste painel?")) return;
    var r = await U.consulta("configuracoes", cliente().from("configuracoes").delete().eq("chave", NOME_CHAVE));
    if (r.error) return;
    est.chave = "";
    desenharChave();
    el["rot-saldo"].textContent = "";
    U.toast("Chave removida.");
  }

  function desenharChave() {
    var tem = !!est.chave;
    el["rot-chave-estado"].textContent = tem ? "Chave guardada, termina em " + est.chave.slice(-4) : "Nenhuma chave guardada ainda";
    el["rot-chave-estado"].className = "rot-chave-estado " + (tem ? "ok" : "falta");
    el["rot-remover-chave"].style.display = tem ? "" : "none";
    el["rot-saldo-atualizar"].style.display = tem ? "" : "none";
    el["rot-como-chave"].style.display = tem ? "none" : "";
    el["rot-chave-card"].classList.toggle("sem-chave", !tem);
    el["rot-chave-rotulo"].textContent = tem ? "Trocar a chave" : "Chave da Supadata";
  }

  async function carregarSaldo() {
    if (!est.chave) { el["rot-saldo"].textContent = ""; return; }
    el["rot-saldo"].textContent = "Vendo o saldo...";
    try {
      var resp = await fetch(API + "/me", { headers: { "x-api-key": est.chave } });
      var j = await resp.json().catch(function () { return null; });
      if (resp.ok && j && typeof j.maxCredits !== "undefined") {
        el["rot-saldo"].textContent = j.usedCredits + " de " + j.maxCredits + " créditos usados este mês";
      } else if (resp.status === 401 || resp.status === 403) {
        el["rot-saldo"].textContent = "A Supadata não aceitou essa chave. Confira se copiou inteira.";
      } else {
        el["rot-saldo"].textContent = "Não consegui ver o saldo agora.";
      }
    } catch (e) {
      el["rot-saldo"].textContent = "Não consegui ver o saldo agora.";
    }
  }

  /* ---------------------------------------------------------------------
     SUPADATA
     --------------------------------------------------------------------- */
  function dormir(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

  function textoDoConteudo(c) {
    if (typeof c === "string") return c.trim();
    if (Array.isArray(c)) return c.map(function (s) { return s && s.text ? s.text : ""; }).join(" ").replace(/\s+/g, " ").trim();
    return "";
  }

  // Traduz o erro da Supadata para uma frase simples
  function erroDaApi(status, j) {
    var codigo = (j && (j.error || j.code)) || "";
    var detalhe = String((j && (j.details || j.message)) || "").toLowerCase();
    if (status === 401 || status === 403 || codigo === "unauthorized" || codigo === "forbidden") {
      return "A Supadata não aceitou a chave. Confira se ela está inteira, ou crie uma nova em supadata.ai.";
    }
    if (codigo === "limit-exceeded" || status === 429) return "LIMITE";
    if (codigo === "transcript-unavailable") return "VAZIO";
    if (codigo === "not-found" || codigo === "video-not-found" || status === 404) {
      return "Não achei esse vídeo. Ele pode ser privado ou ter sido apagado. Confira o link.";
    }
    if (codigo === "invalid-request" || status === 400) {
      return "Esse link não parece ser de um vídeo que eu consiga ler. Confira se é de um reel, vídeo do TikTok ou do YouTube.";
    }
    return "A transcrição não funcionou desta vez. Tente de novo daqui a pouco.";
  }

  // A Supadata usa a mesma mensagem para "créditos acabaram" e "pedidos demais seguidos".
  // Para não errar, confere o saldo de verdade (o /me ainda responde quando a cota acaba).
  async function explicarLimite(chave, j) {
    var detalhe = String((j && (j.details || j.message)) || "");
    var creditosAcabaram = null;
    var numeros = "";
    var tecnico = detalhe ? " [detalhe da Supadata: " + detalhe + "]" : "";
    await dormir(1300); // respeita o limite de 1 pedido por segundo antes de consultar o saldo
    try {
      var r = await fetch(API + "/me", { headers: { "x-api-key": chave } });
      var m = await r.json().catch(function () { return null; });
      if (r.ok && m && typeof m.maxCredits !== "undefined") {
        creditosAcabaram = Number(m.usedCredits) >= Number(m.maxCredits);
        numeros = " (a Supadata mostra " + m.usedCredits + " de " + m.maxCredits + " créditos usados)";
      }
    } catch (e) { /* segue com o texto da API */ }
    if (creditosAcabaram === null) creditosAcabaram = /plan|usage|credit/i.test(detalhe) && !/rate/i.test(detalhe);
    if (creditosAcabaram) {
      return "Os créditos do mês na Supadata acabaram" + numeros + ". Eles voltam no começo do próximo mês, ou você pode assinar um plano maior no site deles." + tecnico;
    }
    return "Muitos pedidos seguidos na Supadata" + numeros + ". Espere 1 minuto e clique em Tentar de novo." + tecnico;
  }
  async function traduzirErro(status, j, chave) {
    var m = erroDaApi(status, j);
    return m === "LIMITE" ? await explicarLimite(chave, j) : m;
  }

  // Devolve { texto, segmentos } | { vazio:true } | { erro:"..." }
  async function pedirTranscricao(link, chave, aoAndamento) {
    var inicio = Date.now();
    var timer = setInterval(function () {
      if (aoAndamento) aoAndamento(Math.round((Date.now() - inicio) / 1000));
    }, 1000);
    if (aoAndamento) aoAndamento(0);
    try {
      var endereco = API + "/transcript?url=" + encodeURIComponent(link) + "&mode=auto&text=true&lang=pt";
      var resp, j;
      // o plano grátis aceita 1 pedido por segundo: se recusar por velocidade, espera e tenta de novo sozinho
      for (var tentativa = 0; tentativa < 4; tentativa++) {
        if (tentativa > 0) await dormir(1500 * tentativa);
        resp = await fetch(endereco, { headers: { "x-api-key": chave } });
        j = await resp.json().catch(function () { return null; });
        if (resp.status !== 429 && !(j && j.error === "limit-exceeded")) break;
      }

      if (resp.status === 202 && j && j.jobId) {
        // vídeo longo: consulta o andamento a cada 5 segundos
        while (true) {
          if ((Date.now() - inicio) / 1000 > LIMITE_ESPERA_S) {
            return { erro: "Demorou mais de 6 minutos e eu parei de esperar. Tente de novo, ou escreva o texto na mão." };
          }
          await dormir(ESPERA_ENTRE_CONSULTAS_MS);
          var r2 = await fetch(API + "/transcript/" + encodeURIComponent(j.jobId), { headers: { "x-api-key": chave } });
          var j2 = await r2.json().catch(function () { return null; });
          if (!r2.ok && r2.status !== 202) {
            var m2 = await traduzirErro(r2.status, j2, chave);
            return m2 === "VAZIO" ? { vazio: true } : { erro: m2 };
          }
          if (j2 && j2.status === "completed") return resultadoFinal(j2);
          if (j2 && j2.status === "failed") {
            var m3 = await traduzirErro(500, j2.error && typeof j2.error === "object" ? j2.error : { error: j2.error }, chave);
            return m3 === "VAZIO" ? { vazio: true } : { erro: m3 };
          }
        }
      }

      if (resp.status === 206) return { vazio: true };
      if (!resp.ok) {
        var m = await traduzirErro(resp.status, j, chave);
        return m === "VAZIO" ? { vazio: true } : { erro: m };
      }
      return resultadoFinal(j);
    } catch (e) {
      return { erro: "Não consegui falar com a Supadata. Confira sua internet e tente de novo." };
    } finally {
      clearInterval(timer);
    }
  }

  function resultadoFinal(j) {
    var texto = textoDoConteudo(j && j.content);
    if (!texto || (j && j.lang === "none")) return { vazio: true };
    return { texto: texto, segmentos: Array.isArray(j.content) ? j.content : null };
  }

  // Copia a capa para uma imagem pequena guardada junto do roteiro (os links das redes expiram).
  // Se o site da capa não deixar copiar, guarda o link mesmo.
  function reduzirImagem(blob) {
    return new Promise(function (ok, falha) {
      var u = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, 360 / img.width);
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * s));
        c.height = Math.max(1, Math.round(img.height * s));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        ok(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = function () { URL.revokeObjectURL(u); falha(new Error("imagem")); };
      img.src = u;
    });
  }
  async function guardarCapa(url) {
    try {
      var resp = await fetch(url, { referrerPolicy: "no-referrer" });
      if (!resp.ok) throw new Error("capa");
      return await reduzirImagem(await resp.blob());
    } catch (e) {
      return url;
    }
  }
  function idYoutube(url) {
    try {
      var u = new URL(url);
      if (u.hostname.indexOf("youtu.be") >= 0) return u.pathname.split("/").filter(Boolean)[0] || "";
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      var m = u.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]+)/);
      return m ? m[1] : "";
    } catch (e) { return ""; }
  }
  // Capa para mostrar no card: a guardada, ou (YouTube) a oficial
  function capaDoItem(item) {
    if (item.capa) return item.capa;
    if (item.fonte === "youtube") {
      var id = idYoutube(item.url || "");
      if (id) return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
    }
    return "";
  }

  // Grava no banco. Se a coluna "capa" ainda não existe (SQL novo não rodado), tenta de novo sem ela.
  async function gravarLinha(id, dados) {
    var r = await cliente().from("roteiros").update(dados).eq("id", id).select().single();
    if (r.error && (r.error.code === "42703" || r.error.code === "PGRST204")) {
      var semNovas = Object.assign({}, dados);
      delete semNovas.capa;
      delete semNovas.visualizacoes;
      r = await cliente().from("roteiros").update(semNovas).eq("id", id).select().single();
    }
    if (r.error) {
      console.error("Erro ao gravar roteiro:", r.error);
      U.toast("Não consegui salvar. Confira se o SQL foi rodado.", true);
    }
    return r;
  }

  // Busca título, perfil, data, hashtags e legenda do post (1 crédito). Nunca derruba a transcrição:
  // se não der certo, devolve null.
  async function buscarMetadados(link, chave) {
    try {
      var resp = await fetch(API + "/metadata?url=" + encodeURIComponent(link), { headers: { "x-api-key": chave } });
      if (!resp.ok) return null;
      var j = await resp.json();
      if (!j) return null;
      var legenda = typeof j.description === "string" ? j.description.trim() : "";
      var tags = Array.isArray(j.tags) ? j.tags.map(function (t) { return String(t).replace(/^#/, "").trim(); }).filter(Boolean) : [];
      if (!tags.length && legenda) {
        (legenda.match(/#[\p{L}\p{N}_]+/gu) || []).forEach(function (h) {
          var x = h.slice(1);
          if (tags.indexOf(x) < 0) tags.push(x);
        });
      }
      var titulo = typeof j.title === "string" ? j.title.trim() : "";
      if (!titulo && legenda) {
        // sem título (comum no Instagram): usa a primeira frase da legenda, sem hashtags
        var primeira = legenda.replace(/#[\p{L}\p{N}_]+/gu, "").split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean)[0] || "";
        titulo = primeira.length > 90 ? primeira.slice(0, 87).trim() + "..." : primeira;
      }
      var perfil = j.author && (j.author.username || j.author.displayName) ? String(j.author.username || j.author.displayName).replace(/^@/, "") : "";
      var data = typeof j.createdAt === "string" && /^\d{4}-\d{2}-\d{2}/.test(j.createdAt) ? j.createdAt.slice(0, 10) : "";
      var m = j.media || {};
      var primeiro = m.items && m.items[0] ? m.items[0] : {};
      var urlCapa = m.thumbnailUrl || m.url || primeiro.thumbnailUrl || primeiro.url || "";
      var capa = urlCapa ? await guardarCapa(urlCapa) : "";
      var views = j.stats && typeof j.stats.views === "number" ? j.stats.views : null;
      return { titulo: titulo, perfil: perfil, postado_em: data, tags: tags.slice(0, 12), legenda: legenda, capa: capa, visualizacoes: views };
    } catch (e) {
      return null;
    }
  }

  // Só preenche o que ainda está vazio (não passa por cima do que você já escreveu)
  function camposVaziosDaMeta(atual, meta) {
    var novo = {};
    if (!meta) return novo;
    if (!atual.titulo && meta.titulo) novo.titulo = meta.titulo;
    if (!atual.perfil && meta.perfil) novo.perfil = meta.perfil;
    if (!atual.postado_em && meta.postado_em) novo.postado_em = meta.postado_em;
    if ((!atual.tags || !atual.tags.length) && meta.tags && meta.tags.length) novo.tags = meta.tags;
    if (!atual.legenda && meta.legenda) novo.legenda = meta.legenda;
    if (!atual.capa && meta.capa) novo.capa = meta.capa;
    // visualizações mudam com o tempo: sempre guarda o número mais novo
    if (typeof meta.visualizacoes === "number") novo.visualizacoes = meta.visualizacoes;
    return novo;
  }

  // Usada também pelo Banco de Ideias (botão "Transcrever aqui")
  async function transcreverLink(link, aoAndamento) {
    var limpo = limparLink(link);
    if (!/^https?:\/\//i.test(limpo)) return { erro: "Cole o link completo do vídeo, começando com http." };
    if (!descobrirFonte(limpo)) return { erro: "Esse link não parece ser do Instagram, TikTok ou YouTube." };
    if (!est.chaveCarregada || !est.chave) await carregarChave();
    if (!est.chave) {
      return { erro: "Falta a chave da Supadata. Vá na aba Roteiros, cole a chave no campo \"Chave da Supadata\" e salve (a conta grátis fica em supadata.ai)." };
    }
    var r = await pedirTranscricao(limpo, est.chave, aoAndamento);
    if (r.vazio) return { erro: "Não achei fala nesse vídeo. Costuma ser reel só com música ou só com texto na tela." };
    if (r.texto && el["rot-saldo"]) carregarSaldo();
    return r;
  }

  /* ---------------------------------------------------------------------
     AVISO (andamento e erros)
     --------------------------------------------------------------------- */
  function mostrarAviso(tipo, texto, acao) {
    var a = el["rot-aviso"];
    a.className = "rot-aviso " + tipo;
    a.innerHTML = "";
    a.appendChild(criar("span", "rot-aviso-texto", texto));
    if (acao) {
      var b = criar("button", "rot-aviso-botao", acao.rotulo);
      b.type = "button";
      b.addEventListener("click", acao.fazer);
      a.appendChild(b);
    }
    a.style.display = "";
  }
  function esconderAviso() { el["rot-aviso"].style.display = "none"; }

  function frasePassouTempo(s) {
    var m = Math.floor(s / 60);
    var rest = s % 60;
    return m ? m + "min " + String(rest).padStart(2, "0") + "s" : s + "s";
  }

  /* ---------------------------------------------------------------------
     BANCO
     --------------------------------------------------------------------- */
  async function carregarLista() {
    var r = await U.consulta("roteiros", cliente().from("roteiros").select("*").order("created_at", { ascending: false }));
    est.itens = r.data || [];
    el["rot-sem-tabela"].style.display = r.error && !est.itens.length ? "" : "none";
    renderFiltros();
    renderLista();
  }

  /* ---------------------------------------------------------------------
     TRANSCREVER (fluxo completo)
     --------------------------------------------------------------------- */
  async function aoClicarTranscrever() {
    if (est.ocupado) { mostrarAviso("info", "Já estou transcrevendo um vídeo. Espere terminar."); return; }
    var bruto = el["rot-link"].value;
    var link = limparLink(bruto);
    if (!/^https?:\/\//i.test(link)) {
      mostrarAviso("erro", "Cole o link completo do vídeo, começando com http.");
      el["rot-link"].focus();
      return;
    }
    var fonte = descobrirFonte(link);
    if (!fonte) {
      mostrarAviso("erro", "Esse link não parece ser do Instagram, TikTok ou YouTube. Se quiser guardar mesmo assim, use \"+ Escrever na mão\".");
      return;
    }
    if (!est.chaveCarregada) await carregarChave();
    if (!est.chave) {
      mostrarAviso("erro", "Falta a chave da Supadata. É grátis: crie a conta em supadata.ai (100 créditos por mês, sem cartão), copie a API key e cole no campo \"Chave da Supadata\" aqui embaixo.");
      el["rot-chave-card"].scrollIntoView({ behavior: "smooth", block: "center" });
      el["rot-chave"].focus();
      return;
    }

    var existente = est.itens.filter(function (i) { return i.url === link; })[0];
    var linha;
    if (existente) {
      if (!window.confirm("Esse link já está na biblioteca. Transcrever de novo?")) return;
      linha = existente;
    }
    est.ocupado = true;
    el["rot-transcrever"].disabled = true;
    try {
      if (!linha) {
        var nova = {
          fonte: fonte, url: link, perfil: descobrirPerfil(link, fonte),
          de_quem: el["rot-dequem"].value === "minha" ? "minha" : "outra",
          status: "processando", erro: null
        };
        var ins = await U.consulta("roteiros", cliente().from("roteiros").insert(nova).select().single());
        if (ins.error || !ins.data) { mostrarAviso("erro", "Não consegui criar o registro. Rode o arquivo sql-roteiros.sql no Supabase."); return; }
        linha = ins.data;
      } else {
        await U.consulta("roteiros", cliente().from("roteiros").update({ status: "processando", erro: null, updated_at: agoraISO() }).eq("id", linha.id));
      }
      el["rot-link"].value = "";
      await executar(linha);
    } finally {
      est.ocupado = false;
      el["rot-transcrever"].disabled = false;
    }
  }

  // Roda a transcrição de uma linha que já existe no banco
  async function executar(linha) {
    est.rodando[linha.id] = true;
    await carregarLista();
    var fraseAndamento = function (s) {
      mostrarAviso("info", "🎧 Ouvindo o vídeo... " + frasePassouTempo(s) + ". Costuma levar de 3 a 4 minutos, pode deixar a aba aberta.");
    };
    // título, perfil, data, tags, legenda e capa vêm de outro pedido (1 crédito)
    // (um pedido de cada vez, para a Supadata não achar que são pedidos demais seguidos)
    mostrarAviso("info", "🔎 Buscando os dados do vídeo...");
    var meta = await buscarMetadados(linha.url, est.chave);
    var extras = camposVaziosDaMeta(linha, meta);
    await dormir(1300); // plano grátis: 1 pedido por segundo
    var r = await pedirTranscricao(linha.url, est.chave, fraseAndamento);
    delete est.rodando[linha.id];

    if (r.texto) {
      // confere o que o vídeo é (restaurante em SP, viagem, passeio, loja) e põe a tag certa
      var vistaPrevia = Object.assign({}, linha, extras, { transcricao: r.texto });
      var catsAchadas = classificar(vistaPrevia);
      if (catsAchadas.length) extras.tags = uniaoDeTags(extras.tags || linha.tags, catsAchadas);
      var up = await gravarLinha(linha.id, Object.assign({
        transcricao: r.texto, segmentos: r.segmentos, status: "pronto", erro: null, updated_at: agoraISO()
      }, extras));
      await carregarLista();
      carregarSaldo();
      esconderAviso();
      var linhaPronta = (up.data && up.data.id) ? up.data : est.itens.filter(function (i) { return i.id === linha.id; })[0];
      if (linhaPronta) abrirModal(linhaPronta, "✅ Pronto. Revisa, dá um nome e salva.");
      return;
    }

    var msgErro = r.vazio
      ? "Não achei fala nesse vídeo. Costuma ser reel só com música ou só com texto na tela."
      : r.erro;
    await gravarLinha(linha.id, Object.assign({ status: "falhou", erro: msgErro, updated_at: agoraISO() }, extras));
    await carregarLista();
    carregarSaldo();
    if (r.vazio) {
      mostrarAviso("erro", msgErro, { rotulo: "Guardar assim mesmo", fazer: function () { guardarAssimMesmo(linha.id); } });
    } else {
      mostrarAviso("erro", msgErro);
    }
  }

  async function guardarAssimMesmo(id) {
    var r = await U.consulta("roteiros", cliente().from("roteiros").update({ status: "pronto", erro: null, updated_at: agoraISO() }).eq("id", id).select().single());
    await carregarLista();
    esconderAviso();
    if (r.data) abrirModal(r.data, "Guardado com o link. Escreva o texto na mão, se quiser.");
  }

  async function tentarDeNovo(item) {
    if (est.ocupado) { mostrarAviso("info", "Já estou transcrevendo um vídeo. Espere terminar."); return; }
    if (!est.chaveCarregada) await carregarChave();
    if (!est.chave) {
      mostrarAviso("erro", "Falta a chave da Supadata. Cole no campo \"Chave da Supadata\" aqui embaixo.");
      el["rot-chave-card"].scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    est.ocupado = true;
    el["rot-transcrever"].disabled = true;
    try {
      await U.consulta("roteiros", cliente().from("roteiros").update({ status: "processando", erro: null, updated_at: agoraISO() }).eq("id", item.id));
      await executar(item);
    } finally {
      est.ocupado = false;
      el["rot-transcrever"].disabled = false;
    }
  }

  /* ---------------------------------------------------------------------
     BIBLIOTECA
     --------------------------------------------------------------------- */
  // Categorias: o painel confere o texto do vídeo (título, legenda, hashtags e fala) e coloca a tag certa.
  // Cada lista tem palavras sem acento; "s?" aceita o plural.
  var SP = ["sao paulo", "sp", "paulistano", "paulista", "pinheiros", "vila madalena", "moema", "itaim", "bixiga", "consolacao", "mooca", "tatuape", "ibirapuera", "brooklin", "vila olimpia", "higienopolis"];
  var CATEGORIAS = [
    { rotulo: "Restaurantes SP", exigeSP: true, palavras: ["restaurantes?", "bar", "bares", "cafe", "cafes", "cafeterias?", "padarias?", "pizzarias?", "hamburguerias?", "rodizios?", "comidas?", "gastronomi(a|co|cos)", "drinks?", "coquetelaria", "brunch", "sorveterias?", "botecos?", "cardapios?", "chefs?", "churrascarias?", "sushi", "lanches?", "docerias?", "confeitarias?", "jantar", "almoco", "pratos?", "petiscos?", "cervejas?", "choperias?", "bebidas?", "menu"] },
    { rotulo: "Viagens", palavras: ["viagem", "viagens", "viajar", "viajei", "viajando", "hotel", "hoteis", "resorts?", "pousadas?", "hospedagem", "hospedar", "passagens?", "voos?", "aeroporto", "destinos?", "ferias", "turismo", "turista", "intercambio", "malas?", "all inclusive", "hostel", "airbnb", "cruzeiros?", "milhas", "internacional", "pacotes?"] },
    { rotulo: "Passeios", palavras: ["passeios?", "atracao", "atracoes", "parques?", "museus?", "mirantes?", "trilhas?", "tours?", "ingressos?", "o que fazer", "pontos? turisticos?", "roles?", "programas?", "fim de semana", "cachoeiras?", "praias?", "exposicao", "exposicoes", "shows?", "eventos?", "lugares", "conhecer", "visitar", "teatro", "cinema", "bate e volta", "zoologico", "fora do obvio", "imperdiveis?"] },
    { rotulo: "Lojas", palavras: ["lojas?", "comprar", "compras?", "shopping", "outlet", "promocao", "promocoes", "descontos?", "achadinhos?", "brechos?", "boutiques?", "cupom", "cupons", "precos?", "marcas?", "liquidacao", "vitrine", "moda", "roupas?", "sapatos?", "bolsas?", "perfumes?", "perfumaria", "maquiagem", "decoracao"] }
  ];
  function normalizar(t) { return semAcento(t).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " "); }
  function contarDistintas(lista, texto) {
    var n = 0;
    lista.forEach(function (p) {
      if (new RegExp("(^| )" + p + "( |$)").test(texto)) n++;
    });
    return n;
  }
  // Devolve os nomes das categorias que combinam com o roteiro
  function classificar(item) {
    var forte = normalizar([item.titulo, item.legenda, (item.tags || []).join(" ")].join(" "));
    var fraco = normalizar(item.transcricao);
    var juntos = forte + " " + fraco;
    var achadas = [];
    CATEGORIAS.forEach(function (c) {
      var pontos = contarDistintas(c.palavras, forte) * 2 + contarDistintas(c.palavras, fraco);
      if (pontos < 2) return;
      if (c.exigeSP && contarDistintas(SP, juntos) < 1) return;
      achadas.push(c.rotulo);
    });
    return achadas;
  }
  function nomesDeCategorias() { return CATEGORIAS.map(function (c) { return c.rotulo; }); }
  function uniaoDeTags(a, b) {
    var saida = (a || []).slice();
    (b || []).forEach(function (t) {
      if (saida.map(function (x) { return x.toLowerCase(); }).indexOf(String(t).toLowerCase()) < 0) saida.push(t);
    });
    return saida;
  }
  function temCategoria(item) {
    var nomes = nomesDeCategorias().map(function (n) { return n.toLowerCase(); });
    return (item.tags || []).some(function (t) { return nomes.indexOf(String(t).toLowerCase()) >= 0; });
  }

  // Roteiros que já existiam antes das categorias: organiza uma vez só (por navegador)
  async function organizarAntigos() {
    var feitos = {};
    try { feitos = JSON.parse(localStorage.getItem("rot-organizados") || "{}"); } catch (e) { feitos = {}; }
    var mudou = false;
    for (var k = 0; k < est.itens.length; k++) {
      var i = est.itens[k];
      if (feitos[i.id] || i.status !== "pronto" || temCategoria(i)) continue;
      feitos[i.id] = 1;
      var cats = classificar(i);
      if (cats.length) {
        var r = await gravarLinha(i.id, { tags: uniaoDeTags(i.tags, cats), updated_at: agoraISO() });
        if (!r.error) mudou = true;
      }
    }
    try { localStorage.setItem("rot-organizados", JSON.stringify(feitos)); } catch (e) { /* tudo bem */ }
    if (mudou) await carregarLista();
  }

  function renderFiltros() {
    var caixa = el["rot-filtros"];
    caixa.innerHTML = "";
    var lista = [
      { id: "todos", rotulo: "Todos" },
      { id: "minha", rotulo: "Meus vídeos" },
      { id: "outra", rotulo: "Outros perfis" }
    ];
    CATEGORIAS.forEach(function (c) { lista.push({ id: "tag:" + c.rotulo, rotulo: c.rotulo }); });
    lista.forEach(function (f) {
      var b = criar("button", "cont-pilula" + (est.filtro === f.id ? " ativo" : ""), f.rotulo);
      b.type = "button";
      b.addEventListener("click", function () { est.filtro = f.id; renderFiltros(); renderLista(); });
      caixa.appendChild(b);
    });
  }

  function passaNoFiltro(i) {
    if (est.filtro === "minha" && i.de_quem !== "minha") return false;
    if (est.filtro === "outra" && i.de_quem === "minha") return false;
    if (est.filtro.indexOf("tag:") === 0) {
      var quer = est.filtro.slice(4).toLowerCase();
      if ((i.tags || []).map(function (t) { return String(t).toLowerCase(); }).indexOf(quer) < 0) return false;
    }
    if (est.busca) {
      var palheiro = semAcento([i.transcricao, i.perfil, i.titulo, i.obs, i.legenda, (i.tags || []).join(" ")].join(" "));
      if (palheiro.indexOf(est.busca) < 0) return false;
    }
    return true;
  }

  function primeirasLinhas(texto) {
    var t = String(texto || "").trim();
    if (!t) return "";
    return t.length > 360 ? t.slice(0, 360).trim() + "..." : t;
  }

  function renderLista() {
    var caixa = el["rot-lista"];
    caixa.innerHTML = "";
    var itens = est.itens.filter(passaNoFiltro);
    el["rot-vazio"].style.display = itens.length ? "none" : "";
    if (!itens.length) {
      el["rot-vazio"].textContent = est.itens.length
        ? "Nenhum roteiro bate com essa busca ou filtro."
        : "Nenhum roteiro ainda. Cole o link de um reel acima e clique em Transcrever.";
    }
    itens.forEach(function (i) { caixa.appendChild(montarCard(i)); });
  }

  function montarCapa(item) {
    var f = FONTES[item.fonte] || FONTES.manual;
    var capa = criar("div", "rot-capa");
    capa.style.setProperty("--rot-cor", f.cor);
    var embed = urlDeEmbed(item);
    if (!embed) {
      capa.appendChild(criar("span", "rot-capa-emoji", f.emoji));
      capa.appendChild(criar("span", "rot-capa-nome", f.rotulo));
      return capa;
    }
    var emoji = criar("span", "rot-capa-emoji", f.emoji);
    capa.appendChild(emoji);
    var urlCapa = capaDoItem(item);
    if (urlCapa) {
      // a capa de verdade; se não carregar (link vencido), fica o fundo colorido
      var foto = document.createElement("img");
      foto.className = "rot-capa-foto";
      foto.alt = "";
      foto.referrerPolicy = "no-referrer";
      foto.loading = "lazy";
      foto.addEventListener("load", function () { emoji.style.display = "none"; capa.classList.add("com-foto"); });
      foto.addEventListener("error", function () { foto.remove(); });
      foto.src = urlCapa;
      capa.appendChild(foto);
    }
    var b = criar("button", "rot-ver-video", "▶ ver vídeo");
    b.type = "button";
    b.addEventListener("click", function () {
      capa.innerHTML = "";
      capa.classList.add("tocando");
      var iframe = document.createElement("iframe");
      iframe.src = embed;
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.title = "Vídeo";
      capa.appendChild(iframe);
    });
    capa.appendChild(b);
    return capa;
  }

  function botaoCard(classe, texto, aoClicar) {
    var b = criar("button", classe, texto);
    b.type = "button";
    b.addEventListener("click", aoClicar);
    return b;
  }

  function montarCard(item) {
    var f = FONTES[item.fonte] || FONTES.manual;
    var card = criar("article", "rot-card");
    card.appendChild(montarCapa(item));

    var corpo = criar("div", "rot-corpo");
    var topo = criar("div", "rot-etiquetas");
    topo.appendChild(criar("span", "rot-etq " + (item.de_quem === "minha" ? "meu" : "outra"), item.de_quem === "minha" ? "Meu" : "De outra"));
    topo.appendChild(criar("span", "rot-etq fonte", f.emoji + " " + f.rotulo));
    if (typeof item.visualizacoes === "number") {
      var pv = criar("span", "rot-etq views", "👁 " + formatarViews(item.visualizacoes) + " visualizações");
      pv.title = item.visualizacoes.toLocaleString("pt-BR") + " visualizações";
      topo.appendChild(pv);
    }
    (item.tags || []).forEach(function (t) { topo.appendChild(criar("span", "rot-etq tag", "#" + t)); });
    corpo.appendChild(topo);

    corpo.appendChild(criar("h3", "rot-titulo", item.titulo || "Sem título"));
    var meta = [];
    if (item.perfil) meta.push("@" + item.perfil);
    var d = dataBr(item.postado_em || item.created_at);
    if (d) meta.push(d);
    if (meta.length) corpo.appendChild(criar("p", "rot-meta", meta.join("  ·  ")));

    var emAndamento = item.status === "processando";
    if (emAndamento) {
      var rel = criar("div", "rot-processando");
      rel.appendChild(criar("span", "rot-relogio", "⏳"));
      var ativo = !!est.rodando[item.id];
      rel.appendChild(criar("span", "", ativo ? "Ouvindo o vídeo agora. Pode deixar a aba aberta." : "Essa transcrição ficou pela metade (a aba foi fechada)."));
      corpo.appendChild(rel);
    } else if (item.status === "falhou") {
      var fal = criar("div", "rot-falhou");
      fal.appendChild(criar("span", "", "⚠️ " + (item.erro || "A transcrição não deu certo.")));
      corpo.appendChild(fal);
    } else {
      var texto = primeirasLinhas(item.transcricao);
      corpo.appendChild(criar("p", "rot-previa" + (texto ? "" : " vazio"), texto || "Sem texto ainda. Clique em Editar para escrever."));
    }

    var acoes = criar("div", "rot-acoes");
    if (emAndamento && !est.rodando[item.id]) {
      acoes.appendChild(botaoCard("rot-btn escuro", "🔄 Tentar de novo", function () { tentarDeNovo(item); }));
    }
    if (item.status === "falhou") {
      acoes.appendChild(botaoCard("rot-btn escuro", "🔄 Tentar de novo", function () { tentarDeNovo(item); }));
      acoes.appendChild(botaoCard("rot-btn", "Abrir mesmo assim", function () { abrirModal(item); }));
    }
    if (item.status === "pronto") {
      var bc = botaoCard("rot-btn", "📋 Copiar transcrição", function () {
        if (!item.transcricao) { U.toast("Esse roteiro ainda não tem texto.", true); return; }
        copiarTexto(item.transcricao);
        bc.textContent = "copiado ✓";
        clearTimeout(est.copiouTimers[item.id]);
        est.copiouTimers[item.id] = setTimeout(function () { bc.textContent = "📋 Copiar transcrição"; }, 1800);
      });
      acoes.appendChild(bc);
      acoes.appendChild(botaoCard("rot-btn", "✏️ Editar", function () { abrirModal(item); }));
    }
    if (item.status === "pronto" && item.url && FONTES[item.fonte] && item.fonte !== "manual") {
      var faltaAlgo = typeof item.visualizacoes !== "number" || !item.capa;
      var bd = botaoCard("rot-btn" + (faltaAlgo ? " destaque" : ""), "🔄 Atualizar dados", function () { atualizarDados(item, bd); });
      bd.title = "Busca a capa e as visualizações de agora (usa 1 crédito)";
      acoes.appendChild(bd);
    }
    if (item.url) {
      var ab = criar("a", "rot-btn", "↗ Abrir original");
      ab.href = item.url;
      ab.target = "_blank";
      ab.rel = "noopener";
      acoes.appendChild(ab);
    }
    if (!(emAndamento && est.rodando[item.id])) {
      acoes.appendChild(botaoCard("rot-btn perigo", "🗑️ Apagar", function () { apagar(item); }));
    }
    corpo.appendChild(acoes);

    card.appendChild(corpo);
    return card;
  }

  // Botão do card: busca de novo a capa e as visualizações (1 crédito) sem abrir a janela
  async function atualizarDados(item, botao) {
    if (est.ocupado) { U.toast("Espere a transcrição em andamento terminar.", true); return; }
    if (!est.chaveCarregada || !est.chave) await carregarChave();
    if (!est.chave) { U.toast("Falta a chave da Supadata. Cole no campo acima.", true); return; }
    est.ocupado = true;
    var rotulo = botao.textContent;
    botao.disabled = true;
    botao.textContent = "Buscando...";
    try {
      var meta = await buscarMetadados(item.url, est.chave);
      if (!meta) { U.toast("Não consegui buscar os dados desse vídeo agora. Tente de novo em instantes.", true); return; }
      var novo = camposVaziosDaMeta(item, meta);
      // a capa guardada por link (sem cópia) pode ter vencido: troca por uma nova
      if (meta.capa && (!item.capa || item.capa.indexOf("data:") !== 0)) novo.capa = meta.capa;
      var cats = classificar(Object.assign({}, item, novo));
      if (cats.length) novo.tags = uniaoDeTags(novo.tags || item.tags, cats);
      if (!Object.keys(novo).length) { U.toast("Não achei nada novo para este vídeo."); return; }
      novo.updated_at = agoraISO();
      var r = await gravarLinha(item.id, novo);
      if (r.error) return;
      U.toast("Dados atualizados.");
      await carregarLista();
      setTimeout(carregarSaldo, 1500);
    } finally {
      est.ocupado = false;
      if (botao.isConnected) { botao.disabled = false; botao.textContent = rotulo; }
    }
  }

  async function apagar(item) {
    if (!window.confirm("Apagar este roteiro? Não dá para desfazer.")) return;
    var r = await U.consulta("roteiros", cliente().from("roteiros").delete().eq("id", item.id));
    if (r.error) return;
    U.toast("Roteiro apagado.");
    await carregarLista();
  }

  /* ---------------------------------------------------------------------
     JANELA DE EDIÇÃO
     --------------------------------------------------------------------- */
  function abrirModal(item, aviso) {
    est.editando = item || null;
    var i = item || { de_quem: "outra", tags: [] };
    el["rm-titulo-modal"].textContent = item ? "Editar roteiro" : "Escrever na mão";
    el["rm-titulo"].value = i.titulo || "";
    el["rm-dequem"].value = i.de_quem === "minha" ? "minha" : "outra";
    el["rm-perfil"].value = i.perfil ? "@" + i.perfil : "";
    el["rm-link"].value = i.url || "";
    el["rm-data"].value = i.postado_em || "";
    el["rm-tags"].value = (i.tags || []).join(", ");
    el["rm-legenda"].value = i.legenda || "";
    el["rm-transcricao"].value = i.transcricao || "";
    el["rm-obs"].value = i.obs || "";
    est.capaModal = i.capa || "";
    el["rm-views"].value = typeof i.visualizacoes === "number" ? i.visualizacoes : "";
    el["rm-aviso"].style.display = aviso ? "" : "none";
    el["rm-aviso"].textContent = aviso || "";
    atualizarContagem();
    U.abrirModal("modal-roteiro");
  }

  function atualizarContagem() {
    var t = el["rm-transcricao"].value.trim();
    var n = t ? t.split(/\s+/).length : 0;
    el["rm-contagem"].textContent = n ? n.toLocaleString("pt-BR") + " palavras" : "";
  }

  // Botão da janela: preenche o que está vazio usando só o link (gasta 1 crédito)
  async function preencherPeloLink() {
    var link = limparLink(el["rm-link"].value);
    if (!/^https?:\/\//i.test(link) || !descobrirFonte(link)) { U.toast("Cole um link do Instagram, TikTok ou YouTube.", true); return; }
    if (!est.chaveCarregada || !est.chave) await carregarChave();
    if (!est.chave) { U.toast("Falta a chave da Supadata. Cole na aba Roteiros.", true); return; }
    var b = el["rm-buscar-dados"];
    b.disabled = true;
    b.textContent = "Buscando...";
    var meta = await buscarMetadados(link, est.chave);
    b.disabled = false;
    b.textContent = "✨ Preencher pelo link";
    if (!meta) { U.toast("Não consegui buscar os dados desse link agora.", true); return; }
    var atual = {
      titulo: el["rm-titulo"].value.trim(), perfil: el["rm-perfil"].value.trim(), postado_em: el["rm-data"].value,
      tags: el["rm-tags"].value.trim() ? ["x"] : [], legenda: el["rm-legenda"].value.trim(), capa: est.capaModal
    };
    var novo = camposVaziosDaMeta(atual, meta);
    if (novo.titulo) el["rm-titulo"].value = novo.titulo;
    if (novo.perfil) el["rm-perfil"].value = "@" + novo.perfil;
    if (novo.postado_em) el["rm-data"].value = novo.postado_em;
    if (novo.tags) el["rm-tags"].value = novo.tags.join(", ");
    if (novo.legenda) el["rm-legenda"].value = novo.legenda;
    // categorias (Restaurantes SP, Viagens, Passeios, Lojas) pelo que já está nos campos
    var tagsAgora = [];
    el["rm-tags"].value.split(",").forEach(function (t) { var x = t.trim().replace(/^#/, ""); if (x) tagsAgora.push(x); });
    var catsModal = classificar({
      titulo: el["rm-titulo"].value, legenda: el["rm-legenda"].value, tags: tagsAgora, transcricao: el["rm-transcricao"].value
    });
    if (catsModal.length) {
      var antes = el["rm-tags"].value;
      el["rm-tags"].value = uniaoDeTags(tagsAgora, catsModal).join(", ");
      if (el["rm-tags"].value !== antes) novo.tags = true;
    }
    if (novo.capa) est.capaModal = novo.capa;
    if (typeof novo.visualizacoes === "number") el["rm-views"].value = novo.visualizacoes;
    U.toast(Object.keys(novo).length ? "Campos vazios preenchidos." : "Não achei nada novo para preencher.");
    setTimeout(carregarSaldo, 1500);
  }

  async function salvarModal() {
    var link = limparLink(el["rm-link"].value);
    if (link && !/^https?:\/\//i.test(link)) { U.toast("O link precisa começar com http.", true); el["rm-link"].focus(); return; }
    var fonte = link ? (descobrirFonte(link) || "manual") : "manual";
    if (est.editando && est.editando.fonte && !link) fonte = est.editando.fonte;
    var tags = [];
    el["rm-tags"].value.split(",").forEach(function (t) {
      var x = t.trim().replace(/^#/, "");
      if (x && tags.indexOf(x) < 0) tags.push(x);
    });
    var dados = {
      titulo: el["rm-titulo"].value.trim() || null,
      de_quem: el["rm-dequem"].value === "minha" ? "minha" : "outra",
      perfil: el["rm-perfil"].value.trim().replace(/^@/, "") || null,
      url: link || null,
      fonte: fonte,
      postado_em: el["rm-data"].value || null,
      tags: tags,
      legenda: el["rm-legenda"].value.trim() || null,
      transcricao: el["rm-transcricao"].value.trim() || null,
      obs: el["rm-obs"].value.trim() || null,
      status: "pronto",
      erro: null,
      updated_at: agoraISO()
    };
    dados.capa = est.capaModal || null;
    var vtxt = el["rm-views"].value.trim();
    dados.visualizacoes = vtxt !== "" && !isNaN(Number(vtxt)) ? Math.max(0, Math.round(Number(vtxt))) : null;
    var r;
    if (est.editando) {
      r = await gravarLinha(est.editando.id, dados);
    } else {
      r = await cliente().from("roteiros").insert(dados).select().single();
      if (r.error && (r.error.code === "42703" || r.error.code === "PGRST204")) {
        delete dados.capa;
        delete dados.visualizacoes;
        r = await cliente().from("roteiros").insert(dados).select().single();
      }
      if (r.error) { console.error(r.error); U.toast("Não consegui salvar. Confira se o SQL foi rodado.", true); }
    }
    if (r.error) return;
    U.fecharModal("modal-roteiro");
    U.toast("Roteiro salvo.");
    await carregarLista();
  }

  /* ---------------------------------------------------------------------
     ESTUDAR COM O CLAUDE
     --------------------------------------------------------------------- */
  async function estudar() {
    var outras = est.itens.filter(function (i) { return i.de_quem !== "minha" && i.status === "pronto" && i.transcricao; }).slice(0, 10);
    if (!outras.length) {
      U.toast("Guarde antes alguns roteiros \"De outra\" para eu montar o pedido.", true);
      return;
    }
    var partes = [];
    partes.push("Quero estudar roteiros de vídeos curtos de outras criadoras para melhorar os meus. Abaixo " + (outras.length === 1 ? "está 1 transcrição." : "estão " + outras.length + " transcrições."));
    partes.push("");
    outras.forEach(function (i, n) {
      partes.push("--- Roteiro " + (n + 1) + (i.perfil ? " (@" + i.perfil + ")" : "") + " ---");
      partes.push(i.transcricao);
      partes.push("");
    });
    partes.push("Com base nesses roteiros, me responda em português do Brasil, de forma simples:");
    partes.push("1. Quais assuntos estão em alta aqui.");
    partes.push("2. Quais expressões e palavras estão prendendo a atenção.");
    partes.push("3. Quais padrões de gancho aparecem, com um exemplo real de cada um tirado dos textos acima.");
    partes.push("4. Escreva 5 roteiros novos no MEU assunto, reaproveitando a estrutura (e não o conteúdo) dos que estudamos. O tom deve soar natural, de pessoa falando, sem ficar robotizado.");
    await copiarTexto(partes.join("\n"));
    U.toast("Pedido copiado com " + outras.length + " roteiros. Cole no Claude.");
  }

  /* ---------------------------------------------------------------------
     INÍCIO
     --------------------------------------------------------------------- */
  async function iniciar() {
    [
      "rot-link", "rot-dequem", "rot-transcrever", "rot-escrever", "rot-aviso", "rot-estudar",
      "rot-chave-card", "rot-chave-rotulo", "rot-chave", "rot-salvar-chave", "rot-remover-chave", "rot-chave-estado",
      "rot-saldo", "rot-saldo-atualizar", "rot-como-chave", "rot-busca", "rot-filtros", "rot-lista", "rot-vazio", "rot-sem-tabela",
      "rm-titulo-modal", "rm-titulo", "rm-dequem", "rm-perfil", "rm-link", "rm-data", "rm-tags", "rm-legenda",
      "rm-transcricao", "rm-contagem", "rm-obs", "rm-aviso", "rm-salvar", "rm-buscar-dados", "rm-views"
    ].forEach(function (id) { el[id] = $(id); });
    el["rm-buscar-dados"].addEventListener("click", preencherPeloLink);

    el["rot-transcrever"].addEventListener("click", aoClicarTranscrever);
    el["rot-link"].addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); aoClicarTranscrever(); } });
    el["rot-escrever"].addEventListener("click", function () { abrirModal(null); });
    el["rot-estudar"].addEventListener("click", estudar);
    el["rot-salvar-chave"].addEventListener("click", salvarChave);
    el["rot-chave"].addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); salvarChave(); } });
    el["rot-remover-chave"].addEventListener("click", removerChave);
    el["rot-saldo-atualizar"].addEventListener("click", carregarSaldo);
    el["rot-busca"].addEventListener("input", U.debounce(function () {
      est.busca = semAcento(el["rot-busca"].value.trim());
      renderLista();
    }, 150));
    el["rm-transcricao"].addEventListener("input", atualizarContagem);
    el["rm-salvar"].addEventListener("click", salvarModal);

    await carregarChave();
    desenharChave();
    await carregarLista();
    organizarAntigos();
    carregarSaldo();
  }
})();
