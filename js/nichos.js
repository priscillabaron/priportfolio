/* Lista de nichos e peças de tela compartilhadas entre a home (index.html)
   e as páginas de cada nicho (nichos/<nome>/index.html). */
(function () {
  "use strict";

  // Os nichos aparecem nesta ordem. Cada vídeo entra no nicho que tiver o mesmo nome
  // no campo "nicho" do painel (acento, maiúscula e "&" ou "e" não importam).
  const lista = [
    "Casa & Decoração", "Gastronomia", "Saúde e Fitness", "Beleza & Autocuidado",
    "Moda & Acessórios", "Lojas & Supermercados", "Conteúdos em Família",
    "Datas Especiais", "Viagem & Passeios", "Restaurantes & Cafeterias"
  ];
  // Frase curta em itálico embaixo do título de cada nicho. Pode editar à vontade.
  const descricoes = {
    "casa e decoracao": "Ambientes, organização e achadinhos para a casa",
    "gastronomia": "Receitas, produtos e sabores que dão água na boca",
    "saude e fitness": "Treino, bem-estar e rotina saudável",
    "beleza e autocuidado": "Skincare, cabelo e momentos de cuidado",
    "moda e acessorios": "Looks, peças e acessórios na vida real",
    "lojas e supermercados": "Compras do dia a dia e achados de loja",
    "conteudos em familia": "Rotina, filhos e momentos em família",
    "datas especiais": "Natal, Dia das Mães e outras datas que vendem",
    "viagem e passeios": "Destinos, roteiros e experiências para viver",
    "restaurantes e cafeterias": "Lugares para comer, beber e voltar sempre"
  };
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
    const cartao = document.createElement("article");
    cartao.className = "vitrine-cartao";

    const capa = document.createElement(temLink ? "a" : "div");
    capa.className = "vitrine-capa";
    capa.style.background = FUNDOS_CARTAO[indice % FUNDOS_CARTAO.length];
    if (temLink) {
      capa.href = video.link;
      capa.target = "_blank";
      capa.rel = "noopener";
      capa.setAttribute("aria-label", video.titulo + ", assistir vídeo");
    }

    const chips = document.createElement("div");
    chips.className = "vitrine-chips";
    if (emBreve) chips.appendChild(criarTexto("span", "vitrine-chip", "Em breve"));
    if (video.marca) chips.appendChild(criarTexto("span", "vitrine-chip", video.marca));
    if (video.destaque) chips.appendChild(criarTexto("span", "vitrine-chip vitrine-chip-destaque", video.destaque));
    capa.appendChild(chips);

    if (emBreve) {
      capa.appendChild(criarTexto("span", "vitrine-marca-dagua", "p.b."));
    } else {
      const play = document.createElement("span");
      play.className = "vitrine-play";
      play.setAttribute("aria-hidden", "true");
      capa.appendChild(play);
    }
    cartao.appendChild(capa);

    const legenda = document.createElement("div");
    legenda.className = "vitrine-legenda";
    legenda.appendChild(criarTexto("span", "vitrine-legenda-titulo", video.titulo));
    legenda.appendChild(criarTexto("span", "vitrine-legenda-formato", video.formato || "9:16"));
    cartao.appendChild(legenda);
    return cartao;
  }

  function descricao(nome) {
    return descricoes[chave(nome)] || "";
  }

  window.Nichos = { lista: lista, chave: chave, slug: slug, descricao: descricao, criarTexto: criarTexto, montarTitulo: montarTitulo, montarCartao: montarCartao };
})();
