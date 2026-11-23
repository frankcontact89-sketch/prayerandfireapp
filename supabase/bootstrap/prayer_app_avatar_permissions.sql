create policy "Prayer app avatars can be read" on storage.objects for select to anon, authenticated using (bucket_id='avatars');
create policy "Prayer app users upload their avatars" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Prayer app users update their avatars" on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Prayer app users delete their avatars" on storage.objects for delete to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles, public.community_admins to authenticated;
