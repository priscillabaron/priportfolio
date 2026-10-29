-- Tira o nicho "Datas Especiais": os vídeos dele passam para "Lojas e Mercados" (ficam no fim da lista desse nicho).
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez.
update public.videos
set nicho = 'Lojas e Mercados'
where nicho = 'Datas Especiais';

-- Conferência: deve listar os vídeos de Lojas e Mercados (os 4 de antes + Rota 99 Natal e Shopping Garden Natal)
select ordem, titulo, nicho, visivel
from public.videos
where nicho = 'Lojas e Mercados'
order by ordem;
