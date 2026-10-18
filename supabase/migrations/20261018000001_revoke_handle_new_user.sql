-- handle_new_user only runs as the trigger on auth.users. Nobody should be
-- able to call it through the API (/rest/v1/rpc/handle_new_user).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
