
DELETE FROM public.courses;

INSERT INTO public.courses (title, description, button_label, link_url, link_type, is_active, order_index)
VALUES
  ('Prayer Foundations', 'Learn the foundations of a powerful and consistent prayer life.', 'Learn More', 'https://prayerandfire.org', 'external', true, 1),
  ('Spiritual Discipline', 'Build daily habits that strengthen your walk with God.', 'Learn More', 'https://prayerandfire.org', 'external', true, 2),
  ('Bible Study Basics', 'Discover practical tools to understand and apply Scripture.', 'Learn More', 'https://prayerandfire.org', 'external', true, 3);
