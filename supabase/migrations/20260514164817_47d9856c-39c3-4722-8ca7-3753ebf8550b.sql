
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

CREATE TABLE public.app_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT,
  value_en TEXT,
  value_es TEXT,
  value_pt TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view content"
ON public.app_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage content"
ON public.app_content FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_app_content_updated_at
BEFORE UPDATE ON public.app_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_en TEXT,
  ref_en TEXT,
  text_es TEXT,
  ref_es TEXT,
  text_pt TEXT,
  ref_pt TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active verses"
ON public.verses FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage verses"
ON public.verses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_verses_updated_at
BEFORE UPDATE ON public.verses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_content (key, label, value_en, value_es, value_pt) VALUES
('home_mission_text', 'Our Mission text',
 'To unite believers around the world in prayer, biblical encouragement, and spiritual growth through Jesus Christ.',
 'Unir a los creyentes alrededor del mundo en oración, aliento bíblico y crecimiento espiritual a través de Jesucristo.',
 'Unir os crentes ao redor do mundo em oração, encorajamento bíblico e crescimento espiritual através de Jesus Cristo.'),
('home_missions_desc', 'Missions / Support text',
 'Support our global missions reaching more than 40 countries with prayer, encouragement, and biblical resources.',
 'Apoya nuestras misiones globales que alcanzan más de 40 países con oración, aliento y recursos bíblicos.',
 'Apoie nossas missões globais que alcançam mais de 40 países com oração, encorajamento e recursos bíblicos.'),
('home_devotional_title', 'Featured Devotional title',
 'Daily Prayer Journey', 'Jornada Diaria de Oración', 'Jornada Diária de Oração'),
('home_devotional_desc', 'Featured Devotional description',
 'A 7-day devotional to strengthen your prayer life and spiritual discipline.',
 'Un devocional de 7 días para fortalecer tu vida de oración y disciplina espiritual.',
 'Um devocional de 7 dias para fortalecer sua vida de oração e disciplina espiritual.'),
('home_course_title', 'Featured Course title',
 'Spiritual Foundations', 'Fundamentos Espirituales', 'Fundamentos Espirituais'),
('home_course_desc', 'Featured Course description',
 'A practical course for believers seeking to deepen their walk with God through prayer, the Word, and discipline.',
 'Un curso práctico para creyentes que buscan profundizar su caminar con Dios a través de la oración, la Palabra y la disciplina.',
 'Um curso prático para crentes que buscam aprofundar sua caminhada com Deus através da oração, da Palavra e da disciplina.'),
('home_book_desc', 'Featured Resource description',
 'A spiritual guide to listening to the inner voice of God through prayer and meditation.',
 'Una guía espiritual para escuchar la voz interior de Dios a través de la oración y la meditación.',
 'Um guia espiritual para ouvir a voz interior de Deus através da oração e meditação.');

INSERT INTO public.verses (text_en, ref_en, text_es, ref_es, text_pt, ref_pt, order_index) VALUES
('Be still, and know that I am God.', 'Psalm 46:10', 'Estad quietos, y conoced que yo soy Dios.', 'Salmo 46:10', 'Aquietai-vos, e sabei que eu sou Deus.', 'Salmo 46:10', 1),
('Pray without ceasing.', '1 Thessalonians 5:17', 'Orad sin cesar.', '1 Tesalonicenses 5:17', 'Orai sem cessar.', '1 Tessalonicenses 5:17', 2),
('The Lord is my shepherd; I shall not want.', 'Psalm 23:1', 'Jehová es mi pastor; nada me faltará.', 'Salmo 23:1', 'O Senhor é o meu pastor; nada me faltará.', 'Salmo 23:1', 3),
('I can do all things through Christ who strengthens me.', 'Philippians 4:13', 'Todo lo puedo en Cristo que me fortalece.', 'Filipenses 4:13', 'Tudo posso naquele que me fortalece.', 'Filipenses 4:13', 4),
('Your word is a lamp to my feet and a light to my path.', 'Psalm 119:105', 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.', 'Salmo 119:105', 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', 'Salmo 119:105', 5),
('Cast all your anxiety on Him because He cares for you.', '1 Peter 5:7', 'Echad toda vuestra ansiedad sobre Él, porque Él tiene cuidado de vosotros.', '1 Pedro 5:7', 'Lançai sobre Ele toda a vossa ansiedade, porque Ele tem cuidado de vós.', '1 Pedro 5:7', 6),
('The joy of the Lord is your strength.', 'Nehemiah 8:10', 'El gozo del Señor es vuestra fuerza.', 'Nehemías 8:10', 'A alegria do Senhor é a vossa força.', 'Neemias 8:10', 7),
('Trust in the Lord with all your heart.', 'Proverbs 3:5', 'Confía en Jehová con todo tu corazón.', 'Proverbios 3:5', 'Confia no Senhor de todo o teu coração.', 'Provérbios 3:5', 8),
('Seek first the kingdom of God.', 'Matthew 6:33', 'Buscad primeramente el reino de Dios.', 'Mateo 6:33', 'Buscai primeiro o reino de Deus.', 'Mateus 6:33', 9),
('The Lord is my light and my salvation.', 'Psalm 27:1', 'Jehová es mi luz y mi salvación.', 'Salmo 27:1', 'O Senhor é a minha luz e a minha salvação.', 'Salmo 27:1', 10);
