// ============================================================================
// FUNÇÃO "enviar-emails" (o carteiro)
// ============================================================================
// Este arquivo NÃO roda no seu site. Ele é copiado e colado no painel do
// Supabase: Edge Functions > Deploy a new function > Via Editor, com o nome
// exatamente "enviar-emails". Veja o passo a passo que está no chat.
//
// A chave do Resend NUNCA fica aqui. Ela é guardada como segredo no painel do
// Supabase (nome: RESEND_API_KEY) e a função só a lê na hora de enviar.
//
// Segredos que a função lê (todos no painel do Supabase, nunca no código):
//   RESEND_API_KEY  obrigatório. A chave do Resend.
//   EMAIL_FROM      opcional. Quem aparece como remetente. Enquanto você não
//                   verificar um domínio no Resend, deixe sem preencher: a
//                   função usa o remetente de teste do Resend.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EMAIL_DONA = "pribaronparcerias@gmail.com";      // único login aceito
const EMAIL_RESPOSTA = "pribaronparcerias@gmail.com";  // onde as marcas respondem
const LIMITE_POR_CHAMADA = 250;
const PAUSA_ENTRE_ENVIOS_MS = 200;                     // ~5 por segundo
const REMETENTE_PADRAO = "Priscilla Baron <onboarding@resend.dev>";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escaparHtml(t: string) {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function primeiroNome(t: unknown) {
  return String(t ?? "").trim().split(/\s+/)[0] || "";
}

// Troca {{nome}} pelo primeiro nome e {{marca}} pelo nome completo da marca.
function trocarVariaveis(texto: string, nome: string, marca: string, comoHtml: boolean) {
  const n = comoHtml ? escaparHtml(nome) : nome;
  const m = comoHtml ? escaparHtml(marca) : marca;
  return texto
    .replace(/\{\{\s*nome\s*\}\}/gi, () => n)
    .replace(/\{\{\s*marca\s*\}\}/gi, () => m);
}

function emailValido(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ erro: "Método não permitido." }, 405);

  // ---- 1) Só entra quem está logada como a Priscilla --------------------------
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return responder({ erro: "Você precisa estar logada." }, 401);

  const urlSupabase = Deno.env.get("SUPABASE_URL")!;
  const chavePublica = Deno.env.get("SUPABASE_ANON_KEY") ?? req.headers.get("apikey") ?? "";
  const supa = createClient(urlSupabase, chavePublica, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: dadosUsuario, error: erroUsuario } = await supa.auth.getUser(token);
  const emailLogado = (dadosUsuario?.user?.email ?? "").toLowerCase();
  if (erroUsuario || emailLogado !== EMAIL_DONA) {
    return responder({ erro: "Acesso recusado." }, 403);
  }

  const chaveResend = Deno.env.get("RESEND_API_KEY");
  if (!chaveResend) {
    return responder({ erro: "A chave RESEND_API_KEY ainda não foi guardada nos segredos do Supabase." }, 500);
  }
  const remetente = Deno.env.get("EMAIL_FROM") || REMETENTE_PADRAO;

  // ---- 2) Lê e confere o que chegou -------------------------------------------
  let corpo: any;
  try {
    corpo = await req.json();
  } catch {
    return responder({ erro: "Pedido inválido." }, 400);
  }

  const teste = corpo?.teste === true;
  const assuntoModelo = String(corpo?.assunto ?? "").trim();
  const htmlModelo = String(corpo?.html ?? "");
  if (!assuntoModelo) return responder({ erro: "Falta o assunto." }, 400);
  if (!htmlModelo.trim()) return responder({ erro: "Falta o texto do e-mail." }, 400);

  // No teste, o único destinatário possível é a própria Priscilla.
  let lista: { email: string; nome: string; marca: string }[];
  if (teste) {
    const base = Array.isArray(corpo?.destinatarios) ? corpo.destinatarios[0] : null;
    lista = [{
      email: EMAIL_DONA,
      nome: primeiroNome(base?.nome) || "Camila",
      marca: String(base?.marca ?? "Marca Exemplo"),
    }];
  } else {
    if (!Array.isArray(corpo?.destinatarios) || corpo.destinatarios.length === 0) {
      return responder({ erro: "Falta a lista de destinatários." }, 400);
    }
    if (corpo.destinatarios.length > LIMITE_POR_CHAMADA) {
      return responder({ erro: `No máximo ${LIMITE_POR_CHAMADA} destinatários por chamada.` }, 400);
    }
    // Nunca manda duas vezes pro mesmo e-mail no mesmo disparo.
    const vistos = new Set<string>();
    lista = [];
    for (const d of corpo.destinatarios) {
      const email = String(d?.email ?? "").trim().toLowerCase();
      if (!emailValido(email) || vistos.has(email)) continue;
      vistos.add(email);
      lista.push({
        email,
        nome: primeiroNome(d?.nome),
        marca: String(d?.marca ?? "").trim(),
      });
    }
  }

  // ---- 3) Antes de mandar qualquer coisa, confere as tabelas de segurança ----
  // Sem a tabela de descadastro ou a de registro, a função se recusa a enviar:
  // melhor não mandar do que mandar sem poder controlar.
  const descadastrados = new Set<string>();
  if (!teste) {
    const { error: erroRegistro } = await supa.from("email_envios").select("id").limit(1);
    if (erroRegistro) {
      return responder({ erro: "A tabela email_envios não está pronta. Rode o arquivo disparo.sql no Supabase." }, 500);
    }
    const emails = lista.map((d) => d.email);
    const { data: optouts, error: erroOptout } = await supa
      .from("email_optout").select("email").in("email", emails);
    if (erroOptout) {
      return responder({ erro: "A tabela email_optout não está pronta. Rode o arquivo disparo.sql no Supabase." }, 500);
    }
    (optouts ?? []).forEach((o: { email: string }) => descadastrados.add(String(o.email).toLowerCase()));
  }

  // ---- 4) Envio, um por um, no ritmo seguro do Resend ------------------------
  let enviados = 0;
  let falhas = 0;
  let pulados = 0;
  let cotaAcabou = false;
  let dominioNaoVerificado = false;
  let faltaram = 0;
  const resultados: { email: string; ok?: boolean; pulado?: boolean; erro?: string }[] = [];
  const erros: string[] = [];

  async function registrar(
    email: string, assuntoFinal: string, ok: boolean, erro: string | null, resendId: string | null,
  ) {
    if (teste) return; // teste não entra no registro
    await supa.from("email_envios").insert({
      email,
      assunto: assuntoFinal,
      assunto_modelo: assuntoModelo,
      status: ok ? "ok" : "erro",
      erro,
      resend_id: resendId,
    });
  }

  for (let i = 0; i < lista.length; i++) {
    const d = lista[i];

    if (descadastrados.has(d.email)) {
      pulados++;
      resultados.push({ email: d.email, pulado: true });
      continue;
    }

    const assuntoFinal = (teste ? "[TESTE] " : "") + trocarVariaveis(assuntoModelo, d.nome, d.marca, false);
    const htmlFinal = trocarVariaveis(htmlModelo, d.nome, d.marca, true);

    let resposta: Response;
    let dados: any = {};
    let tentativa = 0;
    while (true) {
      resposta = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chaveResend}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: remetente,
          to: [d.email],
          subject: assuntoFinal,
          html: htmlFinal,
          reply_to: EMAIL_RESPOSTA,
          headers: { "List-Unsubscribe": `<mailto:${EMAIL_RESPOSTA}?subject=SAIR>` },
        }),
      });
      dados = await resposta.json().catch(() => ({}));
      // Se o Resend pedir pra ir mais devagar, espera e tenta de novo.
      if (resposta.status === 429 && dados?.name === "rate_limit_exceeded" && tentativa < 3) {
        tentativa++;
        await esperar(1000 * tentativa);
        continue;
      }
      break;
    }

    if (resposta.ok && dados?.id) {
      enviados++;
      resultados.push({ email: d.email, ok: true });
      await registrar(d.email, assuntoFinal, true, null, dados.id);
    } else {
      const nomeErro = String(dados?.name ?? "");
      const mensagem = String(dados?.message ?? `Erro ${resposta.status} no Resend`);

      // A cota diária acabou: para na hora e conta quantos ficaram faltando.
      if (nomeErro === "daily_quota_exceeded" || nomeErro === "monthly_quota_exceeded") {
        cotaAcabou = true;
        faltaram = lista.slice(i).filter((x) => !descadastrados.has(x.email)).length;
        break;
      }

      falhas++;
      resultados.push({ email: d.email, ok: false, erro: mensagem });
      if (erros.length < 10) erros.push(`${d.email}: ${mensagem}`);
      await registrar(d.email, assuntoFinal, false, mensagem, null);

      // Domínio ainda não verificado: o Resend só entrega pra própria dona.
      // Não adianta insistir nos outros, então para aqui.
      if (!teste && resposta.status === 403 && /testing emails|verify a domain|own email/i.test(mensagem)) {
        dominioNaoVerificado = true;
        faltaram = lista.slice(i + 1).filter((x) => !descadastrados.has(x.email)).length;
        break;
      }
    }

    await esperar(PAUSA_ENTRE_ENVIOS_MS);
  }

  return responder({
    enviados,
    falhas,
    pulados,
    cota_acabou: cotaAcabou,
    dominio_nao_verificado: dominioNaoVerificado,
    faltaram,
    resultados,
    erros,
  });
});
