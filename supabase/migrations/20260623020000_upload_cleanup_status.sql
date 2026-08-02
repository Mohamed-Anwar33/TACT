-- Add explicit cleanup lifecycle state. This is additive and does not touch
-- completed uploads or any Storage object.
alter table public.upload_operations add column if not exists cleanup_started_at timestamptz;
alter table public.upload_operations add column if not exists cleanup_last_error text;
alter table public.upload_operations drop constraint if exists upload_operations_status_check;
alter table public.upload_operations add constraint upload_operations_status_check
  check (status in ('pending','storage_uploaded','completed','failed','orphaned','cleanup_failed','cleaned'));
create index if not exists upload_operations_cleanup_queue_idx
  on public.upload_operations(created_at) where status in ('pending','storage_uploaded','orphaned');
