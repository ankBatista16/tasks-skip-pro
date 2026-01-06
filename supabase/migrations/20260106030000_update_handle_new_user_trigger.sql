-- Update the handle_new_user function to respect metadata provided during user creation
-- This is essential for the create-user edge function to correctly set role, company, etc.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  meta_role TEXT;
  meta_full_name TEXT;
  meta_company_id UUID;
  meta_job_title TEXT;
  meta_permissions JSONB;
  meta_status TEXT;
  company_id_text TEXT;
BEGIN
  -- Check if this is the first user in the system (fallback logic)
  SELECT NOT EXISTS (SELECT 1 FROM public.members) INTO is_first_user;
  
  -- Extract metadata safely
  meta_role := new.raw_user_meta_data->>'role';
  meta_full_name := new.raw_user_meta_data->>'full_name';
  company_id_text := new.raw_user_meta_data->>'company_id';
  meta_job_title := new.raw_user_meta_data->>'job_title';
  meta_permissions := COALESCE(new.raw_user_meta_data->'permissions', '[]'::jsonb);
  meta_status := COALESCE(new.raw_user_meta_data->>'status', 'active');

  -- Handle empty string for company_id which cannot be cast to UUID
  IF company_id_text = '' THEN
    meta_company_id := NULL;
  ELSE
    meta_company_id := (company_id_text)::UUID;
  END IF;

  -- Insert into members table
  INSERT INTO public.members (
    id, 
    email, 
    full_name, 
    role, 
    company_id,
    job_title,
    permissions,
    status,
    avatar_url
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(meta_full_name, 'New User'), 
    COALESCE(meta_role, CASE WHEN is_first_user THEN 'MASTER' ELSE 'USER' END),
    meta_company_id,
    meta_job_title,
    meta_permissions,
    meta_status,
    'https://img.usecurling.com/ppl/medium?gender=male'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
