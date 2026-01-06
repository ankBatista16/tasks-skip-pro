CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  meta_role TEXT;
  meta_company_id UUID;
  meta_job_title TEXT;
  meta_permissions JSONB;
BEGIN
  -- Check if this is the first user in the system
  SELECT NOT EXISTS (SELECT 1 FROM public.members) INTO is_first_user;
  
  -- Extract metadata
  meta_role := COALESCE(new.raw_user_meta_data->>'role', 'USER');
  -- If first user, force MASTER
  IF is_first_user THEN
    meta_role := 'MASTER';
  END IF;

  -- Parse UUID for company_id if present
  BEGIN
    IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
      meta_company_id := (new.raw_user_meta_data->>'company_id')::UUID;
    ELSE
      meta_company_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    meta_company_id := NULL;
  END;

  meta_job_title := new.raw_user_meta_data->>'job_title';
  
  -- Handle permissions safely
  IF new.raw_user_meta_data ? 'permissions' THEN
    meta_permissions := new.raw_user_meta_data->'permissions';
  ELSE
    meta_permissions := '[]'::jsonb;
  END IF;

  INSERT INTO public.members (id, email, full_name, role, company_id, job_title, permissions, avatar_url, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
    meta_role,
    meta_company_id,
    meta_job_title,
    meta_permissions,
    'https://img.usecurling.com/ppl/medium?gender=male',
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
