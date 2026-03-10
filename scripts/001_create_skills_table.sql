-- Create skills table for storing skill data
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb, -- Stores nodes and connections as JSON
  file_size TEXT DEFAULT '0 KB',
  downloads INTEGER DEFAULT 0,
  is_goated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for searching
CREATE INDEX IF NOT EXISTS idx_skills_title ON public.skills(title);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_is_goated ON public.skills(is_goated);

-- Enable Row Level Security
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read skills (public skills)
CREATE POLICY "skills_select_all" ON public.skills 
  FOR SELECT 
  USING (true);

-- Create policy to allow anyone to insert skills (for demo purposes)
CREATE POLICY "skills_insert_all" ON public.skills 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow anyone to update skills (for demo purposes)
CREATE POLICY "skills_update_all" ON public.skills 
  FOR UPDATE 
  USING (true);

-- Create policy to allow anyone to delete skills (for demo purposes)
CREATE POLICY "skills_delete_all" ON public.skills 
  FOR DELETE 
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_skills_updated_at ON public.skills;
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
