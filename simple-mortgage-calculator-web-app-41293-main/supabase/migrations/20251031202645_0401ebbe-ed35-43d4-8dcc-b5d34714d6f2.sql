-- Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  company_name text,
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create saved_quotes table
CREATE TABLE public.saved_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quote_name text NOT NULL,
  inputs jsonb NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on saved_quotes
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;

-- Saved quotes policies
CREATE POLICY "Users can view their own quotes"
  ON public.saved_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes"
  ON public.saved_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.saved_quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON public.saved_quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_saved_quotes
  BEFORE UPDATE ON public.saved_quotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for logos
CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own logo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );