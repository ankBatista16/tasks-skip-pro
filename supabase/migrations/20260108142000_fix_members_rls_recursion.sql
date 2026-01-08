-- Migration to fix infinite recursion in RLS policies for members table
-- This migration ensures that helper functions used in RLS policies are SECURITY DEFINER
-- and sets a safe search_path to prevent recursive loops when querying the members table.

-- 1. Helper function to get current user's company_id safely
-- Defined as SECURITY DEFINER to bypass RLS on 'members' table and avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
BEGIN
  SELECT company_id INTO _company_id FROM public.members WHERE id = auth.uid();
  RETURN _company_id;
END;
$$;

-- 2. Helper function to get current user's role safely
-- Defined as SECURITY DEFINER to bypass RLS on 'members' table and avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  SELECT role INTO _role FROM public.members WHERE id = auth.uid();
  RETURN _role;
END;
$$;

-- 3. Update Members Policies

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Members are viewable by authenticated users" ON public.members;
DROP POLICY IF EXISTS "Members are editable by themselves or Master/Admin" ON public.members;

-- Create SELECT policy using the safe functions
-- Logic:
-- 1. MASTER can see everyone.
-- 2. Users can see themselves.
-- 3. Users can see other members of their SAME company (if they belong to one).
CREATE POLICY "Members are viewable by authenticated users" 
ON public.members FOR SELECT 
USING (
  public.get_current_user_role() = 'MASTER' OR
  id = auth.uid() OR
  (company_id IS NOT NULL AND company_id = public.get_current_user_company_id())
);

-- Create UPDATE policy using the safe functions
-- Logic:
-- 1. Users can update themselves.
-- 2. MASTER can update anyone.
-- 3. ADMIN can update members of their SAME company.
CREATE POLICY "Members are editable by themselves or Master/Admin" 
ON public.members FOR UPDATE 
USING (
  auth.uid() = id OR 
  public.get_current_user_role() = 'MASTER' OR 
  (public.get_current_user_role() = 'ADMIN' AND company_id = public.get_current_user_company_id())
);

-- 4. Update Companies Policies
-- Ensure Companies policies also use the safe functions to prevent indirect recursion
DROP POLICY IF EXISTS "Companies are editable by Master or Company Admin" ON public.companies;

CREATE POLICY "Companies are editable by Master or Company Admin" 
ON public.companies FOR ALL 
USING (
  public.get_current_user_role() = 'MASTER' OR 
  (public.get_current_user_role() = 'ADMIN' AND id = public.get_current_user_company_id())
);
