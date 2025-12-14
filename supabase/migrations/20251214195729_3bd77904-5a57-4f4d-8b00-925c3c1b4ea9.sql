-- Allow users to delete their own notifications (including global ones they've read)
CREATE POLICY "Users can delete their notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);