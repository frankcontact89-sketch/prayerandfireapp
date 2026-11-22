-- CommunityV2 admits signed-in accounts. Only the dedicated general topic
-- follows that rule; membership policies for group rooms remain in effect.
create policy "Community members receive general prayer signaling"
on realtime.messages for select to authenticated
using ((select auth.uid()) is not null and realtime.topic() = 'voice-room:community-general');

create policy "Community members send general prayer signaling"
on realtime.messages for insert to authenticated
with check ((select auth.uid()) is not null and realtime.topic() = 'voice-room:community-general');
