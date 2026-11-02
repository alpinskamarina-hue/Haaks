-- Telegram alerts about new jobs in the order feed (Pro).
-- A worker presses "Connect Telegram" in the cabinet, which saves a one-time code and
-- opens t.me/<bot>?start=<code>. The bot's webhook (server account) links that chat to the worker.

alter table public.profiles add column if not exists telegram_chat_id bigint;
alter table public.profiles add column if not exists telegram_link_code text;
create unique index if not exists profiles_telegram_link_code_idx on public.profiles (telegram_link_code);

-- Same guard as before, now also for the Telegram chat: a worker may switch it off,
-- but only the Haaks bot may link one, so nobody can point alerts at someone else's chat.
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_haaks_server() then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.telegram_chat_id := null;
    else
      if new.plan is distinct from old.plan then
        raise exception 'The plan is changed by Haaks only';
      end if;
      if new.telegram_chat_id is not null and new.telegram_chat_id is distinct from old.telegram_chat_id then
        raise exception 'Telegram is linked by the Haaks bot only';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- The bot calls this on "/start <code>". One chat belongs to one account.
create or replace function public.link_telegram(code text, chat bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  worker uuid;
begin
  if not public.is_haaks_server() then
    raise exception 'Not allowed';
  end if;
  if code is null or length(code) < 16 then
    return null;
  end if;
  select id into worker from public.profiles where telegram_link_code = code;
  if worker is null then
    return null;
  end if;
  update public.profiles set telegram_chat_id = null where telegram_chat_id = chat and id <> worker;
  update public.profiles set telegram_chat_id = chat, telegram_link_code = null where id = worker;
  return worker;
end;
$$;

-- The bot calls this on "/stop", or when Telegram says the worker blocked the bot.
create or replace function public.unlink_telegram(chat bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_haaks_server() then
    raise exception 'Not allowed';
  end if;
  update public.profiles set telegram_chat_id = null where telegram_chat_id = chat;
end;
$$;

revoke execute on function public.link_telegram(text, bigint) from public, anon;
revoke execute on function public.unlink_telegram(bigint) from public, anon;
grant execute on function public.link_telegram(text, bigint) to authenticated;
grant execute on function public.unlink_telegram(bigint) to authenticated;
