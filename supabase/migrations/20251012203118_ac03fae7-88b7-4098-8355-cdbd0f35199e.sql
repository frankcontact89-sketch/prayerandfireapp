-- Insert default social links if they don't exist
INSERT INTO app_links (title, url, icon, order_index, is_active) 
VALUES 
  ('YouTube', 'https://youtube.com', 'youtube', 1, true),
  ('WhatsApp', 'https://wa.me/18572612862', 'whatsapp', 2, true),
  ('Instagram', 'https://instagram.com/seloprayerandfire', 'instagram', 3, true),
  ('Zoom', 'https://us06web.zoom.us/j/82541167837?pwd=7422SYMhbDEVX4I2zgelaaXXpjZUdZ.1', 'zoom', 4, true)
ON CONFLICT DO NOTHING;