-- Create products table
CREATE TABLE IF NOT EXISTS public.prayer_app_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price decimal(10,2),
  image_url text,
  description text,
  purchase_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prayer_app_products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view active products"
ON public.prayer_app_products
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage products"
ON public.prayer_app_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.prayer_app_products
FOR EACH ROW
EXECUTE FUNCTION public.set_prayer_app_updated_at();

alter table public.prayer_app_products
  add column category text default 'Books',
  add column button_label text default 'View on Amazon',
  add column is_featured boolean default false,
  add column is_published boolean not null default true,
  add column order_index integer not null default 0,
  add column stock_status text not null default 'in_stock',
  add column sku text,
  add column images jsonb not null default '[]'::jsonb;
grant select on public.prayer_app_products to anon, authenticated;
grant insert,update,delete on public.prayer_app_products to authenticated;
grant all on public.prayer_app_products to service_role;
