-- ============================================================================
-- Vídeo da Sweet Quarantine: vira destaque no lugar da Laghi & Tosi
-- e fica como o PRIMEIRO vídeo do nicho Gastronomia.
-- Cole tudo no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez.
-- ATENÇÃO: o vídeo no YouTube precisa estar "Não listado" ou "Público" (hoje está privado).
-- ============================================================================

-- 1) Laghi & Tosi deixa de ser destaque (continua no nicho dela)
update public.videos
set destaque = ''
where link = 'https://youtube.com/shorts/KH0GT0rRzkQ';

-- 2) Coloca o vídeo da Sweet Quarantine (apaga antes, para não duplicar se rodar de novo)
delete from public.videos
where link = 'https://youtube.com/shorts/I6X4siHUico';

-- A ordem 44 é a mesma que a Laghi & Tosi tinha (mesma posição nos destaques)
-- e é menor que a dos outros vídeos de Gastronomia (51 em diante), então fica em primeiro no nicho.
insert into public.videos (titulo, nicho, link, marca, destaque, formato, ordem, visivel) values
  ('Sweet Quarantine', 'Gastronomia', 'https://youtube.com/shorts/I6X4siHUico', 'Sweet Quarantine', 'Destaque', '9:16', 44, true);
