-- Private Realtime signaling for authenticated members of Prayer & Fire groups.
-- This policy is essential: do not expose voice signaling via public channels.
-- The group id suffix must be a UUID and present in community_group_members.
CREATE POLICY "Members may receive voice signaling"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'voice-room:%'
  AND EXISTS (
    SELECT 1 FROM public.community_group_members gm
    WHERE gm.user_id = (SELECT auth.uid())
      AND gm.group_id::text = split_part(realtime.topic(), ':', 2)
  )
);
CREATE POLICY "Members may send voice signaling"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'voice-room:%'
  AND EXISTS (
    SELECT 1 FROM public.community_group_members gm
    WHERE gm.user_id = (SELECT auth.uid())
      AND gm.group_id::text = split_part(realtime.topic(), ':', 2)
  )
);
