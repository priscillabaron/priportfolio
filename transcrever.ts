// ============================================================================
// FUNÇÃO "transcrever" (a que transcreve os vídeos do Banco de Ideias)
// ============================================================================
// Este arquivo NÃO roda no seu site. Ele é copiado e colado no painel do
// Supabase: Edge Functions > Deploy a new function > Via Editor, com o nome
// exatamente "transcrever". Veja o passo a passo que está no chat.
//
// A chave do TokScript NUNCA fica aqui. Ela é guardada como segredo no painel do
// Supabase (nome: TOKSCRIPT_API_KEY) e a função só a lê na hora de transcrever.
//
// O painel manda { link, rede } e a função devolve { texto } com a transcrição.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EMAIL_DONA = "pribaronparcerias@gmail.com";      // único login aceito
const URL_TOKSCRIPT = "https://api.tokscript.com/mcp";

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

// Fala com o TokScript no formato MCP (mensagens JSON). A resposta pode vir como
// JSON puro ou como "event-stream"; os dois são lidos aqui.
async function chamarMcp(chave: string, sessao: string, corpo: unknown) {
  const cabecalhos: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Authorization": `Bearer ${chave}`,
  };
  if (sessao) cabecalhos["Mcp-Session-Id"] = sessao;
  const resp = await fetch(URL_TOKSCRIPT, { method: "POST", headers: cabecalhos, body: JSON.stringify(corpo) });
  const texto = await resp.text();
  const novaSessao = resp.headers.get("mcp-session-id") ?? sessao;
  let json: any = null;
  const tipo = resp.headers.get("content-type") ?? "";
  if (tipo.includes("text/event-stream")) {
    // pega a última linha "data: {...}" que tenha resposta
    const linhas = texto.split(/\r?\n/).filter((l) => l.startsWith("data:"));
    for (const l of linhas) {
      try {
        const j = JSON.parse(l.slice(5).trim());
        if (j && (j.result !== undefined || j.error !== undefined)) json = j;
      } catch { /* ignora */ }
    }
  } else if (texto.trim()) {
    try { json = JSON.parse(texto); } catch { /* ignora */ }
  }
  return { status: resp.status, json, texto, sessao: novaSessao };
}

function juntarTexto(resultado: any): string {
  const partes = Array.isArray(resultado?.content) ? resultado.content : [];
  return partes
    .filter((p: any) => p && p.type === "text" && typeof p.text === "string")
    .map((p: any) => p.text)
    .join("\n")
    .trim();
}

// Se o TokScript devolver um JSON (com campo transcript/text), tira só o texto.
function extrairTranscricao(bruto: string): string {
  try {
    const j = JSON.parse(bruto);
    const acha = (o: any): string => {
      if (!o) return "";
      if (typeof o === "string") return o;
      for (const k of ["transcript", "transcription", "text", "content"]) {
        if (typeof o[k] === "string" && o[k].trim()) return o[k];
        if (Array.isArray(o[k])) {
          const linhas = o[k].map((x: any) => (typeof x === "string" ? x : (x?.text ?? ""))).filter(Boolean);
          if (linhas.length) return linhas.join(" ");
        }
      }
      for (const k of ["data", "result"]) {
        const r = acha(o[k]);
        if (r) return r;
      }
      return "";
    };
    return (acha(j) || bruto).trim();
  } catch {
    return bruto.trim();
  }
}

function mensagemAmigavel(t: string): string {
  const m = t.toLowerCase();
  if (m.includes("limit") || m.includes("quota") || m.includes("too many") || m.includes("429") || m.includes("daily")) {
    return "O limite de transcrições do dia do TokScript acabou (no plano grátis são 5 por dia). Tente de novo amanhã.";
  }
  if (m.includes("unauthorized") || m.includes("invalid api key") || m.includes("401") || m.includes("expired")) {
    return "O TokScript recusou a chave. Crie uma chave nova no TokScript e guarde de novo em TOKSCRIPT_API_KEY nos segredos do Supabase.";
  }
  return "";
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

  const chave = Deno.env.get("TOKSCRIPT_API_KEY");
  if (!chave) {
    return responder({ erro: "A chave TOKSCRIPT_API_KEY ainda não foi guardada nos segredos do Supabase." }, 500);
  }

  // ---- 2) Lê o pedido ---------------------------------------------------------
  let pedido: any = {};
  try { pedido = await req.json(); } catch { /* vazio */ }
  const link = String(pedido?.link ?? "").trim();
  const rede = String(pedido?.rede ?? "").toLowerCase();
  if (!/^https?:\/\//i.test(link)) return responder({ erro: "Cole o link completo do vídeo." }, 400);
  if (!["instagram", "tiktok", "youtube"].includes(rede)) {
    return responder({ erro: "A transcrição automática funciona para Instagram, TikTok e YouTube." }, 400);
  }

  try {
    // ---- 3) Abre a conversa com o TokScript -----------------------------------
    const inicio = await chamarMcp(chave, "", {
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "painel-priscilla", version: "1.0" } },
    });
    if (inicio.status === 401 || inicio.status === 403) {
      return responder({ erro: mensagemAmigavel("unauthorized") }, 502);
    }
    if (inicio.status >= 400 && !inicio.json) {
      return responder({ erro: "O TokScript não respondeu direito (código " + inicio.status + ")." }, 502);
    }
    const sessao = inicio.sessao;
    await chamarMcp(chave, sessao, { jsonrpc: "2.0", method: "notifications/initialized" });

    // ---- 4) Descobre a ferramenta certa e o nome do campo do link ---------------
    const lista = await chamarMcp(chave, sessao, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    const ferramentas: any[] = lista.json?.result?.tools ?? [];
    const achada = ferramentas.find((f) => String(f.name).toLowerCase().includes(rede) && String(f.name).toLowerCase().includes("transcript"));
    const nomeFerramenta = achada?.name ?? `get_${rede}_transcript`;
    const props = achada?.inputSchema?.properties ?? {};
    const campoLink = Object.keys(props).find((k) => /url|link/i.test(k)) ?? "url";

    // ---- 5) Pede a transcrição ---------------------------------------------------
    const chamada = await chamarMcp(chave, sessao, {
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: nomeFerramenta, arguments: { [campoLink]: link } },
    });

    if (chamada.json?.error) {
      const t = String(chamada.json.error.message ?? "");
      return responder({ erro: mensagemAmigavel(t) || ("O TokScript não conseguiu: " + t) }, 502);
    }
    const resultado = chamada.json?.result;
    const bruto = juntarTexto(resultado);
    if (resultado?.isError) {
      return responder({ erro: mensagemAmigavel(bruto) || ("O TokScript não conseguiu: " + (bruto || "erro sem detalhes")) }, 502);
    }
    if (!bruto) {
      return responder({ erro: mensagemAmigavel(chamada.texto) || "O TokScript não devolveu texto para esse vídeo (talvez ele não tenha fala)." }, 502);
    }
    const texto = extrairTranscricao(bruto);
    return responder({ texto });
  } catch (e) {
    return responder({ erro: "Não consegui falar com o TokScript agora. Tente de novo em instantes." }, 502);
  }
});
