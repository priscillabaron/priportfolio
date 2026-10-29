-- Troca o vídeo do Morning Shot Sublyme pelo novo (mesmo lugar, mesmo nicho, mesma ordem).
-- Cole no SQL Editor do Supabase e clique em Run.
update public.videos
set link = 'https://youtube.com/shorts/4sxnXlYhjWg'
where link = 'https://youtube.com/shorts/ViZA5yTVuPc'
   or titulo = 'Morning Shot Sublyme';

-- Conferência: deve mostrar 1 linha com o link novo
select titulo, nicho, link, ordem, visivel
from public.videos
where link = 'https://youtube.com/shorts/4sxnXlYhjWg';
