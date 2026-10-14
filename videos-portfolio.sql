-- ============================================================================
-- VÍDEOS DO PORTFÓLIO (YouTube Shorts) + remove o nicho EXEMPLO
-- Cole tudo isto no SQL Editor do Supabase e clique em Run.
-- Pode rodar mais de uma vez: ele apaga os vídeos desta lista (e o EXEMPLO)
-- antes de colocar de novo, então não duplica.
-- Não mexe em vídeos que você cadastrou à mão no painel com outro link.
-- ============================================================================

delete from public.videos
where lower(nicho) = 'exemplo'
   or link like 'https://youtube.com/shorts/%';

insert into public.videos (titulo, nicho, link, marca, destaque, formato, ordem, visivel) values
  ('Aspirador WAP', 'Casa & Decoração', 'https://youtube.com/shorts/DPAu8Rr0Bj8', '', '', '9:16', 1, true),
  ('Pillowtop Mais On', 'Casa & Decoração', 'https://youtube.com/shorts/Q4li_VZ4WoY', '', '', '9:16', 2, true),
  ('Esfregão Elétrico Limpeza', 'Casa & Decoração', 'https://youtube.com/shorts/TXrra2bviQo', '', '', '9:16', 3, true),
  ('Iluminação de Quarto GRM', 'Casa & Decoração', 'https://youtube.com/shorts/AG6BOYTFu6Y', '', '', '9:16', 4, true),
  ('Ipê Green', 'Casa & Decoração', 'https://youtube.com/shorts/bBqfFBP4b5s', '', '', '9:16', 5, true),
  ('Jogo de Cama Niazitex', 'Casa & Decoração', 'https://youtube.com/shorts/lJxRvINRpPY', '', '', '9:16', 6, true),
  ('Kit de panela Brinox', 'Casa & Decoração', 'https://youtube.com/shorts/obrlfVNqPmg', '', '', '9:16', 7, true),
  ('Limpeza Pesada Piso Clean', 'Casa & Decoração', 'https://youtube.com/shorts/AEmDKhgOegA', '', '', '9:16', 8, true),
  ('Loja Karsten', 'Casa & Decoração', 'https://youtube.com/shorts/xzPA4ijEqlA', '', '', '9:16', 9, true),
  ('Stick Multifuncional Boca Rosa', 'Beleza', 'https://youtube.com/shorts/ZpMNZ7-9lAk', '', '', '9:16', 10, true),
  ('Balm Labial Creamy', 'Beleza', 'https://youtube.com/shorts/4fSt_ZtYuzg', '', '', '9:16', 11, true),
  ('Inauguração Quiosque Vizzela', 'Beleza', 'https://youtube.com/shorts/T_-c3UDx2hE', '', '', '9:16', 12, true),
  ('Desodorante Alva', 'Beleza', 'https://youtube.com/shorts/0Z2SgnPnPTE', '', '', '9:16', 13, true),
  ('Gel de Limpeza Principia', 'Beleza', 'https://youtube.com/shorts/U3_qTCa-NC0', '', '', '9:16', 14, true),
  ('Kit de cabelo hidratei', 'Beleza', 'https://youtube.com/shorts/b8SZU47eVWQ', '', '', '9:16', 15, true),
  ('Kit pele essencial', 'Beleza', 'https://youtube.com/shorts/k9zVyoMcj78', '', '', '9:16', 16, true),
  ('Pomada de Cabelo Ricca', 'Beleza', 'https://youtube.com/shorts/fN0X2V0jktg', '', '', '9:16', 17, true),
  ('Linha Autocuidado Verbena & Bambu', 'Beleza', 'https://youtube.com/shorts/Nk-AHhhVl60', '', '', '9:16', 18, true),
  ('App City Plan Go', 'Tech & Apps', 'https://youtube.com/shorts/g_kv0cY9ZH4', '', '', '9:16', 19, true),
  ('Microfone J6', 'Tech & Apps', 'https://youtube.com/shorts/dI7evrvYErI', '', '', '9:16', 20, true),
  ('PowerBank Ovvi', 'Tech & Apps', 'https://youtube.com/shorts/MZb4sKCsUc4', '', '', '9:16', 21, true),
  ('Tela para Gravação', 'Tech & Apps', 'https://youtube.com/shorts/3xr9HkHZb28', '', '', '9:16', 22, true),
  ('Tripé Ulanzi', 'Tech & Apps', 'https://youtube.com/shorts/9mW4Dnv27Ro', '', '', '9:16', 23, true),
  ('App City Plan Go', 'Tech & Apps', 'https://youtube.com/shorts/9lOPra5Tkx8', '', '', '9:16', 24, true),
  ('Chocolates HAOMA', 'Alimentação e Suplementação', 'https://youtube.com/shorts/j6vJ5jamkdM', '', '', '9:16', 25, true),
  ('Morning Shot Sublyme', 'Alimentação e Suplementação', 'https://youtube.com/shorts/ViZA5yTVuPc', '', '', '9:16', 26, true),
  ('Marmitas Livup', 'Alimentação e Suplementação', 'https://youtube.com/shorts/swTN0rqJDpI', '', '', '9:16', 27, true),
  ('Gel Energético DUX', 'Alimentação e Suplementação', 'https://youtube.com/shorts/QYMtOe4hIk4', '', '', '9:16', 28, true),
  ('Granola Tia Sônia', 'Alimentação e Suplementação', 'https://youtube.com/shorts/p4LGPKwczlY', '', '', '9:16', 29, true),
  ('Grupo Caffeine Army', 'Alimentação e Suplementação', 'https://youtube.com/shorts/Bu0u_Nir8P4', '', '', '9:16', 30, true),
  ('Snacks Saudáveis Zaytas', 'Alimentação e Suplementação', 'https://youtube.com/shorts/HjsltcKNjSw', '', '', '9:16', 31, true),
  ('Roupas Lippi', 'Moda & Acessórios', 'https://youtube.com/shorts/iDXx3jYck6A', '', '', '9:16', 32, true),
  ('Roupas Shein', 'Moda & Acessórios', 'https://youtube.com/shorts/IBkjqAwWv6g', '', '', '9:16', 33, true),
  ('Roupas Lippi', 'Moda & Acessórios', 'https://youtube.com/shorts/pypKqo_DImY', '', '', '9:16', 34, true),
  ('Roupas Shein', 'Moda & Acessórios', 'https://youtube.com/shorts/G7E_pTxU2NI', '', '', '9:16', 35, true),
  ('Turkish Airlines', 'Viagem', 'https://youtube.com/shorts/5hCSF6YD8Lk', '', '', '9:16', 36, true),
  ('Hospedagem RQ Stay Santa Magdalena', 'Viagem', 'https://youtube.com/shorts/zEOX3NM7yFA', '', '', '9:16', 37, true),
  ('Hospedagem RQ Stay Santa Magdalena', 'Viagem', 'https://youtube.com/shorts/g31NRKdNpXE', '', '', '9:16', 38, true),
  ('Vinícola Undurraga no Chile com a Norte Sul Chile', 'Viagem', 'https://youtube.com/shorts/27HiYs0oq4w', '', '', '9:16', 39, true),
  ('Passeios no Chile com a Norte Sul Chile', 'Viagem', 'https://youtube.com/shorts/4JDvw0_lTak', '', '', '9:16', 40, true),
  ('Hospedagem EcoResort Praia dos Carneiros', 'Viagem', 'https://youtube.com/shorts/jkSl_oeng8g', '', '', '9:16', 41, true),
  ('Andes Panorâmico com a Norte Sul Chile', 'Viagem', 'https://youtube.com/shorts/DJ6QX_xdJaA', '', '', '9:16', 42, true),
  ('Portillo com a Norte Sul Chile', 'Viagem', 'https://youtube.com/shorts/Hf2oJI-PwOY', '', '', '9:16', 43, true),
  ('Laghi & Tosi', 'Passeios em Família', 'https://youtube.com/shorts/KH0GT0rRzkQ', '', '', '9:16', 44, true),
  ('Parksnet Bondinhos Aéreos', 'Passeios em Família', 'https://youtube.com/shorts/cZsW7BIBSvk', '', '', '9:16', 45, true),
  ('Parksnet NBA', 'Passeios em Família', 'https://youtube.com/shorts/iMWCls2kkkY', '', '', '9:16', 46, true),
  ('MotoRent', 'Passeios em Família', 'https://youtube.com/shorts/RoOiqxaY0K4', '', '', '9:16', 47, true),
  ('Fábrica Nugali', 'Passeios em Família', 'https://youtube.com/shorts/ZFg7JHi9uMg', '', '', '9:16', 48, true),
  ('Escova de Dente Japonesa', 'Clips & TikTok Shop', 'https://youtube.com/shorts/F2oA6jhEXU0', '', '', '9:16', 49, true),
  ('Varetas Mágicas', 'Clips & TikTok Shop', 'https://youtube.com/shorts/njP8SUnmxRs', '', '', '9:16', 50, true),
  ('Parrillita', 'Gastronomia', 'https://youtube.com/shorts/XPWyj82CFn8', '', '', '9:16', 51, true),
  ('Mille Cuca', 'Gastronomia', 'https://youtube.com/shorts/xaiO7Y3c57w', '', '', '9:16', 52, true),
  ('Bardêra Gelateria', 'Gastronomia', 'https://youtube.com/shorts/tUIT5jaY2Jw', '', '', '9:16', 53, true),
  ('Lover Cafeteria', 'Gastronomia', 'https://youtube.com/shorts/cTdEyb0eE68', '', '', '9:16', 54, true),
  ('Shopping Garden', 'Lojas e Mercados', 'https://youtube.com/shorts/IziYy4JAiFQ', '', '', '9:16', 55, true),
  ('Casa Tia Sônia', 'Lojas e Mercados', 'https://youtube.com/shorts/aoGcPZwyUmA', '', '', '9:16', 56, true),
  ('Loja Karsten', 'Lojas e Mercados', 'https://youtube.com/shorts/xzPA4ijEqlA', '', '', '9:16', 57, true),
  ('Inauguração Quiosque Vizzela', 'Lojas e Mercados', 'https://youtube.com/shorts/T_-c3UDx2hE', '', '', '9:16', 58, true),
  ('Loja Rota 99 Natal', 'Datas Especiais', 'https://youtube.com/shorts/1ZK2xFwIB_I', '', '', '9:16', 59, true),
  ('Shopping Garden Natal', 'Datas Especiais', 'https://youtube.com/shorts/OBwgEVgqImc', '', '', '9:16', 60, true);