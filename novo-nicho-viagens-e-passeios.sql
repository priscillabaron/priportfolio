-- ============================================================================
-- Junta "Viagem" e "Passeios em Família" num nicho só: "Viagens e Passeios"
-- com 9 vídeos, na ordem pedida. Os outros vídeos desses dois nichos ficam ocultos
-- (não são apagados: para mostrar de novo, é só marcar "visível" no painel).
-- Cole tudo no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez.
-- ============================================================================

-- 1) Esconde tudo o que hoje está em Viagem e Passeios em Família
update public.videos
set visivel = false
where nicho in ('Viagem', 'Passeios em Família');

-- 2) Mostra só os 9 vídeos, no nicho novo, na ordem pedida
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 101 where link = 'https://youtube.com/shorts/cZsW7BIBSvk'; -- Parksnet Bondinhos Aéreos
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 102 where link = 'https://youtube.com/shorts/g31NRKdNpXE'; -- RQ Stay Santa Magdalena (2º)
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 103 where link = 'https://youtube.com/shorts/jkSl_oeng8g'; -- EcoResort Praia dos Carneiros
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 104 where link = 'https://youtube.com/shorts/Hf2oJI-PwOY'; -- Portillo
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 105 where link = 'https://youtube.com/shorts/27HiYs0oq4w'; -- Vinícola Undurraga
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 106 where link = 'https://youtube.com/shorts/5hCSF6YD8Lk'; -- Turkish Airlines
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 107 where link = 'https://youtube.com/shorts/KH0GT0rRzkQ'; -- Laghi & Tosi
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 108 where link = 'https://youtube.com/shorts/ZFg7JHi9uMg'; -- Fábrica Nugali
update public.videos set nicho = 'Viagens e Passeios', visivel = true, ordem = 109 where link = 'https://youtube.com/shorts/iMWCls2kkkY'; -- Parksnet NBA

-- 3) Conferência: deve listar 9 linhas, na ordem acima
select ordem, titulo, nicho, visivel
from public.videos
where nicho = 'Viagens e Passeios'
order by ordem;
