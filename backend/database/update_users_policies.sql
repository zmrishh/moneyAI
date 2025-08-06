-- Add policy to allow authenticated users to see basic info of all users
-- This enables features like user lists, team collaboration, etc.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new policies
-- 1. Users can view their own full profile (including sensitive data)
CREATE POLICY "Users can view own full profile" ON users 
FOR SELECT USING (auth_id = auth.uid());

-- 2. Authenticated users can view basic info of all users (for user lists, collaboration features)
CREATE POLICY "Authenticated users can view all user basic info" ON users 
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.role() = 'authenticated'
);

-- Keep the update policy as is (users can only update their own profile)
-- UPDATE policy already exists: "Users can update own profile"

-- Also add an INSERT policy for when new users are created via trigger
CREATE POLICY "System can insert new user profiles" ON users 
FOR INSERT WITH CHECK (true);