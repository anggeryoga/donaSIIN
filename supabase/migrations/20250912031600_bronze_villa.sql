/*
  # Complete Database Schema for donaSIIN

  1. New Tables
    - `donations` - Store donation records with verification status
    - `expenses` - Track all expenses with receipts
    - `weekly_targets` - Set weekly fundraising targets
    - `timeline_activities` - Document activities with photos
    - `admin_users` - Store admin user information

  2. Storage Buckets
    - `payment-proofs` - Store payment proof screenshots
    - `receipts` - Store expense receipt images
    - `timeline-photos` - Store activity documentation photos

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies for public access and admin management
    - Configure storage bucket policies

  4. Indexes
    - Add performance indexes for common queries
*/

-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  donor_name text NOT NULL,
  phone_number text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_proof_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'rejected')),
  qris_data text,
  verified_at timestamptz
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  location text NOT NULL,
  receipt_url text,
  category text DEFAULT 'general'
);

-- Create weekly targets table
CREATE TABLE IF NOT EXISTS public.weekly_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  week_start date NOT NULL,
  week_end date NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  UNIQUE(week_start)
);

-- Create timeline activities table
CREATE TABLE IF NOT EXISTS public.timeline_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  activity_date date NOT NULL,
  photo_url text,
  location text
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean DEFAULT true,
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Donations policies
CREATE POLICY "Allow anonymous insert for donations"
ON public.donations FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow all users to select successful donations"
ON public.donations FOR SELECT
TO public
USING (status = 'success');

CREATE POLICY "Allow authenticated users to select all donations"
ON public.donations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update donations"
ON public.donations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Expenses policies
CREATE POLICY "Allow all users to select expenses"
ON public.expenses FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to insert expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Weekly targets policies
CREATE POLICY "Allow all users to select weekly targets"
ON public.weekly_targets FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to insert weekly targets"
ON public.weekly_targets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update weekly targets"
ON public.weekly_targets FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Timeline activities policies
CREATE POLICY "Allow all users to select timeline activities"
ON public.timeline_activities FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to insert timeline activities"
ON public.timeline_activities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update timeline activities"
ON public.timeline_activities FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Admin users policies
CREATE POLICY "Allow authenticated users to select admin users"
ON public.admin_users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert admin users"
ON public.admin_users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donations_phone ON public.donations(phone_number);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_targets_week_start ON public.weekly_targets(week_start);
CREATE INDEX IF NOT EXISTS idx_timeline_activities_date ON public.timeline_activities(activity_date);

-- Insert default weekly target for current week
DO $$
DECLARE
    current_monday date;
    current_friday date;
BEGIN
    -- Calculate current week's Monday and Friday
    current_monday := date_trunc('week', CURRENT_DATE);
    current_friday := current_monday + INTERVAL '4 days';
    
    -- Insert default target if not exists
    INSERT INTO public.weekly_targets (week_start, week_end, target_amount)
    VALUES (current_monday, current_friday, 1000000)
    ON CONFLICT (week_start) DO NOTHING;
END $$;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('payment-proofs', 'payment-proofs', true),
  ('receipts', 'receipts', true),
  ('timeline-photos', 'timeline-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Allow anonymous upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Allow public read payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Storage policies for receipts
CREATE POLICY "Allow authenticated upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow public read receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Storage policies for timeline photos
CREATE POLICY "Allow authenticated upload timeline photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'timeline-photos');

CREATE POLICY "Allow public read timeline photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'timeline-photos');