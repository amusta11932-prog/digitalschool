-- ============================================================
--  AI Learning Hub — Supabase Backend Setup
--  Paste this into the Supabase SQL Editor and click "Run".
--
--  NOTE: Supabase handles the actual login/register (email +
--  password) through its built-in Auth system (auth.users).
--  This SQL only creates a `profiles` table that stores extra
--  info about each student and links to their auth account.
-- ============================================================

-- 1) Profiles table (one row per signed-up student)
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT,
    grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 12),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Automatically create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Keep `updated_at` fresh whenever a profile is edited
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Row Level Security (RLS) — keep student data private
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Students can see only their own profile
CREATE POLICY "Profiles are viewable by owner"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Students can update only their own profile
CREATE POLICY "Profiles are updatable by owner"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5) Allow the signup trigger (SECURITY DEFINER) to insert
CREATE POLICY "Profiles inserted by trigger"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);
