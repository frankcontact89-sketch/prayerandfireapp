
-- ============ PRODUCTS UPGRADE ============
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS stock_status text NOT NULL DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ============ SOLAS ============
CREATE TABLE IF NOT EXISTS public.solas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  latin text NOT NULL,
  name_en text NOT NULL,
  name_es text NOT NULL,
  name_pt text NOT NULL,
  translation_en text NOT NULL,
  translation_es text NOT NULL,
  translation_pt text NOT NULL,
  explanation_en text,
  explanation_es text,
  explanation_pt text,
  history_en text,
  history_es text,
  history_pt text,
  verses_en text,
  verses_es text,
  verses_pt text,
  application_en text,
  application_es text,
  application_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.solas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.solas TO authenticated;
GRANT ALL ON public.solas TO service_role;

ALTER TABLE public.solas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view solas" ON public.solas FOR SELECT USING (true);
CREATE POLICY "Admins can insert solas" ON public.solas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update solas" ON public.solas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete solas" ON public.solas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER solas_updated_at BEFORE UPDATE ON public.solas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ GREEK WORDS ============
CREATE TABLE IF NOT EXISTS public.greek_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  greek text NOT NULL,
  transliteration text NOT NULL,
  pronunciation text NOT NULL,
  meaning_en text NOT NULL,
  meaning_es text NOT NULL,
  meaning_pt text NOT NULL,
  biblical_usage_en text,
  biblical_usage_es text,
  biblical_usage_pt text,
  scripture_refs text,
  explanation_en text,
  explanation_es text,
  explanation_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.greek_words TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.greek_words TO authenticated;
GRANT ALL ON public.greek_words TO service_role;

ALTER TABLE public.greek_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view greek_words" ON public.greek_words FOR SELECT USING (true);
CREATE POLICY "Admins can insert greek_words" ON public.greek_words FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update greek_words" ON public.greek_words FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete greek_words" ON public.greek_words FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER greek_words_updated_at BEFORE UPDATE ON public.greek_words
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED SOLAS ============
INSERT INTO public.solas (slug, order_index, latin, name_en, name_es, name_pt, translation_en, translation_es, translation_pt,
  explanation_en, explanation_es, explanation_pt,
  history_en, history_es, history_pt,
  verses_en, verses_es, verses_pt,
  application_en, application_es, application_pt) VALUES
('sola-scriptura', 1, 'Sola Scriptura', 'Sola Scriptura', 'Sola Scriptura', 'Sola Scriptura',
 'Scripture Alone', 'Solo la Escritura', 'Somente a Escritura',
 'Sola Scriptura teaches that the Bible is the supreme and final authority for all matters of faith and practice. While tradition, reason, and experience have value, only Scripture is inspired by God and infallible. All doctrine must be tested against the written Word.',
 'Sola Scriptura enseña que la Biblia es la autoridad suprema y final en todo asunto de fe y práctica. Aunque la tradición, la razón y la experiencia tienen valor, solo la Escritura es inspirada por Dios e infalible. Toda doctrina debe ser probada por la Palabra escrita.',
 'Sola Scriptura ensina que a Bíblia é a autoridade suprema e final em toda matéria de fé e prática. Embora tradição, razão e experiência tenham valor, somente a Escritura é inspirada por Deus e infalível. Toda doutrina deve ser testada pela Palavra escrita.',
 'Formulated during the Protestant Reformation of the 16th century, Sola Scriptura was Martin Luther''s response to the Roman Catholic elevation of church tradition alongside Scripture. At the Diet of Worms (1521), Luther declared his conscience captive to the Word of God.',
 'Formulada durante la Reforma Protestante del siglo XVI, Sola Scriptura fue la respuesta de Martín Lutero a la elevación de la tradición junto a la Escritura por la Iglesia Católica Romana. En la Dieta de Worms (1521), Lutero declaró su conciencia cautiva a la Palabra de Dios.',
 'Formulada durante a Reforma Protestante do século XVI, Sola Scriptura foi a resposta de Martinho Lutero à elevação da tradição ao lado da Escritura pela Igreja Católica Romana. Na Dieta de Worms (1521), Lutero declarou sua consciência cativa à Palavra de Deus.',
 '2 Timothy 3:16–17; Isaiah 8:20; Matthew 4:4; Acts 17:11; Revelation 22:18–19',
 '2 Timoteo 3:16–17; Isaías 8:20; Mateo 4:4; Hechos 17:11; Apocalipsis 22:18–19',
 '2 Timóteo 3:16–17; Isaías 8:20; Mateus 4:4; Atos 17:11; Apocalipse 22:18–19',
 'Read Scripture daily. Weigh every teaching — sermon, book, or trend — against the Bible. Let God''s Word shape your convictions rather than culture or personal preference.',
 'Lee la Escritura diariamente. Pesa toda enseñanza — sermón, libro o tendencia — contra la Biblia. Deja que la Palabra de Dios forme tus convicciones y no la cultura o preferencia personal.',
 'Leia as Escrituras diariamente. Pese todo ensino — sermão, livro ou tendência — pela Bíblia. Deixe a Palavra de Deus formar suas convicções, e não a cultura ou preferência pessoal.'),

('sola-fide', 2, 'Sola Fide', 'Sola Fide', 'Sola Fide', 'Sola Fide',
 'Faith Alone', 'Solo la Fe', 'Somente a Fé',
 'Sola Fide teaches that we are justified — declared righteous before God — by faith alone in Jesus Christ, apart from any works of the law. Faith is the empty hand that receives the finished work of Christ.',
 'Sola Fide enseña que somos justificados — declarados justos delante de Dios — por la fe sola en Jesucristo, aparte de cualquier obra de la ley. La fe es la mano vacía que recibe la obra terminada de Cristo.',
 'Sola Fide ensina que somos justificados — declarados justos diante de Deus — pela fé somente em Jesus Cristo, à parte de qualquer obra da lei. A fé é a mão vazia que recebe a obra consumada de Cristo.',
 'Luther rediscovered this truth studying Romans 1:17. The medieval church had taught justification through faith combined with sacraments and merit. The Reformers restored Paul''s gospel: righteousness is a gift, received, never earned.',
 'Lutero redescubrió esta verdad estudiando Romanos 1:17. La iglesia medieval enseñaba la justificación por la fe combinada con sacramentos y méritos. Los Reformadores restauraron el evangelio de Pablo: la justicia es un don recibido, nunca ganado.',
 'Lutero redescobriu esta verdade estudando Romanos 1:17. A igreja medieval ensinava justificação pela fé combinada com sacramentos e méritos. Os Reformadores restauraram o evangelho de Paulo: a justiça é um dom recebido, nunca conquistado.',
 'Romans 3:28; Romans 4:5; Galatians 2:16; Ephesians 2:8–9; Philippians 3:9',
 'Romanos 3:28; Romanos 4:5; Gálatas 2:16; Efesios 2:8–9; Filipenses 3:9',
 'Romanos 3:28; Romanos 4:5; Gálatas 2:16; Efésios 2:8–9; Filipenses 3:9',
 'Stop trying to earn what Christ has already secured. Rest in His righteousness. Good works flow from faith, not toward it.',
 'Deja de intentar ganar lo que Cristo ya aseguró. Descansa en Su justicia. Las buenas obras fluyen de la fe, no hacia ella.',
 'Pare de tentar merecer o que Cristo já garantiu. Descanse em Sua justiça. As boas obras fluem da fé, não em direção a ela.'),

('sola-gratia', 3, 'Sola Gratia', 'Sola Gratia', 'Sola Gratia', 'Sola Gratia',
 'Grace Alone', 'Solo la Gracia', 'Somente a Graça',
 'Sola Gratia teaches that salvation is entirely a gift of God''s unmerited favor. From election to calling to justification to glorification, every step is grace. We contribute nothing to our salvation but the sin from which we are saved.',
 'Sola Gratia enseña que la salvación es enteramente un don del favor inmerecido de Dios. Desde la elección hasta la vocación, la justificación y la glorificación, cada paso es gracia. No aportamos nada a nuestra salvación excepto el pecado del cual somos salvados.',
 'Sola Gratia ensina que a salvação é inteiramente um dom do favor imerecido de Deus. Da eleição ao chamado, à justificação e à glorificação, cada passo é graça. Nada contribuímos para nossa salvação senão o pecado do qual somos salvos.',
 'Augustine defended grace against Pelagius in the 5th century. A thousand years later the Reformers, especially Calvin, systematized this truth in response to any doctrine that made grace dependent on human cooperation or merit.',
 'Agustín defendió la gracia contra Pelagio en el siglo V. Mil años después los Reformadores, especialmente Calvino, sistematizaron esta verdad frente a toda doctrina que hacía la gracia dependiente de la cooperación o mérito humano.',
 'Agostinho defendeu a graça contra Pelágio no século V. Mil anos depois os Reformadores, especialmente Calvino, sistematizaram esta verdade contra toda doutrina que tornava a graça dependente da cooperação ou mérito humano.',
 'Ephesians 2:4–9; Romans 11:6; Titus 3:5–7; 2 Timothy 1:9; Romans 9:16',
 'Efesios 2:4–9; Romanos 11:6; Tito 3:5–7; 2 Timoteo 1:9; Romanos 9:16',
 'Efésios 2:4–9; Romanos 11:6; Tito 3:5–7; 2 Timóteo 1:9; Romanos 9:16',
 'Cultivate humility and gratitude. Never boast in your walk with God — every good thing is grace. Extend that same grace to others.',
 'Cultiva humildad y gratitud. Nunca te jactes de tu caminar con Dios — todo lo bueno es gracia. Extiende esa misma gracia a otros.',
 'Cultive humildade e gratidão. Nunca se vanglorie de sua caminhada com Deus — todo bem é graça. Estenda essa mesma graça aos outros.'),

('solus-christus', 4, 'Solus Christus', 'Solus Christus', 'Solus Christus', 'Solus Christus',
 'Christ Alone', 'Solo Cristo', 'Somente Cristo',
 'Solus Christus teaches that Jesus Christ is the sole mediator between God and man. His life, death, and resurrection are the only ground of our salvation. No saint, priest, ritual, or sacrament can add to His finished work.',
 'Solus Christus enseña que Jesucristo es el único mediador entre Dios y el hombre. Su vida, muerte y resurrección son el único fundamento de nuestra salvación. Ningún santo, sacerdote, rito o sacramento puede añadir a Su obra consumada.',
 'Solus Christus ensina que Jesus Cristo é o único mediador entre Deus e o homem. Sua vida, morte e ressurreição são o único fundamento de nossa salvação. Nenhum santo, sacerdote, rito ou sacramento pode acrescentar à Sua obra consumada.',
 'The Reformers rejected the medieval system of intermediaries — Mary, the saints, the priesthood — and returned to the New Testament''s exclusive focus on Christ as prophet, priest, and king.',
 'Los Reformadores rechazaron el sistema medieval de intermediarios — María, los santos, el sacerdocio — y regresaron al enfoque exclusivo del Nuevo Testamento en Cristo como profeta, sacerdote y rey.',
 'Os Reformadores rejeitaram o sistema medieval de intermediários — Maria, os santos, o sacerdócio — e retornaram ao foco exclusivo do Novo Testamento em Cristo como profeta, sacerdote e rei.',
 'John 14:6; 1 Timothy 2:5; Acts 4:12; Hebrews 7:25; Hebrews 10:12',
 'Juan 14:6; 1 Timoteo 2:5; Hechos 4:12; Hebreos 7:25; Hebreos 10:12',
 'João 14:6; 1 Timóteo 2:5; Atos 4:12; Hebreus 7:25; Hebreus 10:12',
 'Pray directly to the Father through Christ. Trust His sufficiency — you need no other advocate. Point others to Him alone.',
 'Ora directamente al Padre por medio de Cristo. Confía en Su suficiencia — no necesitas otro abogado. Señala a otros a Él solo.',
 'Ore diretamente ao Pai por meio de Cristo. Confie em Sua suficiência — não precisa de outro advogado. Aponte outros somente para Ele.'),

('soli-deo-gloria', 5, 'Soli Deo Gloria', 'Soli Deo Gloria', 'Soli Deo Gloria', 'Soli Deo Gloria',
 'Glory to God Alone', 'Gloria solo a Dios', 'Glória somente a Deus',
 'Soli Deo Gloria teaches that all of life exists for the glory of God. Salvation, worship, work, and rest — everything ultimately serves to magnify Him. No credit for our redemption or our lives belongs to us.',
 'Soli Deo Gloria enseña que toda la vida existe para la gloria de Dios. Salvación, adoración, trabajo y descanso — todo sirve finalmente para magnificarle. Ningún mérito por nuestra redención o nuestras vidas nos pertenece.',
 'Soli Deo Gloria ensina que toda a vida existe para a glória de Deus. Salvação, adoração, trabalho e descanso — tudo serve finalmente para magnificá-Lo. Nenhum mérito por nossa redenção ou nossas vidas nos pertence.',
 'This was the Reformers'' capstone: if Scripture, faith, grace, and Christ alone save us, then God alone gets the glory. J.S. Bach famously signed his manuscripts "S.D.G." to dedicate his art to God.',
 'Este fue el cierre de los Reformadores: si la Escritura, la fe, la gracia y Cristo solo nos salvan, entonces solo Dios recibe la gloria. J.S. Bach firmaba sus manuscritos "S.D.G." para dedicar su arte a Dios.',
 'Este foi o arremate dos Reformadores: se Escritura, fé, graça e Cristo somente nos salvam, então somente Deus recebe a glória. J.S. Bach assinava seus manuscritos "S.D.G." para dedicar sua arte a Deus.',
 '1 Corinthians 10:31; Romans 11:36; Psalm 115:1; Isaiah 42:8; Revelation 4:11',
 '1 Corintios 10:31; Romanos 11:36; Salmo 115:1; Isaías 42:8; Apocalipsis 4:11',
 '1 Coríntios 10:31; Romanos 11:36; Salmo 115:1; Isaías 42:8; Apocalipse 4:11',
 'Do everything — eating, working, resting — to God''s glory. Refuse to steal credit that belongs to Him. Let your life point beyond yourself.',
 'Haz todo — comer, trabajar, descansar — para la gloria de Dios. Rehúsa robar el crédito que le pertenece. Que tu vida apunte más allá de ti mismo.',
 'Faça tudo — comer, trabalhar, descansar — para a glória de Deus. Recuse-se a roubar o crédito que Lhe pertence. Que sua vida aponte além de você mesmo.')
ON CONFLICT (slug) DO NOTHING;

-- ============ SEED GREEK WORDS (10 starters) ============
INSERT INTO public.greek_words (slug, order_index, greek, transliteration, pronunciation,
  meaning_en, meaning_es, meaning_pt,
  biblical_usage_en, biblical_usage_es, biblical_usage_pt,
  scripture_refs,
  explanation_en, explanation_es, explanation_pt) VALUES
('agape', 1, 'ἀγάπη', 'agapē', 'ah-GAH-pay',
 'Selfless, sacrificial, unconditional love','Amor abnegado, sacrificial e incondicional','Amor abnegado, sacrificial e incondicional',
 'The love God has for humanity, and the love believers are called to show one another.','El amor que Dios tiene por la humanidad, y el amor que los creyentes deben mostrarse unos a otros.','O amor que Deus tem pela humanidade, e o amor que os crentes devem mostrar uns aos outros.',
 'John 3:16; 1 Corinthians 13; 1 John 4:8',
 'Agape describes the highest form of love — love that gives without expecting return. It is the defining mark of Christian discipleship.','Agape describe la forma más alta de amor — un amor que da sin esperar retorno. Es la marca distintiva del discipulado cristiano.','Agape descreve a forma mais alta de amor — amor que dá sem esperar retorno. É a marca distintiva do discipulado cristão.'),

('logos', 2, 'λόγος', 'logos', 'LOH-gos',
 'Word, message, reason','Palabra, mensaje, razón','Palavra, mensagem, razão',
 'Used of Jesus as the eternal Word of God who reveals the Father.','Usado de Jesús como la Palabra eterna de Dios que revela al Padre.','Usado de Jesus como a Palavra eterna de Deus que revela o Pai.',
 'John 1:1–14; Hebrews 4:12; Revelation 19:13',
 'John opens his Gospel by identifying Christ as the Logos — God''s self-expression made flesh.','Juan abre su Evangelio identificando a Cristo como el Logos — la autoexpresión de Dios hecha carne.','João abre seu Evangelho identificando Cristo como o Logos — a autoexpressão de Deus feita carne.'),

('christos', 3, 'Χριστός', 'Christos', 'khrist-OS',
 'Anointed One, Messiah','Ungido, Mesías','Ungido, Messias',
 'The title given to Jesus as the promised King and Deliverer.','El título dado a Jesús como el Rey y Libertador prometido.','O título dado a Jesus como o Rei e Libertador prometido.',
 'Matthew 16:16; John 20:31; Acts 2:36',
 'Christos is the Greek equivalent of the Hebrew Mashiach. To confess Jesus as Christ is to confess Him as the promised King.','Christos es el equivalente griego del hebreo Mashiach. Confesar a Jesús como Cristo es confesarle como el Rey prometido.','Christos é o equivalente grego do hebraico Mashiach. Confessar Jesus como Cristo é confessá-Lo como o Rei prometido.'),

('pistis', 4, 'πίστις', 'pistis', 'PIS-tis',
 'Faith, trust, faithfulness','Fe, confianza, fidelidad','Fé, confiança, fidelidade',
 'The trust that receives God''s promises and clings to Christ for salvation.','La confianza que recibe las promesas de Dios y se aferra a Cristo para la salvación.','A confiança que recebe as promessas de Deus e se apega a Cristo para a salvação.',
 'Hebrews 11:1; Romans 10:17; Ephesians 2:8',
 'Pistis is more than intellectual assent — it is heart-level trust that transforms how we live.','Pistis es más que asentimiento intelectual — es confianza del corazón que transforma cómo vivimos.','Pistis é mais que assentimento intelectual — é confiança do coração que transforma como vivemos.'),

('charis', 5, 'χάρις', 'charis', 'KHAR-is',
 'Grace, unmerited favor','Gracia, favor inmerecido','Graça, favor imerecido',
 'God''s free gift of salvation and daily kindness toward His people.','El don gratuito de salvación de Dios y bondad diaria hacia Su pueblo.','O dom gratuito de salvação de Deus e bondade diária para com Seu povo.',
 'Ephesians 2:8; 2 Corinthians 12:9; Titus 2:11',
 'Charis is the very atmosphere of the gospel — everything received from God is unearned.','Charis es la atmósfera misma del evangelio — todo lo recibido de Dios es inmerecido.','Charis é a atmosfera do evangelho — tudo o que recebemos de Deus é imerecido.'),

('kurios', 6, 'κύριος', 'kurios', 'KOO-ree-os',
 'Lord, master','Señor, amo','Senhor, mestre',
 'A divine title applied to Jesus, affirming His deity and rightful rule.','Un título divino aplicado a Jesús, afirmando Su deidad y gobierno legítimo.','Um título divino aplicado a Jesus, afirmando Sua deidade e domínio legítimo.',
 'Romans 10:9; Philippians 2:11; Acts 2:36',
 'To call Jesus Kurios is to submit every part of life to His authority.','Llamar a Jesús Kurios es someter cada parte de la vida a Su autoridad.','Chamar Jesus de Kurios é submeter cada parte da vida à Sua autoridade.'),

('ekklesia', 7, 'ἐκκλησία', 'ekklēsia', 'ek-klay-SEE-ah',
 'Church, called-out assembly','Iglesia, asamblea llamada','Igreja, assembleia chamada',
 'The gathered people of God, both local congregations and the universal church.','El pueblo reunido de Dios, tanto congregaciones locales como la iglesia universal.','O povo reunido de Deus, tanto congregações locais como a igreja universal.',
 'Matthew 16:18; Acts 2:47; Ephesians 5:25',
 'The church is not a building but a people called out of the world by Christ for worship and mission.','La iglesia no es un edificio sino un pueblo llamado del mundo por Cristo para adoración y misión.','A igreja não é um edifício mas um povo chamado do mundo por Cristo para adoração e missão.'),

('baptizo', 8, 'βαπτίζω', 'baptizō', 'bap-TID-zoh',
 'To immerse, to baptize','Sumergir, bautizar','Imergir, batizar',
 'The act of baptism as public identification with the death, burial, and resurrection of Christ.','El acto del bautismo como identificación pública con la muerte, sepultura y resurrección de Cristo.','O ato do batismo como identificação pública com a morte, sepultamento e ressurreição de Cristo.',
 'Matthew 28:19; Romans 6:3–4; Acts 2:38',
 'Baptism visibly signs the believer''s union with Christ and entrance into the covenant community.','El bautismo señala visiblemente la unión del creyente con Cristo y la entrada a la comunidad del pacto.','O batismo assinala visivelmente a união do crente com Cristo e a entrada na comunidade da aliança.'),

('metanoia', 9, 'μετάνοια', 'metanoia', 'met-AH-noy-ah',
 'Repentance, change of mind','Arrepentimiento, cambio de mente','Arrependimento, mudança de mente',
 'A God-given turning from sin to Christ that reshapes both thinking and life.','Un giro dado por Dios del pecado a Cristo que reforma tanto el pensamiento como la vida.','Uma mudança dada por Deus do pecado a Cristo que reforma tanto o pensar como a vida.',
 'Matthew 3:2; Acts 3:19; 2 Corinthians 7:10',
 'Metanoia is not mere regret. It is a Spirit-worked reorientation of the whole person toward God.','Metanoia no es mero remordimiento. Es una reorientación obrada por el Espíritu de toda la persona hacia Dios.','Metanoia não é mero remorso. É uma reorientação operada pelo Espírito de toda a pessoa em direção a Deus.'),

('pneuma', 10, 'πνεῦμα', 'pneuma', 'p-NYOO-mah',
 'Spirit, breath, wind','Espíritu, aliento, viento','Espírito, sopro, vento',
 'Used of the Holy Spirit, of the human spirit, and of the breath of life.','Usado del Espíritu Santo, del espíritu humano, y del aliento de vida.','Usado do Espírito Santo, do espírito humano, e do sopro de vida.',
 'John 3:8; Acts 2:4; Romans 8:9',
 'Pneuma reminds us that God''s Spirit is as invisible and as vital as the breath in our lungs.','Pneuma nos recuerda que el Espíritu de Dios es tan invisible y tan vital como el aliento en nuestros pulmones.','Pneuma nos lembra que o Espírito de Deus é tão invisível e tão vital como o sopro em nossos pulmões.')
ON CONFLICT (slug) DO NOTHING;
