-- Function to send notification to all users when an event is created
CREATE OR REPLACE FUNCTION public.notify_all_users_new_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for all users (user_id = NULL means broadcast to all)
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NULL,
    '🔥 New Event: ' || NEW.title,
    COALESCE(NEW.description, 'A new event has been scheduled. Check it out!'),
    'event',
    NEW.id::text
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to call the function when a new event is created
DROP TRIGGER IF EXISTS on_event_created ON public.events;
CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users_new_event();