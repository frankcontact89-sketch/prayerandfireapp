
-- Enum for library categories
DO $$ BEGIN
  CREATE TYPE public.library_category AS ENUM (
    'bible_studies','doctrine','christology','pneumatology','soteriology',
    'hermeneutics','homiletics','church_history','apologetics','leadership',
    'missions','sermons','articles'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DEVOTIONALS
CREATE TABLE public.devotionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  is_published boolean NOT NULL DEFAULT true,
  title_en text NOT NULL, title_es text, title_pt text,
  scripture_reference_en text, scripture_reference_es text, scripture_reference_pt text,
  scripture_text_en text, scripture_text_es text, scripture_text_pt text,
  context_en text, context_es text, context_pt text,
  reflection_en text, reflection_es text, reflection_pt text,
  application_en text, application_es text, application_pt text,
  prayer_en text, prayer_es text, prayer_pt text,
  questions_en text[] DEFAULT '{}', questions_es text[] DEFAULT '{}', questions_pt text[] DEFAULT '{}',
  related_verses text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.devotionals TO anon, authenticated;
GRANT ALL ON public.devotionals TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.devotionals TO authenticated;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published devotionals" ON public.devotionals FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage devotionals" ON public.devotionals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_devotionals_updated BEFORE UPDATE ON public.devotionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- READING PLANS
CREATE TABLE public.reading_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  duration_days integer NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  title_en text NOT NULL, title_es text, title_pt text,
  description_en text, description_es text, description_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reading_plans TO anon, authenticated;
GRANT ALL ON public.reading_plans TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.reading_plans TO authenticated;
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published plans" ON public.reading_plans FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage reading plans" ON public.reading_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_reading_plans_updated BEFORE UPDATE ON public.reading_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- READING PLAN DAYS
CREATE TABLE public.reading_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title_en text, title_es text, title_pt text,
  passages text[] NOT NULL DEFAULT '{}',
  UNIQUE (plan_id, day_number),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reading_plan_days TO anon, authenticated;
GRANT ALL ON public.reading_plan_days TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.reading_plan_days TO authenticated;
ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plan days" ON public.reading_plan_days FOR SELECT USING (true);
CREATE POLICY "Admins manage plan days" ON public.reading_plan_days FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- READING PLAN PROGRESS
CREATE TABLE public.reading_plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id, day_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_plan_progress TO authenticated;
GRANT ALL ON public.reading_plan_progress TO service_role;
ALTER TABLE public.reading_plan_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.reading_plan_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LIBRARY ARTICLES
CREATE TABLE public.library_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category public.library_category NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  cover_image_url text,
  title_en text NOT NULL, title_es text, title_pt text,
  summary_en text, summary_es text, summary_pt text,
  body_en text, body_es text, body_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_articles TO anon, authenticated;
GRANT ALL ON public.library_articles TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.library_articles TO authenticated;
ALTER TABLE public.library_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published articles" ON public.library_articles FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage articles" ON public.library_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_library_articles_updated BEFORE UPDATE ON public.library_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED DEVOTIONALS (today + 2 past days)
INSERT INTO public.devotionals (date, title_en, title_es, title_pt,
  scripture_reference_en, scripture_reference_es, scripture_reference_pt,
  scripture_text_en, scripture_text_es, scripture_text_pt,
  context_en, context_es, context_pt,
  reflection_en, reflection_es, reflection_pt,
  application_en, application_es, application_pt,
  prayer_en, prayer_es, prayer_pt,
  questions_en, questions_es, questions_pt, related_verses)
VALUES
(CURRENT_DATE, 'Walking in the Light', 'Caminando en la Luz', 'Andando na Luz',
 '1 John 1:7','1 Juan 1:7','1 João 1:7',
 'But if we walk in the light, as he is in the light, we have fellowship one with another, and the blood of Jesus Christ his Son cleanseth us from all sin.',
 'Pero si andamos en luz, como él está en luz, tenemos comunión unos con otros, y la sangre de Jesucristo su Hijo nos limpia de todo pecado.',
 'Se, porém, andarmos na luz, como ele está na luz, temos comunhão uns com os outros, e o sangue de Jesus Cristo, seu Filho, nos purifica de todo pecado.',
 'John writes to believers about the nature of true fellowship with God.',
 'Juan escribe a los creyentes sobre la naturaleza de la verdadera comunión con Dios.',
 'João escreve aos crentes sobre a natureza da verdadeira comunhão com Deus.',
 'To walk in the light is to live in transparency before God, allowing His truth to expose and cleanse our hearts daily.',
 'Andar en la luz es vivir en transparencia delante de Dios, permitiendo que Su verdad exponga y limpie nuestro corazón cada día.',
 'Andar na luz é viver em transparência diante de Deus, permitindo que Sua verdade exponha e purifique nosso coração diariamente.',
 'Examine one area of your life today where you have been hiding from the light. Bring it before God in prayer.',
 'Examina un área de tu vida hoy donde has estado escondiéndote de la luz. Preséntala ante Dios en oración.',
 'Examine hoje uma área de sua vida onde você tem se escondido da luz. Traga-a diante de Deus em oração.',
 'Father, cleanse me by the blood of Jesus. Help me to walk transparently before You today. Amen.',
 'Padre, límpiame por la sangre de Jesús. Ayúdame a caminar transparente delante de Ti hoy. Amén.',
 'Pai, purifica-me pelo sangue de Jesus. Ajuda-me a andar transparente diante de Ti hoje. Amém.',
 ARRAY['Where am I resisting God''s light?','What does fellowship with other believers look like for me?'],
 ARRAY['¿Dónde estoy resistiendo la luz de Dios?','¿Cómo se ve la comunión con otros creyentes en mi vida?'],
 ARRAY['Onde estou resistindo à luz de Deus?','Como é a comunhão com outros crentes na minha vida?'],
 ARRAY['Ephesians 5:8','John 8:12']),
(CURRENT_DATE - 1, 'The Peace of Christ', 'La Paz de Cristo', 'A Paz de Cristo',
 'John 14:27','Juan 14:27','João 14:27',
 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.',
 'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.',
 'Jesus speaks these words to His disciples the night before the crucifixion.',
 'Jesús pronuncia estas palabras a Sus discípulos la noche antes de la crucifixión.',
 'Jesus pronuncia estas palavras aos Seus discípulos na noite antes da crucificação.',
 'The peace of Christ is not the absence of trouble but the presence of Him in every trouble.',
 'La paz de Cristo no es la ausencia de problemas, sino Su presencia en cada problema.',
 'A paz de Cristo não é a ausência de problemas, mas a Sua presença em cada problema.',
 'Name your greatest anxiety today. Speak Christ''s peace over it.',
 'Nombra tu mayor ansiedad hoy. Declara la paz de Cristo sobre ella.',
 'Nomeie sua maior ansiedade hoje. Declare a paz de Cristo sobre ela.',
 'Lord Jesus, still my heart with Your peace today.','Señor Jesús, aquieta mi corazón con Tu paz hoy.','Senhor Jesus, aquieta meu coração com Tua paz hoje.',
 ARRAY['What robs my peace today?'], ARRAY['¿Qué roba mi paz hoy?'], ARRAY['O que rouba minha paz hoje?'],
 ARRAY['Philippians 4:6-7','Isaiah 26:3']),
(CURRENT_DATE - 2, 'Renewed Strength', 'Fuerzas Renovadas', 'Forças Renovadas',
 'Isaiah 40:31','Isaías 40:31','Isaías 40:31',
 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.',
 'Mas os que esperam no SENHOR renovarão as suas forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.',
 'Isaiah writes to a weary people in exile, promising divine renewal.',
 'Isaías escribe a un pueblo cansado en el exilio, prometiendo renovación divina.',
 'Isaías escreve a um povo cansado no exílio, prometendo renovação divina.',
 'To wait on the Lord is active trust — expecting Him to act while resting in His timing.',
 'Esperar en el Señor es confianza activa: esperar que Él actúe mientras descansamos en Su tiempo.',
 'Esperar no Senhor é confiança ativa — esperar que Ele aja enquanto descansamos no Seu tempo.',
 'Take five minutes in silence today. Wait on God without asking.',
 'Toma cinco minutos en silencio hoy. Espera en Dios sin pedir nada.',
 'Reserve cinco minutos em silêncio hoje. Espere em Deus sem pedir nada.',
 'Lord, renew my strength as I wait on You.','Señor, renueva mis fuerzas mientras espero en Ti.','Senhor, renova minhas forças enquanto espero em Ti.',
 ARRAY['Where am I weary?'], ARRAY['¿Dónde estoy cansado?'], ARRAY['Onde estou cansado?'],
 ARRAY['Matthew 11:28','Psalm 27:14']);

-- SEED READING PLANS
WITH p1 AS (
  INSERT INTO public.reading_plans (slug, duration_days, order_index, title_en, title_es, title_pt, description_en, description_es, description_pt)
  VALUES ('gospels-in-30-days', 30, 1,
    'The Gospels in 30 Days','Los Evangelios en 30 Días','Os Evangelhos em 30 Dias',
    'Read through Matthew, Mark, Luke and John in one month.',
    'Lee Mateo, Marcos, Lucas y Juan en un mes.',
    'Leia Mateus, Marcos, Lucas e João em um mês.') RETURNING id
), p2 AS (
  INSERT INTO public.reading_plans (slug, duration_days, order_index, title_en, title_es, title_pt, description_en, description_es, description_pt)
  VALUES ('psalms-and-proverbs', 31, 2,
    'Psalms & Proverbs','Salmos y Proverbios','Salmos e Provérbios',
    'A month of worship and wisdom.','Un mes de adoración y sabiduría.','Um mês de adoração e sabedoria.') RETURNING id
)
INSERT INTO public.reading_plan_days (plan_id, day_number, title_en, passages)
SELECT id, gs, 'Day ' || gs, ARRAY['Matthew ' || gs] FROM p1, generate_series(1,30) gs
UNION ALL
SELECT id, gs, 'Day ' || gs, ARRAY['Psalm ' || gs, 'Proverbs ' || ((gs-1)%31 + 1)] FROM p2, generate_series(1,31) gs;

-- SEED LIBRARY ARTICLES
INSERT INTO public.library_articles (slug, category, order_index, title_en, title_es, title_pt, summary_en, summary_es, summary_pt, body_en, body_es, body_pt) VALUES
('what-is-the-gospel','doctrine',1,
 'What is the Gospel?','¿Qué es el Evangelio?','O que é o Evangelho?',
 'A concise biblical explanation of the good news of Jesus Christ.',
 'Una explicación bíblica concisa de las buenas nuevas de Jesucristo.',
 'Uma explicação bíblica concisa das boas novas de Jesus Cristo.',
 E'## The Gospel\n\nThe gospel is the good news that God, through the life, death, and resurrection of Jesus Christ, has provided the way for sinners to be reconciled to Himself.\n\n### Four Truths\n\n1. **God is holy** — Isaiah 6:3\n2. **We are sinners** — Romans 3:23\n3. **Christ died and rose for sinners** — 1 Corinthians 15:3-4\n4. **We respond by faith and repentance** — Acts 20:21\n\nThis is the message the Church proclaims to every generation.',
 E'## El Evangelio\n\nEl evangelio son las buenas nuevas de que Dios, a través de la vida, muerte y resurrección de Jesucristo, ha provisto el camino para que los pecadores sean reconciliados con Él.\n\n### Cuatro verdades\n\n1. **Dios es santo** — Isaías 6:3\n2. **Somos pecadores** — Romanos 3:23\n3. **Cristo murió y resucitó por los pecadores** — 1 Corintios 15:3-4\n4. **Respondemos por fe y arrepentimiento** — Hechos 20:21',
 E'## O Evangelho\n\nO evangelho é a boa nova de que Deus, através da vida, morte e ressurreição de Jesus Cristo, providenciou o caminho para que os pecadores sejam reconciliados com Ele.\n\n### Quatro Verdades\n\n1. **Deus é santo** — Isaías 6:3\n2. **Somos pecadores** — Romanos 3:23\n3. **Cristo morreu e ressuscitou pelos pecadores** — 1 Coríntios 15:3-4\n4. **Respondemos pela fé e arrependimento** — Atos 20:21'),
('who-is-jesus','christology',1,
 'Who is Jesus Christ?','¿Quién es Jesucristo?','Quem é Jesus Cristo?',
 'The eternal Son of God, fully God and fully man.',
 'El eterno Hijo de Dios, plenamente Dios y plenamente hombre.',
 'O eterno Filho de Deus, plenamente Deus e plenamente homem.',
 E'## The Person of Christ\n\nJesus of Nazareth is the eternal Son of God who took on human flesh (John 1:14). He is one Person with two natures — fully divine and fully human — united forever without confusion or division.\n\nHe lived a sinless life, died a substitutionary death, rose bodily on the third day, and now reigns at the right hand of the Father.',
 E'## La Persona de Cristo\n\nJesús de Nazaret es el eterno Hijo de Dios que se hizo carne (Juan 1:14). Es una Persona con dos naturalezas: plenamente divina y plenamente humana.',
 E'## A Pessoa de Cristo\n\nJesus de Nazaré é o eterno Filho de Deus que se fez carne (João 1:14). Ele é uma Pessoa com duas naturezas — plenamente divina e plenamente humana.'),
('inductive-bible-study','hermeneutics',1,
 'Inductive Bible Study Method','Método Inductivo de Estudio Bíblico','Método Indutivo de Estudo Bíblico',
 'Observation, interpretation, and application — the three steps for studying any passage.',
 'Observación, interpretación y aplicación: los tres pasos para estudiar cualquier pasaje.',
 'Observação, interpretação e aplicação — os três passos para estudar qualquer passagem.',
 E'## Three Steps\n\n1. **Observation** — What does the text say?\n2. **Interpretation** — What does it mean?\n3. **Application** — How do I live it?\n\nAsk the six questions: who, what, when, where, why, how.',
 E'## Tres Pasos\n\n1. **Observación** — ¿Qué dice el texto?\n2. **Interpretación** — ¿Qué significa?\n3. **Aplicación** — ¿Cómo lo vivo?',
 E'## Três Passos\n\n1. **Observação** — O que o texto diz?\n2. **Interpretação** — O que significa?\n3. **Aplicação** — Como vivo isso?');
