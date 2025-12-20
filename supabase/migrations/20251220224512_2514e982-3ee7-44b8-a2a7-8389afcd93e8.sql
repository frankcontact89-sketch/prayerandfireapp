-- Create trigger function for new product notifications
CREATE OR REPLACE FUNCTION public.notify_all_users_new_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert broadcast notification for new product
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NULL,
    'New Product Available',
    COALESCE('Check out: ' || NEW.name, 'A new product was added to the store.'),
    'new_product',
    '/store'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new products
DROP TRIGGER IF EXISTS on_new_product_notify ON public.products;
CREATE TRIGGER on_new_product_notify
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users_new_product();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;