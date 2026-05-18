alter table public.media_assets
  add constraint media_assets_path_key unique (path);

alter table public.package_styles
  add constraint package_styles_package_name_key unique (package_id, name_en);

alter table public.package_categories
  add constraint package_categories_style_slug_key unique (style_id, slug);

alter table public.package_options
  add constraint package_options_category_name_key unique (category_id, name_en);

alter table public.package_option_media
  add constraint package_option_media_option_url_key unique (option_id, url);
