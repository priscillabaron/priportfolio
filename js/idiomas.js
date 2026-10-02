/* Idiomas do portfólio: português, inglês e espanhol.
   Para editar um texto, procure a linha dele abaixo: cada linha tem [português, inglês, espanhol].
   No HTML, os textos usam data-i18n="chave" (texto simples), data-i18n-html="chave" (texto com
   <em> ou <strong>) e data-i18n-attr="atributo:chave" (ex.: aria-label). */
(function () {
  "use strict";

  const CODIGOS = ["pt", "en", "es"];
  const HTML_LANG = { pt: "pt-BR", en: "en", es: "es" };

  const LINHAS = {
    /* ---- Página ---- */
    "meta.titulo": ["Priscilla Baron | Portfólio UGC Creator", "Priscilla Baron | UGC Creator Portfolio", "Priscilla Baron | Portafolio de UGC Creator"],
    "meta.descricao": [
      "Portfólio de Priscilla Baron, UGC Creator: vídeos autênticos, cortes para anúncio e conteúdo de marca, com roteiro aprovado antes de gravar e entrega em até 72h úteis.",
      "Portfolio of Priscilla Baron, UGC Creator: authentic videos, ad cuts and branded content, with the script approved before filming and delivery within 72 business hours.",
      "Portafolio de Priscilla Baron, UGC Creator: videos auténticos, cortes para anuncios y contenido de marca, con guion aprobado antes de grabar y entrega en hasta 72 h hábiles."
    ],
    "pular": ["Pular para o conteúdo", "Skip to content", "Ir al contenido"],
    "faixa.entrega": [
      "🚚 Entrega em até <strong>72h úteis</strong> após aprovação do roteiro",
      "🚚 Delivery within <strong>72 business hours</strong> after script approval",
      "🚚 Entrega en hasta <strong>72 h hábiles</strong> tras la aprobación del guion"
    ],

    /* ---- Menu ---- */
    "nav.aria": ["Menu principal", "Main menu", "Menú principal"],
    "logo.aria": ["Priscilla Baron, ir para o topo", "Priscilla Baron, back to top", "Priscilla Baron, ir al inicio"],
    "menu.abrir": ["Abrir menu", "Open menu", "Abrir menú"],
    "menu.fechar": ["Fechar menu", "Close menu", "Cerrar menú"],
    "nav.sobre": ["Sobre", "About", "Sobre mí"],
    "nav.destaques": ["Destaques", "Highlights", "Destacados"],
    "nav.trabalhos": ["Trabalhos", "Work", "Trabajos"],
    "nav.servicos": ["Serviços", "Services", "Servicios"],
    "nav.numeros": ["Números", "Numbers", "Números"],
    "nav.cta": ["Trabalhe comigo", "Work with me", "Trabaja conmigo"],
    "idioma.aria": ["Idioma", "Language", "Idioma"],

    /* ---- Capa ---- */
    "hero.aria": ["Apresentação", "Introduction", "Presentación"],
    "hero.tagline": [
      "Crio vídeos autênticos que fazem a sua marca conversar de verdade com quem realmente compra, do roteiro à entrega.",
      "I create authentic videos that help your brand truly connect with the people who actually buy, from script to delivery.",
      "Creo videos auténticos que hacen que tu marca conecte de verdad con quienes realmente compran, del guion a la entrega."
    ],
    "hero.falar": ["Falar comigo", "Talk to me", "Hablemos"],
    "hero.ver": ["Ver os trabalhos", "See my work", "Ver mis trabajos"],
    "hero.foto.aria": ["Foto da creator Priscilla Baron, formato retrato 4:5", "Photo of creator Priscilla Baron, 4:5 portrait format", "Foto de la creadora Priscilla Baron, formato retrato 4:5"],
    "hero.foto.texto": ["Foto da creator, 4:5", "Creator photo, 4:5", "Foto de la creadora, 4:5"],
    "hero.selo": ["sob consulta", "on request", "a consultar"],
    "hero.numeros.aria": ["Resumo em números", "Summary in numbers", "Resumen en números"],
    "marcas.aria": ["Marcas que já atendi", "Brands I have worked with", "Marcas con las que he trabajado"],
    "marcas.legenda": ["Marcas que confiam no meu trabalho", "Brands that trust my work", "Marcas que confían en mi trabajo"],

    /* ---- Sobre ---- */
    "sobre.foto.aria": ["Foto de bastidores de Priscilla Baron, formato 3:4", "Behind-the-scenes photo of Priscilla Baron, 3:4 format", "Foto del detrás de cámaras de Priscilla Baron, formato 3:4"],
    "sobre.foto.texto": ["Foto de bastidores, 3:4", "Behind the scenes, 3:4", "Detrás de cámaras, 3:4"],
    "sobre.eyebrow": ["Sobre mim", "About me", "Sobre mí"],
    "sobre.titulo": [
      "Quem grava é gente, não <em>roteiro pronto</em>",
      "The person on camera is real, not a <em>canned script</em>",
      "Quien graba es una persona, no un <em>guion enlatado</em>"
    ],
    "sobre.p1": [
      "Oi, eu sou a Priscilla! Trabalho criando conteúdo autêntico para marcas que querem se conectar de verdade com quem assiste, sem parecer propaganda. Gosto de entender o produto, testar de verdade e contar isso de um jeito que faz sentido pra quem está do outro lado da tela.",
      "Hi, I'm Priscilla! I create authentic content for brands that want to truly connect with their audience, without feeling like an ad. I like to understand the product, really try it, and tell the story in a way that makes sense to the person on the other side of the screen.",
      "¡Hola, soy Priscilla! Creo contenido auténtico para marcas que quieren conectar de verdad con quien las mira, sin que parezca publicidad. Me gusta entender el producto, probarlo de verdad y contarlo de una forma que tenga sentido para quien está al otro lado de la pantalla."
    ],
    "sobre.p2": [
      "Cada entrega passa por um processo simples e transparente, pensado pra sua marca ter previsibilidade do início ao fim.",
      "Every delivery follows a simple, transparent process, designed so your brand can count on predictability from start to finish.",
      "Cada entrega sigue un proceso simple y transparente, pensado para que tu marca tenga previsibilidad de principio a fin."
    ],
    "sobre.promessa1": ["Roteiro aprovado antes de gravar", "Script approved before filming", "Guion aprobado antes de grabar"],
    "sobre.promessa2": ["Uma rodada de ajuste inclusa", "One round of revisions included", "Una ronda de ajustes incluida"],
    "sobre.promessa3": ["Entrega em até 72 horas úteis", "Delivery within 72 business hours", "Entrega en hasta 72 horas hábiles"],

    /* ---- Destaques ---- */
    "destaques.eyebrow": ["Portfólio", "Portfolio", "Portafolio"],
    "destaques.titulo": ["Conteúdos de <em>destaque</em>", "Featured <em>content</em>", "Contenidos <em>destacados</em>"],
    "destaques.texto": [
      "Os vídeos que mais representam o meu trabalho e os resultados que já entreguei.",
      "The videos that best represent my work and the results I have delivered.",
      "Los videos que mejor representan mi trabajo y los resultados que he entregado."
    ],
    "destaques.assistir": ["{t}, assistir vídeo", "{t}, watch video", "{t}, ver video"],
    "destaques.slide": ["Vídeo {i} de {n}", "Video {i} of {n}", "Video {i} de {n}"],
    "destaques.carrossel": ["Vídeos em destaque", "Featured videos", "Videos destacados"],
    "destaques.anterior": ["Vídeo anterior", "Previous video", "Video anterior"],
    "destaques.proximo": ["Próximo vídeo", "Next video", "Próximo video"],
    /* ---- Vitrine de nichos ---- */
    "nichos.eyebrow": ["Vitrine", "Showcase", "Vitrina"],
    "nichos.titulo": ["Meus <em>nichos</em>", "My <em>niches</em>", "Mis <em>nichos</em>"],
    "nichos.intro": [
      "Conteúdos que já criei, separados por nicho. Escolha um nicho nos botões ou role para ver todos. Use as setas ou arraste para ver mais.",
      "Content I have created, organized by niche. Pick a niche with the buttons or scroll to see them all. Use the arrows or swipe to see more.",
      "Contenido que ya he creado, separado por nicho. Elige un nicho en los botones o desplázate para verlos todos. Usa las flechas o desliza para ver más."
    ],
    "nichos.nav": ["Ir para um nicho", "Jump to a niche", "Ir a un nicho"],
    "nichos.regiao": ["Nicho: {n}", "Niche: {n}", "Nicho: {n}"],
    "nichos.faixa": ["Vídeos de {n}", "Videos in {n}", "Videos de {n}"],
    "nichos.anterior": ["Vídeos anteriores de {n}", "Previous videos in {n}", "Videos anteriores de {n}"],
    "nichos.proximo": ["Próximos vídeos de {n}", "Next videos in {n}", "Próximos videos de {n}"],
    "nichos.emBreve": ["Em breve", "Coming soon", "Próximamente"],
    "nichos.videoEmBreve": ["Vídeo em breve", "Video coming soon", "Video próximamente"],
    "nichos.outros": ["Outros", "Others", "Otros"],

    "nicho.casa-e-decoracao.nome": ["Casa & Decoração", "Home & Decor", "Casa y Decoración"],
    "nicho.gastronomia.nome": ["Gastronomia", "Gastronomy", "Gastronomía"],
    "nicho.saude-e-fitness.nome": ["Saúde e Fitness", "Health & Fitness", "Salud y Fitness"],
    "nicho.beleza-e-autocuidado.nome": ["Beleza & Autocuidado", "Beauty & Self-care", "Belleza y Autocuidado"],
    "nicho.moda-e-acessorios.nome": ["Moda & Acessórios", "Fashion & Accessories", "Moda y Accesorios"],
    "nicho.lojas-e-supermercados.nome": ["Lojas & Supermercados", "Stores & Supermarkets", "Tiendas y Supermercados"],
    "nicho.conteudos-em-familia.nome": ["Conteúdos em Família", "Family Content", "Contenido en Familia"],
    "nicho.datas-especiais.nome": ["Datas Especiais", "Special Occasions", "Fechas Especiales"],
    "nicho.viagem-e-passeios.nome": ["Viagem & Passeios", "Travel & Getaways", "Viajes y Paseos"],
    "nicho.restaurantes-e-cafeterias.nome": ["Restaurantes & Cafeterias", "Restaurants & Cafés", "Restaurantes y Cafeterías"],

    "nicho.casa-e-decoracao.desc": ["Ambientes, organização e achadinhos para a casa", "Rooms, organization and finds for the home", "Ambientes, organización y hallazgos para la casa"],
    "nicho.gastronomia.desc": ["Receitas, produtos e sabores que dão água na boca", "Recipes, products and flavors that make your mouth water", "Recetas, productos y sabores que se te hacen agua la boca"],
    "nicho.saude-e-fitness.desc": ["Treino, bem-estar e rotina saudável", "Workouts, wellbeing and a healthy routine", "Entrenamiento, bienestar y rutina saludable"],
    "nicho.beleza-e-autocuidado.desc": ["Skincare, cabelo e momentos de cuidado", "Skincare, hair and self-care moments", "Skincare, cabello y momentos de cuidado personal"],
    "nicho.moda-e-acessorios.desc": ["Looks, peças e acessórios na vida real", "Looks, pieces and accessories in real life", "Looks, prendas y accesorios en la vida real"],
    "nicho.lojas-e-supermercados.desc": ["Compras do dia a dia e achados de loja", "Everyday shopping and store finds", "Compras del día a día y hallazgos de tienda"],
    "nicho.conteudos-em-familia.desc": ["Rotina, filhos e momentos em família", "Routine, kids and family moments", "Rutina, hijos y momentos en familia"],
    "nicho.datas-especiais.desc": ["Natal, Dia das Mães e outras datas que vendem", "Christmas, Mother's Day and other dates that sell", "Navidad, Día de las Madres y otras fechas que venden"],
    "nicho.viagem-e-passeios.desc": ["Destinos, roteiros e experiências para viver", "Destinations, itineraries and experiences to live", "Destinos, itinerarios y experiencias para vivir"],
    "nicho.restaurantes-e-cafeterias.desc": ["Lugares para comer, beber e voltar sempre", "Places to eat, drink and come back to", "Lugares para comer, beber y volver siempre"],

    /* ---- Serviços ---- */
    "servicos.eyebrow": ["Serviços", "Services", "Servicios"],
    "servicos.titulo": ["Como eu te <em>ajudo</em>", "How I can <em>help</em>", "Cómo te <em>ayudo</em>"],
    "servicos.texto": [
      "Formatos prontos pra encaixar na sua estratégia de conteúdo.",
      "Ready-made formats to fit into your content strategy.",
      "Formatos listos para encajar en tu estrategia de contenido."
    ],
    "servico.1.titulo": ["Vídeo UGC", "UGC video", "Video UGC"],
    "servico.1.desc": [
      "Vídeo autêntico, roteirizado e gravado como um conteúdo real de rede social.",
      "Authentic video, scripted and shot like real social media content.",
      "Video auténtico, con guion y grabado como un contenido real de redes sociales."
    ],
    "servico.2.titulo": ["Corte para anúncio", "Ad cut", "Corte para anuncio"],
    "servico.2.desc": [
      "Edição pensada para performance em tráfego pago, com gancho nos primeiros segundos.",
      "Editing designed for paid-traffic performance, with a hook in the first seconds.",
      "Edición pensada para el rendimiento en tráfico pago, con gancho en los primeros segundos."
    ],
    "servico.3.titulo": ["Fotos do produto", "Product photos", "Fotos del producto"],
    "servico.3.desc": [
      "Imagens estáticas com boa luz e composição para loja, anúncio ou site.",
      "Still images with good light and composition for stores, ads or websites.",
      "Imágenes estáticas con buena luz y composición para tienda, anuncio o sitio web."
    ],
    "servico.4.titulo": ["Unboxing", "Unboxing", "Unboxing"],
    "servico.4.desc": [
      "Abertura e primeira impressão real do produto, do jeito que o público gosta de ver.",
      "Opening and real first impression of the product, the way audiences like to see it.",
      "Apertura y primera impresión real del producto, como le gusta ver al público."
    ],
    "servico.5.titulo": ["Publicação no meu perfil", "Post on my profile", "Publicación en mi perfil"],
    "servico.5.desc": [
      "O conteúdo é publicado no meu Instagram, gerando alcance orgânico para a marca.",
      "The content is posted on my Instagram, generating organic reach for the brand.",
      "El contenido se publica en mi Instagram y genera alcance orgánico para la marca."
    ],
    "servico.6.titulo": ["Pacote mensal", "Monthly package", "Paquete mensual"],
    "servico.6.desc": [
      "Combinação de formatos entregues todo mês, com previsibilidade de calendário.",
      "A mix of formats delivered every month, with a predictable calendar.",
      "Una combinación de formatos entregados cada mes, con calendario previsible."
    ],

    /* ---- Números e depoimentos ---- */
    "numeros.eyebrow": ["Prova", "Proof", "Prueba"],
    "numeros.titulo": ["Números e <em>depoimentos</em>", "Numbers and <em>testimonials</em>", "Números y <em>testimonios</em>"],
    "numeros.texto": [
      "O que os números mostram e o que as marcas dizem sobre trabalhar comigo.",
      "What the numbers show and what brands say about working with me.",
      "Lo que muestran los números y lo que dicen las marcas sobre trabajar conmigo."
    ],
    "metrica.videos": ["vídeos entregues", "videos delivered", "videos entregados"],
    "metrica.marcas": ["marcas atendidas", "brands served", "marcas atendidas"],
    "metrica.views": ["views somadas", "combined views", "vistas acumuladas"],
    "metrica.extra": ["TROQUE ESTE RÓTULO", "CHANGE THIS LABEL", "CAMBIA ESTA ETIQUETA"],
    "numeros.resultados": ["Resultados de campanha", "Campaign results", "Resultados de campañas"],
    "numeros.depoimentos": ["O que dizem sobre mim", "What people say about me", "Lo que dicen de mí"],
    "resultado.marca": ["Marca {n}", "Brand {n}", "Marca {n}"],
    "resultado.titulo": ["Resultado a definir", "Result to be defined", "Resultado por definir"],
    "resultado.desc": [
      "Descreva aqui o resultado real dessa campanha.",
      "Describe the real result of this campaign here.",
      "Describe aquí el resultado real de esta campaña."
    ],
    "depoimento.texto": [
      "Escreva aqui o depoimento real desse cliente sobre o trabalho.",
      "Write the client's real testimonial about the work here.",
      "Escribe aquí el testimonio real de este cliente sobre el trabajo."
    ],
    "depoimento.nome": ["Cliente {n}", "Client {n}", "Cliente {n}"],
    "depoimento.empresa": ["Empresa {n}", "Company {n}", "Empresa {n}"],

    /* ---- Contato ---- */
    "contato.eyebrow": ["Contato", "Contact", "Contacto"],
    "contato.titulo": ["Bora criar <em>juntos</em>?", "Let's create <em>together</em>?", "¿Creamos <em>juntos</em>?"],
    "contato.texto": [
      "Me conta um pouco sobre a sua marca e o que você precisa. Respondo rapidinho.",
      "Tell me a bit about your brand and what you need. I reply quickly.",
      "Cuéntame un poco sobre tu marca y lo que necesitas. Respondo rápido."
    ],
    "contato.nome": ["Nome", "Name", "Nombre"],
    "contato.email": ["E-mail", "Email", "Correo electrónico"],
    "contato.mensagem": ["Mensagem", "Message", "Mensaje"],
    "contato.enviar": ["Enviar mensagem", "Send message", "Enviar mensaje"],
    "contato.ok": [
      "Mensagem enviada! Assim que eu ver, te respondo por e-mail ou WhatsApp. Obrigada pelo contato!",
      "Message sent! As soon as I see it, I will reply by email or WhatsApp. Thank you for reaching out!",
      "¡Mensaje enviado! En cuanto lo vea, te respondo por correo o WhatsApp. ¡Gracias por escribirme!"
    ],
    "contato.erro": [
      "Não consegui enviar agora. Tenta de novo em instantes ou me chama direto pelo WhatsApp.",
      "I could not send it right now. Try again in a moment or message me directly on WhatsApp.",
      "No pude enviarlo ahora. Inténtalo de nuevo en unos instantes o escríbeme directo por WhatsApp."
    ],
    "canal.email": ["E-mail", "Email", "Correo"],

    /* ---- Rodapé ---- */
    "rodape.email": ["E-mail", "Email", "Correo"],
    "rodape.copyright": [
      "© {ano} Priscilla Baron. Todos os direitos reservados.",
      "© {ano} Priscilla Baron. All rights reserved.",
      "© {ano} Priscilla Baron. Todos los derechos reservados."
    ],

    /* ---- Card de mídia kit ---- */
    "modal.fechar": ["Fechar", "Close", "Cerrar"],
    "modal.titulo": ["Quer meu mídia kit completo?", "Want my full media kit?", "¿Quieres mi media kit completo?"],
    "modal.texto": [
      "Deixa seu nome e e-mail que eu te envio com os detalhes de audiência, formatos e valores.",
      "Leave your name and email and I will send you the details on audience, formats and rates.",
      "Déjame tu nombre y correo y te envío los detalles de audiencia, formatos y valores."
    ],
    "modal.botao": ["Quero receber", "I want it", "Lo quiero"],
    "modal.confirmacao": [
      "Recebido! Em breve o mídia kit chega no seu e-mail.",
      "Received! The media kit will reach your inbox soon.",
      "¡Recibido! Pronto te llega el media kit al correo."
    ]
  };

  const dicionario = { pt: {}, en: {}, es: {} };
  Object.keys(LINHAS).forEach(function (chave) {
    CODIGOS.forEach(function (codigo, i) { dicionario[codigo][chave] = LINHAS[chave][i]; });
  });

  /* ---- Idioma atual ---- */
  function idiomaInicial() {
    try {
      const salvo = localStorage.getItem("idioma");
      if (CODIGOS.indexOf(salvo) !== -1) return salvo;
    } catch (e) { /* sem armazenamento: segue sem lembrar a escolha */ }
    // Primeira visita: usa o idioma do navegador, se for inglês ou espanhol.
    const nav = String(navigator.language || "pt").slice(0, 2).toLowerCase();
    return CODIGOS.indexOf(nav) !== -1 ? nav : "pt";
  }
  let atual = idiomaInicial();
  const ouvintes = [];

  function existe(chave) {
    return Object.prototype.hasOwnProperty.call(dicionario[atual], chave) || Object.prototype.hasOwnProperty.call(dicionario.pt, chave);
  }

  // Devolve o texto da chave no idioma atual. {n}, {t}... são trocados pelos valores de "params".
  function t(chave, params) {
    let texto = dicionario[atual][chave];
    if (texto === undefined) texto = dicionario.pt[chave];
    if (texto === undefined) return chave;
    const valores = Object.assign({ ano: new Date().getFullYear() }, params || {});
    return texto.replace(/\{(\w+)\}/g, function (m, nome) { return valores[nome] !== undefined ? valores[nome] : m; });
  }

  // Preenche todos os textos marcados com data-i18n dentro de "raiz" (a página inteira por padrão).
  function aplicar(raiz) {
    const base = raiz || document;
    base.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"), el.dataset);
    });
    base.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"), el.dataset);
    });
    base.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (par) {
        const partes = par.split(":");
        if (partes.length === 2) el.setAttribute(partes[0].trim(), t(partes[1].trim(), el.dataset));
      });
    });
  }

  function atualizarPagina() {
    document.documentElement.lang = HTML_LANG[atual];
    document.title = t("meta.titulo");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.descricao"));
    document.querySelectorAll("[data-idioma]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-idioma") === atual ? "true" : "false");
    });
    aplicar(document);
  }

  function definir(codigo) {
    if (CODIGOS.indexOf(codigo) === -1 || codigo === atual) return;
    atual = codigo;
    try { localStorage.setItem("idioma", codigo); } catch (e) { /* tudo bem */ }
    atualizarPagina();
    ouvintes.forEach(function (fn) { fn(codigo); });
  }

  function iniciar() {
    document.querySelectorAll("[data-idioma]").forEach(function (b) {
      b.addEventListener("click", function () { definir(b.getAttribute("data-idioma")); });
    });
    atualizarPagina();
  }

  window.Idiomas = {
    t: t,
    existe: existe,
    aplicar: aplicar,
    iniciar: iniciar,
    definir: definir,
    atual: function () { return atual; },
    aoMudar: function (fn) { ouvintes.push(fn); }
  };
})();
