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
    "meta.titulo": ["Priscilla Baron | UGC Creator", "Priscilla Baron | UGC Creator", "Priscilla Baron | UGC Creator"],
    "meta.descricao": [
      "Portfólio de Priscilla Baron, UGC Creator. Vídeos UGC para casa e decoração, beleza, tecnologia e lifestyle, com roteiro aprovado antes de gravar.",
      "Portfolio of Priscilla Baron, UGC Creator. UGC videos for home & decor, beauty, tech and lifestyle, with the script approved before filming.",
      "Portafolio de Priscilla Baron, UGC Creator. Videos UGC para casa y decoración, belleza, tecnología y lifestyle, con guion aprobado antes de grabar."
    ],
    "pular": ["Pular para o conteúdo", "Skip to content", "Ir al contenido"],

    /* ---- Barra do topo (js/barra-topo.js) ---- */
    "barra.aria": ["Avisos e reserva de agenda", "Notices and booking", "Avisos y reserva de agenda"],
    "barra.agenda": ["AGENDA ABERTA", "OPEN SCHEDULE", "AGENDA ABIERTA"],
    "barra.contagem.varios": ["Faltam {n} dias {prep} {data}", "{n} days to {data}", "Faltan {n} días para {data}"],
    "barra.contagem.um": ["Falta 1 dia {prep} {data}", "1 day to {data}", "Falta 1 día para {data}"],
    "barra.contagem.hoje": ["É hoje: {data}!", "It's today: {data}!", "¡Es hoy: {data}!"],
    "barra.selo.curto": ["{data} · {n} DIAS", "{data} · {n} DAYS", "{data} · {n} DÍAS"],
    "barra.selo.um": ["{data} · 1 DIA", "{data} · 1 DAY", "{data} · 1 DÍA"],
    "barra.selo.hoje": ["{data} · HOJE", "{data} · TODAY", "{data} · HOY"],
    "barra.reservar": ["reservar agenda →", "book your spot →", "reservar agenda →"],
    "barra.wa": [
      "Oi, Pri! Vi seu portfólio e quero reservar vídeos para {mes}.",
      "Hi, Pri! I saw your portfolio and I want to book videos for {mes}.",
      "¡Hola, Pri! Vi tu portafolio y quiero reservar videos para {mes}."
    ],
    "barra.msg.ultimas": ["últimas vagas para {mes}", "last spots for {mes}", "últimos cupos para {mes}"],
    "barra.msg.abertas": ["agenda aberta para {mes}", "schedule open for {mes}", "agenda abierta para {mes}"],
    "barra.msg.reserve": ["reserve seus vídeos para {mes}", "book your videos for {mes}", "reserva tus videos para {mes}"],
    "barra.msg.instagram": ["vídeo para Instagram", "video for Instagram", "video para Instagram"],
    "barra.msg.tiktok": ["vídeo para TikTok", "video for TikTok", "video para TikTok"],
    "barra.msg.youtube": ["vídeo para YouTube", "video for YouTube", "video para YouTube"],
    "barra.msg.ads": ["vídeo para ads", "video for ads", "video para ads"],
    "barra.msg.criativos": ["criativos de {data} prontos antes do pico", "{data} creatives ready before the peak", "creativos de {data} listos antes del pico"],
    "barra.msg.roteiro": [
      "roteiro aprovado por você antes de eu gravar",
      "script approved by you before I film",
      "guion aprobado por ti antes de grabar"
    ],
    "barra.mes.1": ["janeiro", "January", "enero"],
    "barra.mes.2": ["fevereiro", "February", "febrero"],
    "barra.mes.3": ["março", "March", "marzo"],
    "barra.mes.4": ["abril", "April", "abril"],
    "barra.mes.5": ["maio", "May", "mayo"],
    "barra.mes.6": ["junho", "June", "junio"],
    "barra.mes.7": ["julho", "July", "julio"],
    "barra.mes.8": ["agosto", "August", "agosto"],
    "barra.mes.9": ["setembro", "September", "septiembre"],
    "barra.mes.10": ["outubro", "October", "octubre"],
    "barra.mes.11": ["novembro", "November", "noviembre"],
    "barra.mes.12": ["dezembro", "December", "diciembre"],
    "barra.data.consumidor": ["Dia do Consumidor", "Consumer Day", "Día del Consumidor"],
    "barra.data.maes": ["Dia das Mães", "Mother's Day", "Día de las Madres"],
    "barra.data.namorados": ["Dia dos Namorados", "Valentine's Day", "Día de los Enamorados"],
    "barra.data.pais": ["Dia dos Pais", "Father's Day", "Día de los Padres"],
    "barra.data.criancas": ["Dia das Crianças", "Children's Day", "Día de los Niños"],
    "barra.data.blackfriday": ["Black Friday", "Black Friday", "Black Friday"],
    "barra.data.natal": ["Natal", "Christmas", "Navidad"],

    /* ---- Menu ---- */
    "nav.aria": ["Menu principal", "Main menu", "Menú principal"],
    "logo.aria": ["Priscilla Baron, ir para o topo", "Priscilla Baron, back to top", "Priscilla Baron, ir al inicio"],
    "menu.abrir": ["Abrir menu", "Open menu", "Abrir menú"],
    "menu.fechar": ["Fechar menu", "Close menu", "Cerrar menú"],
    "nav.sobre": ["Sobre", "About", "Sobre mí"],
    "nav.trabalhos": ["Trabalhos", "Work", "Trabajos"],
    "nav.servicos": ["Serviços", "Services", "Servicios"],
    "nav.processo": ["Processo", "Process", "Proceso"],
    "nav.contato": ["Contato", "Contact", "Contacto"],
    "nav.cta": ["Trabalhe comigo", "Work with me", "Trabaja conmigo"],
    "idioma.aria": ["Idioma", "Language", "Idioma"],

    /* ---- Capa ---- */
    "hero.aria": ["Apresentação", "Introduction", "Presentación"],
    "hero.selo": ["Priscilla Baron · UGC Creator · Agenda aberta", "Priscilla Baron · UGC Creator · Open schedule", "Priscilla Baron · UGC Creator · Agenda abierta"],
    "hero.h1": ["Seu produto,<br>na vida <em>real</em>.", "Your product,<br>in <em>real</em> life.", "Tu producto,<br>en la vida <em>real</em>."],
    "hero.tagline": [
      "Vídeos UGC roteirizados para orgânico e anúncio. Você aprova o roteiro antes de eu gravar, e o prazo de entrega é combinado já no briefing.",
      "Scripted UGC videos for organic and ads. You approve the script before I film, and the delivery date is agreed in the briefing.",
      "Videos UGC con guion para orgánico y anuncios. Tú apruebas el guion antes de grabar, y el plazo de entrega se acuerda ya en el briefing."
    ],
    "hero.cta": ["Quero um vídeo UGC", "I want a UGC video", "Quiero un video UGC"],
    "hero.ver": ["Ver trabalhos →", "See my work →", "Ver trabajos →"],
    "hero.foto.alt": ["Retrato de Priscilla Baron sorrindo", "Portrait of Priscilla Baron smiling", "Retrato de Priscilla Baron sonriendo"],
    "hero.numeros.aria": ["Resumo em números", "Summary in numbers", "Resumen en números"],
    "faixa.1": ["VÍDEO UGC", "UGC VIDEO", "VIDEO UGC"],
    "faixa.2": ["CRIATIVOS PARA ANÚNCIO", "AD CREATIVES", "CREATIVOS PARA ANUNCIOS"],
    "faixa.3": ["UNBOXING", "UNBOXING", "UNBOXING"],
    "faixa.4": ["FOTOS DE PRODUTO", "PRODUCT PHOTOS", "FOTOS DE PRODUCTO"],
    "faixa.5": ["ROTEIRO ESTRATÉGICO", "STRATEGIC SCRIPT", "GUION ESTRATÉGICO"],
    "faixa.6": ["CONTEÚDO PARA E-COMMERCE", "E-COMMERCE CONTENT", "CONTENIDO PARA E-COMMERCE"],
    "faixa.7": ["PACOTE MENSAL", "MONTHLY PACKAGE", "PAQUETE MENSUAL"],
    "marcas.aria": ["Marcas com quem já trabalhei", "Brands I have worked with", "Marcas con las que he trabajado"],
    "marcas.legenda": ["Marcas com quem já trabalhei", "Brands I have worked with", "Marcas con las que he trabajado"],

    /* ---- Sobre ---- */
    "sobre.foto.alt": ["Priscilla Baron na neve, de jaqueta lilás", "Priscilla Baron in the snow, wearing a lilac jacket", "Priscilla Baron en la nieve, con una chaqueta lila"],
    "sobre.eyebrow": ["Sobre mim", "About me", "Sobre mí"],
    "sobre.titulo": [
      "Oie, sou a <em>Pri Baron</em>",
      "Hey, I'm <em>Pri Baron</em>",
      "Hola, soy <em>Pri Baron</em>"
    ],
    "sobre.p1": [
      "Criadora UGC e influenciadora que transforma <strong>bem-estar, esporte, lifestyle e viagens</strong> em histórias que vendem naturalmente.",
      "UGC creator and influencer who turns <strong>wellness, sports, lifestyle and travel</strong> into stories that sell naturally.",
      "Creadora UGC e influencer que transforma <strong>bienestar, deporte, lifestyle y viajes</strong> en historias que venden de forma natural."
    ],
    "sobre.p2": [
      "Com uma comunicação leve, autêntica e estratégica, conecto marcas e pessoas por meio de narrativas reais que inspiram e performam.",
      "With light, authentic and strategic communication, I connect brands and people through real stories that inspire and perform.",
      "Con una comunicación ligera, auténtica y estratégica, conecto marcas y personas a través de narrativas reales que inspiran y rinden."
    ],
    "sobre.citacao": [
      "Cada vídeo que produzo é pensado para gerar resultado, conexão e memória de marca, porque conteúdo bom não só encanta, ele convence e transforma.",
      "Every video I make is designed to deliver results, connection and brand memory, because good content doesn't just delight, it convinces and transforms.",
      "Cada video que produzco está pensado para generar resultado, conexión y memoria de marca, porque un buen contenido no solo encanta, convence y transforma."
    ],
    "sobre.pilula2": ["Brasil <span class=\"bandeira bandeira-br\" role=\"img\" aria-label=\"Brasil\"></span> · Chile <span class=\"bandeira bandeira-cl\" role=\"img\" aria-label=\"Chile\"></span>", "Brazil <span class=\"bandeira bandeira-br\" role=\"img\" aria-label=\"Brasil\"></span> · Chile <span class=\"bandeira bandeira-cl\" role=\"img\" aria-label=\"Chile\"></span>", "Brasil <span class=\"bandeira bandeira-br\" role=\"img\" aria-label=\"Brasil\"></span> · Chile <span class=\"bandeira bandeira-cl\" role=\"img\" aria-label=\"Chile\"></span>"],
    "sobre.pilula3": ["Roteiro aprovado antes de gravar", "Script approved before filming", "Guion aprobado antes de grabar"],
    /* ---- Destaques ---- */
    "destaques.eyebrow": ["Portfólio", "Portfolio", "Portafolio"],
    "destaques.titulo": ["Trabalhos em <em>destaque</em>", "Featured <em>work</em>", "Trabajos <em>destacados</em>"],
    "destaques.texto": [
      "Uma amostra dos formatos que eu mais entrego: unboxing, testemunho, demonstração e lifestyle. Cada vídeo foi roteirizado antes da gravação.",
      "A sample of the formats I deliver most: unboxing, testimonial, demonstration and lifestyle. Every video was scripted before filming.",
      "Una muestra de los formatos que más entrego: unboxing, testimonio, demostración y lifestyle. Cada video tuvo guion antes de grabarse."
    ],
    "destaques.cta": ["Quero um vídeo assim →", "I want a video like this →", "Quiero un video así →"],    "destaques.assistir": ["{t}, assistir vídeo", "{t}, watch video", "{t}, ver video"],
    "destaques.slide": ["Vídeo {i} de {n}", "Video {i} of {n}", "Video {i} de {n}"],
    "destaques.carrossel": ["Vídeos em destaque", "Featured videos", "Videos destacados"],
    "destaques.anterior": ["Vídeo anterior", "Previous video", "Video anterior"],
    "destaques.proximo": ["Próximo vídeo", "Next video", "Próximo video"],
    /* ---- Vitrine de nichos ---- */
    "nichos.eyebrow": ["Nichos", "Niches", "Nichos"],
    "nichos.titulo": ["Qual é o nicho da <em>sua marca</em>?", "What is your <em>brand's</em> niche?", "¿Cuál es el nicho de <em>tu marca</em>?"],
    "nichos.intro": [
      "Cada linha é um nicho. Escolha o seu e deslize para ver mais.",
      "Each row is a niche. Pick yours and swipe to see more.",
      "Cada fila es un nicho. Elige el tuyo y desliza para ver más."
    ],    "nichos.nav": ["Ir para um nicho", "Jump to a niche", "Ir a un nicho"],
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
    "nicho.beleza.nome": ["Beleza", "Beauty", "Belleza"],
    "nicho.tech-e-apps.nome": ["Tech & Apps", "Tech & Apps", "Tech y Apps"],
    "nicho.alimentacao-e-suplementacao.nome": ["Alimentação Saudável e Suplementação", "Healthy Food & Supplements", "Alimentación Saludable y Suplementación"],
    "nicho.viagens-e-passeios.nome": ["Viagens e Passeios", "Travel & Outings", "Viajes y Paseos"],
    "nicho.clips-e-tiktok-shop.nome": ["Clips & TikTok Shop", "Clips & TikTok Shop", "Clips y TikTok Shop"],
    "nicho.lojas-e-mercados.nome": ["Lojas e Mercados", "Stores & Markets", "Tiendas y Mercados"],

    "nicho.casa-e-decoracao.desc": ["Ambientes, organização e achadinhos para a casa", "Rooms, organization and finds for the home", "Ambientes, organización y hallazgos para la casa"],
    "nicho.gastronomia.desc": ["Restaurantes e cafeterias para comer, beber e voltar sempre", "Restaurants and cafés to eat, drink and come back to", "Restaurantes y cafeterías para comer, beber y volver siempre"],
    "nicho.saude-e-fitness.desc": ["Treino, bem-estar e rotina saudável", "Workouts, wellbeing and a healthy routine", "Entrenamiento, bienestar y rutina saludable"],
    "nicho.beleza-e-autocuidado.desc": ["Skincare, cabelo e momentos de cuidado", "Skincare, hair and self-care moments", "Skincare, cabello y momentos de cuidado personal"],
    "nicho.moda-e-acessorios.desc": ["Looks, peças e acessórios na vida real", "Looks, pieces and accessories in real life", "Looks, prendas y accesorios en la vida real"],
    "nicho.lojas-e-supermercados.desc": ["Compras do dia a dia e achados de loja", "Everyday shopping and store finds", "Compras del día a día y hallazgos de tienda"],
    "nicho.conteudos-em-familia.desc": ["Rotina, filhos e momentos em família", "Routine, kids and family moments", "Rutina, hijos y momentos en familia"],
    "nicho.datas-especiais.desc": ["Natal, Dia das Mães e outras datas que vendem", "Christmas, Mother's Day and other dates that sell", "Navidad, Día de las Madres y otras fechas que venden"],
    "nicho.viagem-e-passeios.desc": ["Destinos, roteiros e experiências para viver", "Destinations, itineraries and experiences to live", "Destinos, itinerarios y experiencias para vivir"],
    "nicho.restaurantes-e-cafeterias.desc": ["Lugares para comer, beber e voltar sempre", "Places to eat, drink and come back to", "Lugares para comer, beber y volver siempre"],
    "nicho.beleza.desc": ["Skincare, maquiagem e cuidados com o cabelo", "Skincare, makeup and hair care", "Skincare, maquillaje y cuidado del cabello"],
    "nicho.tech-e-apps.desc": ["Equipamentos, sites e aplicativos", "Gadgets, websites and apps", "Equipos, sitios web y aplicaciones"],
    "nicho.alimentacao-e-suplementacao.desc": ["Snacks, suplementos e comida do dia a dia", "Snacks, supplements and everyday food", "Snacks, suplementos y comida del día a día"],
    "nicho.viagens-e-passeios.desc": ["Conteúdos em família, hospedagem, companhias aéreas e passeios", "Family content, stays, airlines and outings", "Contenidos en familia, alojamiento, aerolíneas y paseos"],
    "nicho.clips-e-tiktok-shop.desc": ["Achadinhos e produtos em vídeos curtos", "Finds and products in short videos", "Hallazgos y productos en videos cortos"],
    "nicho.lojas-e-mercados.desc": ["Lojas, shoppings e mercados para visitar", "Stores, malls and markets to visit", "Tiendas, centros comerciales y mercados para visitar"],

    /* ---- Formatos dos vídeos (campo "tipo" de cada vídeo no painel) ---- */
    "formato.unboxing": ["Unboxing", "Unboxing", "Unboxing"],
    "formato.testemunho": ["Testemunho", "Testimonial", "Testimonio"],
    "formato.review": ["Review", "Review", "Reseña"],
    "formato.demonstracao": ["Demonstração", "Demonstration", "Demostración"],
    "formato.problema-solucao": ["Problema × Solução", "Problem × Solution", "Problema × Solución"],
    "formato.tutorial": ["Tutorial", "Tutorial", "Tutorial"],
    "formato.lifestyle": ["Lifestyle", "Lifestyle", "Lifestyle"],
    "formato.viagem": ["Viagem", "Travel", "Viaje"],
    "formato.trend": ["Trend", "Trend", "Trend"],
    "formato.anuncio": ["Anúncio", "Ad", "Anuncio"],

    /* ---- Player dos vídeos ---- */
    "video.ouvir": ["Clique para ouvir", "Click to listen", "Haz clic para escuchar"],
    "video.assistir": ["Clique para assistir", "Click to watch", "Haz clic para ver"],
    "video.abrir": ["Abrir o vídeo", "Open the video", "Abrir el video"],
    "video.comSom": ["Com som · pausar", "Sound on · pause", "Con sonido · pausar"],

    /* ---- Serviços ---- */
    "servicos.eyebrow": ["Serviços", "Services", "Servicios"],
    "servicos.titulo": ["Como eu te <em>ajudo</em>", "How I can <em>help</em>", "Cómo te <em>ayudo</em>"],
    "servicos.texto": [
      "Cada formato resolve um objetivo: <strong>vender</strong>, <strong>anunciar</strong> ou <strong>fortalecer a marca</strong>. Me conta o seu e eu monto o pacote certo para você.",
      "Each format serves a goal: <strong>selling</strong>, <strong>advertising</strong> or <strong>strengthening the brand</strong>. Tell me yours and I'll build the right package for you.",
      "Cada formato resuelve un objetivo: <strong>vender</strong>, <strong>anunciar</strong> o <strong>fortalecer la marca</strong>. Cuéntame el tuyo y armo el paquete ideal para ti."
    ],
    "servicos.cta": ["Montar meu pacote →", "Build my package →", "Armar mi paquete →"],
    "servicos.nota": [
      "Valores sob consulta, de acordo com a quantidade de vídeos, os formatos e os direitos de uso.",
      "Prices on request, based on the number of videos, the formats and the usage rights.",
      "Valores a consultar, según la cantidad de videos, los formatos y los derechos de uso."
    ],
    "servico.obj.vender": ["VENDER", "SELL", "VENDER"],
    "servico.obj.anunciar": ["ANUNCIAR", "ADVERTISE", "ANUNCIAR"],
    "servico.obj.marca": ["MARCA", "BRAND", "MARCA"],
    "servico.1.titulo": ["Vídeo UGC", "UGC video", "Video UGC"],
    "servico.1.desc": [
      "Vídeo roteirizado e gravado como conteúdo real de rede social, do jeito que o seu cliente usaria o produto.",
      "A scripted video shot like real social media content, the way your customer would actually use the product.",
      "Video con guion, grabado como contenido real de redes sociales, tal como tu cliente usaría el producto."
    ],
    "servico.2.titulo": ["Unboxing", "Unboxing", "Unboxing"],
    "servico.2.desc": [
      "Abertura e primeira impressão real do produto, do jeito que o público gosta de ver.",
      "Opening and real first impression of the product, the way audiences like to see it.",
      "Apertura y primera impresión real del producto, como le gusta ver al público."
    ],
    "servico.3.titulo": ["Fotos do produto", "Product photos", "Fotos del producto"],
    "servico.3.desc": [
      "Imagens com boa luz e composição para loja, marketplace, anúncio ou site.",
      "Images with good light and composition for your store, marketplace, ad or website.",
      "Imágenes con buena luz y composición para tienda, marketplace, anuncio o sitio web."
    ],
    "servico.4.titulo": ["Criativos para anúncio", "Ad creatives", "Creativos para anuncio"],
    "servico.4.desc": [
      "Versões com ganchos diferentes para testar no Meta e no TikTok. Direitos de uso em mídia paga são orçados à parte, conforme período e canais.",
      "Versions with different hooks to test on Meta and TikTok. Paid-media usage rights are quoted separately, based on period and channels.",
      "Versiones con distintos ganchos para probar en Meta y TikTok. Los derechos de uso en medios pagos se cotizan aparte, según período y canales."
    ],
    "servico.5.titulo": ["Publicação no meu perfil", "Post on my profile", "Publicación en mi perfil"],
    "servico.5.desc": [
      "Opcional: além do vídeo para a sua marca, publico no meu Instagram para gerar alcance orgânico.",
      "Optional: besides the video for your brand, I post it on my Instagram to generate organic reach.",
      "Opcional: además del video para tu marca, lo publico en mi Instagram para generar alcance orgánico."
    ],
    "servico.6.titulo": ["Pacote mensal", "Monthly package", "Paquete mensual"],
    "servico.6.desc": [
      "Combinação de formatos entregue todo mês, com previsibilidade de calendário.",
      "A mix of formats delivered every month, with a predictable calendar.",
      "Una combinación de formatos entregados cada mes, con calendario previsible."
    ],

    /* ---- Processo ---- */
    "processo.eyebrow": ["Processo", "Process", "Proceso"],
    "processo.titulo": ["Como eu <em>trabalho</em>", "How I <em>work</em>", "Cómo <em>trabajo</em>"],
    "processo.texto": ["Do briefing à entrega, você sabe exatamente o que esperar.", "From briefing to delivery, you know exactly what to expect.", "Del briefing a la entrega, sabes exactamente qué esperar."],
    "processo.1.t": ["Briefing", "Briefing", "Briefing"],
    "processo.1.d": ["Entendo o produto, o público e o objetivo do vídeo: orgânico ou anúncio.", "I get to know the product, the audience and the goal of the video: organic or ads.", "Entiendo el producto, el público y el objetivo del video: orgánico o anuncio."],
    "processo.2.t": ["Roteiro", "Script", "Guion"],
    "processo.2.d": ["Envio gancho, falas e cenas para você aprovar antes de eu gravar.", "I send the hook, lines and scenes for you to approve before I film.", "Envío gancho, diálogos y escenas para que apruebes antes de grabar."],
    "processo.3.t": ["Gravação", "Filming", "Grabación"],
    "processo.3.d": ["Captação vertical, com variações de gancho quando o vídeo for para anúncio.", "Vertical filming, with hook variations when the video is for ads.", "Grabación vertical, con variaciones de gancho cuando el video es para anuncios."],
    "processo.4.t": ["Entrega", "Delivery", "Entrega"],
    "processo.4.d": ["No prazo combinado no briefing, com 1 rodada de revisão.", "On the date agreed in the briefing, with 1 round of revisions.", "En el plazo acordado en el briefing, con 1 ronda de revisión."],
    "processo.4.d.prazo": ["Em {prazo}, com 1 rodada de revisão.", "Within {prazo}, with 1 round of revisions.", "En {prazo}, con 1 ronda de revisión."],
    "processo.5.t": ["Uso", "Usage", "Uso"],
    "processo.5.d": ["Combinamos onde e por quanto tempo o vídeo vai rodar: orgânico, anúncio ou site.", "We agree on where and for how long the video will run: organic, ads or website.", "Acordamos dónde y por cuánto tiempo se usará el video: orgánico, anuncio o sitio web."],
    "processo.cta": ["Começar pelo briefing →", "Start with the briefing →", "Empezar por el briefing →"],

    /* ---- Depoimentos (seção escondida até haver depoimento real) ---- */
    "depoimentos.eyebrow": ["Depoimentos", "Testimonials", "Testimonios"],
    "depoimentos.titulo": ["O que dizem sobre o <em>trabalho</em>", "What they say about the <em>work</em>", "Lo que dicen del <em>trabajo</em>"],
    "depoimentos.anterior": ["Depoimento anterior", "Previous testimonial", "Testimonio anterior"],
    "depoimentos.proximo": ["Próximo depoimento", "Next testimonial", "Siguiente testimonio"],
    /* ---- Contadores ---- */
    "metrica.videos": ["vídeos entregues", "videos delivered", "videos entregados"],
    "metrica.marcas": ["marcas atendidas", "brands served", "marcas atendidas"],
    "metrica.paises": ["países trabalhados: Brasil <span class=\"bandeira bandeira-br\" role=\"img\" aria-label=\"Brasil\"></span> e Chile <span class=\"bandeira bandeira-cl\" role=\"img\" aria-label=\"Chile\"></span>", "countries worked in: Brazil <span class=\"bandeira bandeira-br\" role=\"img\" aria-label=\"Brazil\"></span> and Chile <span class=\"bandeira bandeira-cl\" role=\"img\" aria-label=\"Chile\"></span>", "países trabajados: Brasil <span class=\"bandeira bandeira-br\" role=\"img\" aria-label=\"Brasil\"></span> y Chile <span class=\"bandeira bandeira-cl\" role=\"img\" aria-label=\"Chile\"></span>"],

    /* ---- Contato ---- */
    "contato.eyebrow": ["Contato", "Contact", "Contacto"],
    "contato.titulo": ["Vamos construir isso <em>juntos</em>?", "Shall we build this <em>together</em>?", "¿Construimos esto <em>juntos</em>?"],
    "contato.texto": [
      "Me conta sobre a sua marca e o que você quer alcançar. Respondo em até 48h.",
      "Tell me about your brand and what you want to achieve. I reply within 48 hours.",
      "Cuéntame sobre tu marca y lo que quieres lograr. Respondo en hasta 48 horas."
    ],
    "contato.nome": ["Nome", "Name", "Nombre"],
    "contato.nome.ph": ["Seu nome", "Your name", "Tu nombre"],
    "contato.email": ["E-mail", "Email", "Correo electrónico"],
    "contato.email.ph": ["voce@marca.com", "you@brand.com", "tu@marca.com"],
    "contato.marca": ["Marca / Empresa", "Brand / Company", "Marca / Empresa"],
    "contato.marca.ph": ["Nome da marca", "Brand name", "Nombre de la marca"],
    "contato.precisa": ["O que você precisa?", "What do you need?", "¿Qué necesitas?"],
    "contato.prazo": ["Para quando?", "By when?", "¿Para cuándo?"],
    "contato.selecione": ["Selecione", "Select", "Selecciona"],
    "contato.precisa.1": ["Vídeo UGC", "UGC video", "Video UGC"],
    "contato.precisa.2": ["Criativos para anúncio", "Ad creatives", "Creativos para anuncio"],
    "contato.precisa.3": ["Unboxing", "Unboxing", "Unboxing"],
    "contato.precisa.4": ["Fotos do produto", "Product photos", "Fotos del producto"],
    "contato.precisa.5": ["Pacote mensal", "Monthly package", "Paquete mensual"],
    "contato.precisa.6": ["Ainda não sei", "I don't know yet", "Aún no lo sé"],
    "contato.prazo.ph": ["Ex.: até dia 15, este mês", "E.g. by the 15th, this month", "Ej.: hasta el día 15, este mes"],
    "contato.precisa.7": ["Clips", "Clips", "Clips"],
    "contato.precisa.8": ["TikTok", "TikTok", "TikTok"],
    "contato.precisa.9": ["Publicidade", "Advertising", "Publicidad"],
    "contato.mensagem": ["Conta sobre o projeto", "Tell me about the project", "Cuéntame sobre el proyecto"],
    "contato.mensagem.ph": [
      "Produto, onde o vídeo vai rodar (orgânico, anúncio, site) e qualquer referência que você goste…",
      "Product, where the video will run (organic, ads, website) and any references you like…",
      "Producto, dónde se usará el video (orgánico, anuncio, sitio web) y cualquier referencia que te guste…"
    ],
    "contato.enviar": ["Enviar mensagem ↗", "Send message ↗", "Enviar mensaje ↗"],
    "contato.ok": [
      "Mensagem enviada! Assim que eu vir, te respondo por e-mail ou WhatsApp. Obrigada pelo contato!",
      "Message sent! As soon as I see it, I will reply by email or WhatsApp. Thank you for reaching out!",
      "¡Mensaje enviado! En cuanto lo vea, te respondo por correo o WhatsApp. ¡Gracias por escribirme!"
    ],
    "contato.erro": [
      "Não consegui enviar agora. Me chama no WhatsApp: (11) 99697-5223.",
      "I could not send it right now. Message me on WhatsApp: +55 (11) 99697-5223.",
      "No pude enviarlo ahora. Escríbeme por WhatsApp: +55 (11) 99697-5223."
    ],
    "contato.erro.link": ["Abrir o WhatsApp", "Open WhatsApp", "Abrir WhatsApp"],
    "contato.wa": ["Oi, Pri! Vim pelo seu portfólio. Sou da marca {marca}.", "Hi, Pri! I came from your portfolio. I'm from the brand {marca}.", "¡Hola, Pri! Vengo de tu portafolio. Soy de la marca {marca}."],
    "contato.wa.precisa": ["Preciso de: {v}.", "I need: {v}.", "Necesito: {v}."],
    "contato.wa.prazo": ["Para quando: {v}.", "By when: {v}.", "Para cuándo: {v}."],
    "canal.email": ["E-mail", "Email", "Correo"],

    /* ---- Rodapé ---- */
    "rodape.copy": ["© {ano}", "© {ano}", "© {ano}"],
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
  // "idioma" é opcional e só serve para os testes (pedir o texto em português mesmo com a página em inglês).
  function t(chave, params, idioma) {
    const lingua = CODIGOS.indexOf(idioma) !== -1 ? idioma : atual;
    let texto = dicionario[lingua][chave];
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
