ALTER TABLE public.responses
  ADD COLUMN has_dog text,
  ADD COLUMN outdoor_places text[],
  ADD COLUMN place_uses text[],
  ADD COLUMN why_not_used text,
  ADD COLUMN diy_amenities text[],
  ADD COLUMN needs_fixing text[],
  ADD COLUMN fixing_location text;
ALTER TABLE public.contacts
  ADD COLUMN wants_own_copy boolean,
  ADD COLUMN wants_updates boolean;
ALTER TABLE public.contacts DROP COLUMN wants_to_help;