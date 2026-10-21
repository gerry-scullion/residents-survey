CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  road text,
  tenure text,
  household text[],
  weekend_places text[],
  green_use text[],
  goals_last_used text,
  what_is_good text,
  puts_off text[],
  dogs text[],
  worries text[],
  looks_after text,
  looks_after_detail text,
  one_change text,
  anything_else text,
  age_band text
);

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text,
  wants_summary boolean,
  wants_to_help boolean
);

GRANT INSERT ON public.responses TO anon;
GRANT INSERT ON public.contacts TO anon;
GRANT SELECT, INSERT ON public.responses TO authenticated;
GRANT SELECT, INSERT ON public.contacts TO authenticated;
GRANT ALL ON public.responses TO service_role;
GRANT ALL ON public.contacts TO service_role;

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a response" ON public.responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Signed in users can read responses" ON public.responses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can submit a contact" ON public.contacts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Signed in users can read contacts" ON public.contacts FOR SELECT TO authenticated USING (true);