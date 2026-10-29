/* Depoimentos reais das marcas. A seção "O que dizem sobre o trabalho" fica escondida enquanto esta lista estiver vazia
   e aparece sozinha quando houver pelo menos um depoimento.
   Use as palavras da marca exatamente como vierem (corrija só erros de digitação). Sem nomes de pessoas.
   Sem estrelas e sem números, a menos que a marca tenha dado a nota ou que o resultado seja real.

   Exemplo do formato (NÃO é um depoimento real: copie, apague os "//" e troque pelos dados reais):

   {
     marca: "Nome da marca",
     logo: "logos/web/nome-da-marca.png",   // opcional: sem logo, o círculo mostra a inicial da marca
     instagram: "@instagramdamarca",          // opcional: sem ele, aparece o nome da marca
     nicho: "Casa & Decoração",               // opcional: linha pequena em caixa alta (nome do nicho, traduzido sozinho)
     // "texto" (e "balao") podem ser uma frase só ou { pt: "...", en: "...", es: "..." }: cada idioma do site mostra o seu.
     texto: { pt: "O texto como a marca escreveu.", en: "The same text, translated.", es: "El mismo texto, traducido." },
     nota: 5,          // opcional: estrelas de 1 a 5. Para tirar as estrelas de um depoimento, apague esta linha.
     resultado: "",    // opcional: um resultado em destaque (só se for real)
     legenda: "",      // opcional: uma linha pequena explicando o resultado
     balao: ""         // opcional: um trecho de até cerca de 5 palavras, COPIADO IGUALZINHO do "texto" acima.
                       // Aparece num balão flutuante na foto da capa (só o primeiro depoimento com "balao"; o outro balão é a saudação fixa).
                       // Se o trecho não estiver literalmente dentro do "texto", o balão não aparece.
   }
*/
window.DEPOIMENTOS_DADOS = [
  {
    marca: "Sweet Quarantine",
    logo: "logos/web/sweet-quarantine.png",
    nicho: "Gastronomia",
    nota: 5,
    // Original em português; as versões em inglês e espanhol são traduções fiéis.
    texto: {
      pt: "Amei!!!! Muito feliz que gostaram! Obrigada pelo carinho no vídeo.",
      en: "Loved it!!!! So happy you liked it! Thank you for the love on the video.",
      es: "¡Me encantó!!!! ¡Muy feliz de que les gustara! Gracias por el cariño en el video."
    },
    balao: { pt: "Muito feliz que gostaram", en: "So happy you liked it", es: "Muy feliz de que les gustara" }
  },
  {
    marca: "RQ Stay",
    logo: "logos/web/rq-stay.png",
    nicho: "Viagens e Passeios",
    nota: 5,
    // Original em espanhol; as versões em português e inglês são traduções fiéis.
    texto: {
      pt: "Queremos agradecer pelo excelente conteúdo que vocês criaram e por compartilhar a experiência de vocês com a comunidade. Temos certeza de que será de grande valor para quem está pensando em visitar o Chile.",
      en: "We want to thank you for the excellent content you created and for sharing your experience with your community. We are sure it will be of great value to anyone thinking of visiting Chile.",
      es: "Queremos agradecerles por el excelente contenido que han creado y por compartir su experiencia con su comunidad. Estamos seguros de que será de gran valor para quienes estén pensando en visitar Chile."
    },
    balao: { pt: "excelente conteúdo que vocês criaram", en: "excellent content you created", es: "excelente contenido que han creado" }
  },
  {
    marca: "Lippi",
    logo: "logos/web/uppi.png",
    nicho: "Moda & Acessórios",
    nota: 5,
    // Original em espanhol; as versões em português e inglês são traduções fiéis.
    texto: {
      pt: "Muito bem feito! Gostei bastante, é um trabalho muito bom. Desejamos sucesso e esperamos fazer mais colaborações se vocês voltarem ao Chile.",
      en: "Very well done! I liked it a lot, it's a very good piece of work. We wish you success and hope to do more collaborations if you return to Chile.",
      es: "Muy bien hecho! Me gustó bastante, es un muy buen trabajo. Que tengan éxito y esperemos volver a hacer mas colaboraciones si regresan a Chile."
    },
    balao: { pt: "é um trabalho muito bom", en: "it's a very good piece of work", es: "es un muy buen trabajo" }
  }
];
