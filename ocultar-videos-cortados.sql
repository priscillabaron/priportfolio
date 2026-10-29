-- Tira do site os vídeos cortados: Zaytas, Grupo Caffeine Army e Boca Rosa.
-- Eles ficam ocultos (não apagados): para mostrar de novo, marque "visível" no painel.
-- Cole no SQL Editor do Supabase e clique em Run.
update public.videos
set visivel = false
where link in (
        'https://youtube.com/shorts/HjsltcKNjSw',  -- Snacks Saudáveis Zaytas
        'https://youtube.com/shorts/Bu0u_Nir8P4',  -- Grupo Caffeine Army
        'https://youtube.com/shorts/ZpMNZ7-9lAk',  -- Stick Multifuncional Boca Rosa
        'https://youtube.com/shorts/p4LGPKwczlY'   -- Granola Tia Sônia
      )
   or titulo in ('Snacks Saudáveis Zaytas', 'Grupo Caffeine Army', 'Stick Multifuncional Boca Rosa', 'Granola Tia Sônia');

-- Conferência: deve mostrar 4 linhas, todas com visivel = false
select titulo, nicho, visivel
from public.videos
where titulo in ('Snacks Saudáveis Zaytas', 'Grupo Caffeine Army', 'Stick Multifuncional Boca Rosa', 'Granola Tia Sônia');
