/* Configuração da barra do topo (selo da data especial, contagem regressiva e mensagens que trocam).
   Para mudar o tom ou o calendário, edite SÓ este arquivo: o cálculo das datas e dos dias é automático. */
window.BARRA_TOPO_CONFIG = {
  // "ultimas" => a primeira mensagem fala "últimas vagas para {mês}".  "abertas" => "agenda aberta para {mês}".
  vagas: "ultimas",

  // Opcional: se preencher, vale no lugar do cálculo automático.
  // mesManual: número do mês (1 a 12). Ex.: 12 para dezembro. Deixe "" para automático.
  mesManual: "",
  // dataManual: { id: "natal", data: "2026-12-25" }  (id de uma das datas abaixo). Deixe null para automático.
  dataManual: null,

  // Só mostra o selo da data e a contagem quando faltam este tanto de dias ou menos.
  janelaDias: 60,
  // Tempo entre uma mensagem e a seguinte, em milissegundos.
  intervaloMs: 3500,

  whatsapp: "5511996975223",

  // Datas especiais do Brasil. "fixa": mês e dia. "semana": n-ésimo dia da semana do mês (diaSemana: 0 = domingo, 5 = sexta).
  // "prep" é a palavra da contagem em português: "pra Black Friday", "pro Natal".
  datas: [
    { id: "consumidor", regra: "fixa", mes: 3, dia: 15, prep: "pro" },
    { id: "maes", regra: "semana", mes: 5, ordem: 2, diaSemana: 0, prep: "pro" },
    { id: "namorados", regra: "fixa", mes: 6, dia: 12, prep: "pro" },
    { id: "pais", regra: "semana", mes: 8, ordem: 2, diaSemana: 0, prep: "pro" },
    { id: "criancas", regra: "fixa", mes: 10, dia: 12, prep: "pro" },
    { id: "blackfriday", regra: "semana", mes: 11, ordem: 4, diaSemana: 5, prep: "pra" },
    { id: "natal", regra: "fixa", mes: 12, dia: 25, prep: "pro" }
  ]
};
