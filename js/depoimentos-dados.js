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
     texto: "O texto do depoimento, exatamente como a marca escreveu.",
     nota: 5,          // opcional: estrelas de 1 a 5, SÓ se a marca deu uma nota
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
    texto: "Amei!!!! Muito feliz que gostaram! Obrigada pelo carinho no vídeo.",
    balao: "Muito feliz que gostaram"
  },
  {
    marca: "RQ Stay",
    logo: "logos/web/rq-stay.png",
    nicho: "Viagens e Passeios",
    texto: "Queremos agradecerles por el excelente contenido que han creado y por compartir su experiencia con su comunidad. Estamos seguros de que será de gran valor para quienes estén pensando en visitar Chile.",
    balao: "excelente contenido que han creado"
  },
  {
    marca: "Lippi",
    // logo: falta o logo certo da Lippi (o arquivo uppi.png parece ser de outra marca)
    nicho: "Moda & Acessórios",
    texto: "Muy bien hecho! Me gustó bastante, es un muy buen trabajo. Que tengan éxito y esperemos volver a hacer mas colaboraciones si regresan a Chile.",
    balao: "es un muy buen trabajo"
  },
  {
    // marca: preencher com o nome da marca (feedback recebido em espanhol)
    marca: "",
    texto: "Estamos muy contentos de ver que les gustaron los productos y que el contenido ha tenido buena acogida del público, felicitaciones por eso. Quedamos atentos para cuando quieran hacer mas cosas.",
    balao: "buena acogida del público"
  }
];
