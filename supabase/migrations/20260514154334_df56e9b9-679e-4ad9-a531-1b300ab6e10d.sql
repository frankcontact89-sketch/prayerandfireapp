ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Books',
ADD COLUMN IF NOT EXISTS button_label text DEFAULT 'View on Amazon';