-- Migration: Add System Statistics and Storage RPC
create or replace function public.get_system_statistics()
returns json
language plpgsql
security definer -- Runs with privileges of the creator to query pg_database_size, pg_stat_user_tables and storage.objects
set search_path = public
as $$
declare
  db_size_val bigint;
  storage_size_val bigint;
  image_size_val bigint;
  video_size_val bigint;
  pdf_size_val bigint;
  other_size_val bigint;
  file_count_val bigint;
  image_count_val bigint;
  video_count_val bigint;
  pdf_count_val bigint;
  other_count_val bigint;
  tables_info json;
  result json;
begin
  -- Check permission using standard project function
  if not public.is_staff(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  -- 1. Database Size in Bytes
  select pg_database_size(current_database()) into db_size_val;

  -- 2. Storage size and count
  begin
    select coalesce(sum(coalesce((metadata->>'size')::bigint, 0)), 0), count(id)
    into storage_size_val, file_count_val
    from storage.objects;
  exception when others then
    storage_size_val := 0;
    file_count_val := 0;
  end;

  -- 3. File type breakdown
  begin
    select coalesce(sum(coalesce((metadata->>'size')::bigint, 0)), 0), count(id)
    into image_size_val, image_count_val
    from storage.objects
    where metadata->>'mimetype' like 'image/%';
  exception when others then
    image_size_val := 0;
    image_count_val := 0;
  end;

  begin
    select coalesce(sum(coalesce((metadata->>'size')::bigint, 0)), 0), count(id)
    into video_size_val, video_count_val
    from storage.objects
    where metadata->>'mimetype' like 'video/%';
  exception when others then
    video_size_val := 0;
    video_count_val := 0;
  end;

  begin
    select coalesce(sum(coalesce((metadata->>'size')::bigint, 0)), 0), count(id)
    into pdf_size_val, pdf_count_val
    from storage.objects
    where metadata->>'mimetype' = 'application/pdf' or name like '%.pdf';
  exception when others then
    pdf_size_val := 0;
    pdf_count_val := 0;
  end;

  -- Other calculation
  other_size_val := storage_size_val - (image_size_val + video_size_val + pdf_size_val);
  other_count_val := file_count_val - (image_count_val + video_count_val + pdf_count_val);
  if other_size_val < 0 then other_size_val := 0; end if;
  if other_count_val < 0 then other_count_val := 0; end if;

  -- 4. User Tables breakdown
  select json_agg(t) into tables_info
  from (
    select
      relname as table_name,
      n_live_tup as row_count,
      pg_total_relation_size(relid) as size_bytes
    from pg_stat_user_tables
    where schemaname = 'public'
      and relname not in ('client_project_backfill_mapping')
    order by pg_total_relation_size(relid) desc
  ) t;

  -- Build final JSON result
  result := json_build_object(
    'db_size_bytes', db_size_val,
    'db_limit_bytes', 524288000, -- 500 MB free tier limit
    'storage_size_bytes', storage_size_val,
    'storage_limit_bytes', 1073741824, -- 1 GB free tier limit
    'file_count', file_count_val,
    'images', json_build_object('count', image_count_val, 'size_bytes', image_size_val),
    'videos', json_build_object('count', video_count_val, 'size_bytes', video_size_val),
    'pdfs', json_build_object('count', pdf_count_val, 'size_bytes', pdf_size_val),
    'other', json_build_object('count', other_count_val, 'size_bytes', other_size_val),
    'tables', tables_info
  );

  return result;
end;
$$;

-- Grant execute permissions to authenticated users (staff check is inside the function)
grant execute on function public.get_system_statistics() to authenticated;
