-- Migration: Drop legacy and backup tables to save space and clean up database
drop table if exists public.pre_backfill_project_stages_backup cascade;
drop table if exists public.pre_backfill_stage_files_backup cascade;
drop table if exists public.projects cascade;
drop table if exists public.project_media cascade;
drop table if exists public.team_members cascade;
drop table if exists public.testimonials cascade;
