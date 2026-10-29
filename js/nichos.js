/* Lista de nichos e peças de tela compartilhadas entre a home (index.html)
   e as páginas de cada nicho (nichos/<nome>/index.html). */
(function () {
  "use strict";

  // Os nichos aparecem nesta ordem. Cada vídeo entra no nicho que tiver o mesmo nome
  // no campo "nicho" do painel (acento, maiúscula e "&" ou "e" não importam).
  const lista = [
    "Casa & Decoração", "Beleza", "Tech & Apps", "Alimentação e Suplementação",
    "Moda & Acessórios", "Viagens e Passeios", "Gastronomia", "Lojas e Mercados",
    "Clips & TikTok Shop"
  ];
  const FUNDOS_CARTAO =["#E8E1DA", "#E2E8EC", "#EEE4DE", "#E5E3E6"];
  const MOSTRAR_MARCA_NO_CARD = true; // marca em cima e embaixo do vídeo (vem do campo "marca" de cada vídeo no painel)

  function chave(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " e ").replace(/\s+/g, " ").trim();
  }

  // Nome usado na pasta da página do nicho, ex.: "Casa & Decoração" vira "casa-e-decoracao".
  function slug(nome) {
    return chave(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function criarTexto(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    el.textContent = texto;
    return el;
  }

  // Tudo menos a última palavra fica em azul; a última vai em ameixa itálico.
  // Se for uma palavra só, ela inteira fica em azul.
  function montarTitulo(nome, tag) {
    const h = document.createElement(tag || "h3");
    h.className = "vitrine-titulo";
    const palavras = nome.trim().split(/\s+/);
    if (palavras.length === 1) {
      h.appendChild(criarTexto("span", "vitrine-azul", palavras[0]));
      return h;
    }
    h.appendChild(criarTexto("span", "vitrine-azul", palavras.slice(0, -1).join(" ")));
    h.appendChild(document.createTextNode(" "));
    h.appendChild(criarTexto("em", "vitrine-ameixa", palavras[palavras.length - 1]));
    return h;
  }

  function montarCartao(video, indice, emBreve) {
    const temLink = !emBreve && video.link && video.link !== "#";
    // Vídeo do YouTube roda aqui mesmo (sem abrir o YouTube); outros links abrem em outra aba.
    const rodaAqui = temLink && window.PlayerVideo && PlayerVideo.idDoVideo(video.link);
    const cartao = document.createElement("article");
    cartao.className = "vitrine-cartao";

    const capa = document.createElement(temLink && !rodaAqui ? "a" : "div");
    capa.className = "vitrine-capa";
    capa.style.background = FUNDOS_CARTAO[indice % FUNDOS_CARTAO.length];
    if (temLink && !rodaAqui) {
      capa.href = video.link;
      capa.target = "_blank";
      capa.rel = "noopener";
      capa.setAttribute("aria-label", Idiomas.t("destaques.assistir", { t: video.titulo }));
    }

    // No topo: tag branca com a marca e, só se houver um número real (campo "metrica"), uma segunda tag escura.
    // Para tirar a marca de cima dos vídeos, troque MOSTRAR_MARCA_NO_CARD por false.
    const chips = document.createElement("div");
    chips.className = "vitrine-chips";
    if (emBreve) chips.appendChild(criarTexto("span", "vitrine-chip", Idiomas.t("nichos.emBreve")));
    if (!emBreve && MOSTRAR_MARCA_NO_CARD && video.marca) chips.appendChild(criarTexto("span", "vitrine-chip", video.marca));
    if (!emBreve && video.metrica) chips.appendChild(criarTexto("span", "vitrine-chip vitrine-chip-destaque", video.metrica));
    if (chips.children.length) capa.appendChild(chips);

    if (emBreve) {
      capa.appendChild(criarTexto("span", "vitrine-marca-dagua", "p.b."));
    } else if (!rodaAqui) {
      // vídeo que abre em outra aba mantém o botão de play; o que roda aqui não precisa (toca ao passar o mouse)
      const play = document.createElement("span");
      play.className = "vitrine-play";
      play.setAttribute("aria-hidden", "true");
      capa.appendChild(play);
    }
    // Rodapé do card, sobre um degradê escuro: a marca em negrito e o formato em texto pequeno (o nicho já está no título da linha).
    if (!emBreve && ((MOSTRAR_MARCA_NO_CARD && video.marca) || video.tipo)) {
      const info = document.createElement("div");
      info.className = "vitrine-info";
      if (MOSTRAR_MARCA_NO_CARD && video.marca) info.appendChild(criarTexto("span", "vitrine-info-marca", video.marca));
      if (video.tipo) info.appendChild(criarTexto("span", "vitrine-info-tipo", formato(video.tipo)));
      capa.appendChild(info);
    }
    if (rodaAqui) PlayerVideo.anexar(capa, video.link, { titulo: video.titulo });
    cartao.appendChild(capa);

    const legenda = document.createElement("div");
    legenda.className = "vitrine-legenda";
    legenda.appendChild(criarTexto("span", "vitrine-legenda-titulo", video.titulo));
    cartao.appendChild(legenda);
    return cartao;
  }

  // Nome e frase do nicho no idioma atual (as traduções ficam em js/idiomas.js).
  // O nome em português continua sendo a "chave" que liga o vídeo ao nicho no painel.
  function nome(nomePt) {
    const k = "nicho." + slug(nomePt) + ".nome";
    return Idiomas.existe(k) ? Idiomas.t(k) : nomePt;
  }
  function descricao(nomePt) {
    const k = "nicho." + slug(nomePt) + ".desc";
    return Idiomas.existe(k) ? Idiomas.t(k) : "";
  }
  // Formato do vídeo (Unboxing, Testemunho...) no idioma atual; se não tiver tradução, aparece como foi escrito no painel.
  function formato(nomePt) {
    const k = "formato." + slug(nomePt);
    return Idiomas.existe(k) ? Idiomas.t(k) : nomePt;
  }

  window.Nichos = { lista: lista, chave: chave, slug: slug, descricao: descricao, nome: nome, formato: formato, criarTexto: criarTexto, montarTitulo: montarTitulo, montarCartao: montarCartao };
})();
