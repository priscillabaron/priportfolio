/* Lista de nichos e peças de tela compartilhadas entre a home (index.html)
   e as páginas de cada nicho (nichos/<nome>/index.html). */
(function () {
  "use strict";

  // Os nichos aparecem nesta ordem. Cada vídeo entra no nicho que tiver o mesmo nome
  // no campo "nicho" do painel (acento, maiúscula e "&" ou "e" não importam).
  const lista = [
    "Casa & Decoração", "Beleza", "Tech & Apps", "Alimentação e Suplementação",
    "Moda & Acessórios", "Viagem", "Passeios em Família", "Clips & TikTok Shop",
    "Gastronomia", "Lojas e Mercados", "Datas Especiais"
  ];
  const FUNDOS_CARTAO =["#E8E1DA", "#E2E8EC", "#EEE4DE", "#E5E3E6"];

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

    // por cima do vídeo não vai nome de marca nem "destaque": o nome fica embaixo do card
    if (emBreve) {
      const chips = document.createElement("div");
      chips.className = "vitrine-chips";
      chips.appendChild(criarTexto("span", "vitrine-chip", Idiomas.t("nichos.emBreve")));
      capa.appendChild(chips);
    }

    if (emBreve) {
      capa.appendChild(criarTexto("span", "vitrine-marca-dagua", "p.b."));
    } else if (!rodaAqui) {
      // vídeo que abre em outra aba mantém o botão de play; o que roda aqui não precisa (toca ao passar o mouse)
      const play = document.createElement("span");
      play.className = "vitrine-play";
      play.setAttribute("aria-hidden", "true");
      capa.appendChild(play);
    }
    // Só o nicho, pequeno, por cima do vídeo (embaixo). O nome da marca e do produto fica embaixo do card.
    if (!emBreve && video.nicho) {
      const info = document.createElement("div");
      info.className = "vitrine-info";
      info.appendChild(criarTexto("span", "vitrine-info-nicho", nome(String(video.nicho).trim())));
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

  window.Nichos = { lista: lista, chave: chave, slug: slug, descricao: descricao, nome: nome, criarTexto: criarTexto, montarTitulo: montarTitulo, montarCartao: montarCartao };
})();
