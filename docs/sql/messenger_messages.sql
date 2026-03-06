-- Tabla para persistir mensajes de Facebook Messenger por empresa/página/usuario
create table if not exists public.messenger_messages (
  id bigserial primary key,
  fb_message_id text not null,
  page_id text not null,
  sender_id text not null,
  message_text text,
  timestamp_ms bigint not null,
  direction text not null check (direction in ('incoming', 'outgoing')),
  sender_name text,
  company_id uuid references public.companies(id) on delete set null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists messenger_messages_page_fb_message_uidx
  on public.messenger_messages (page_id, fb_message_id);

create index if not exists messenger_messages_page_sender_ts_idx
  on public.messenger_messages (page_id, sender_id, timestamp_ms desc);

create index if not exists messenger_messages_page_ts_idx
  on public.messenger_messages (page_id, timestamp_ms desc);

create index if not exists messenger_messages_company_idx
  on public.messenger_messages (company_id);
