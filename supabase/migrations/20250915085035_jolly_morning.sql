/*
  # Fix donations table RLS policy for anonymous inserts

  1. Security Changes
    - Drop existing restrictive INSERT policy for donations table
    - Create new policy allowing anonymous users to insert donations
    - Ensure anonymous users can submit donations through the public form

  This allows the donation form to work properly for public users without requiring authentication.
*/

-- Drop the existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Allow anonymous insert for donations" ON donations;

-- Create a new policy that allows anonymous users to insert donations
CREATE POLICY "Enable anonymous insert for donations"
  ON donations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure the policy also works for authenticated users
CREATE POLICY "Enable authenticated insert for donations"
  ON donations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);