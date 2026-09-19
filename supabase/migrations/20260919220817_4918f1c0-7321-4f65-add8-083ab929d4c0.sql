REVOKE ALL ON FUNCTION public.ack_message_delivery(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ack_message_delivery(uuid[]) TO authenticated, service_role;