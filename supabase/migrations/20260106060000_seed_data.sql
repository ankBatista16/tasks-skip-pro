-- Migration to seed the database with initial data
-- Usage: This migration inserts a default company and users (Master, Admin, User)

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    -- Deterministic UUIDs for seed data to ensure idempotency
    v_master_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_admin_id UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    v_user_id UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    v_company_id UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
BEGIN
    -- 1. Insert Company (if not exists)
    -- We insert the company first with a NULL admin_id to avoid circular dependency
    -- (Company needs Admin Member, Admin Member needs Company)
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company_id) THEN
        INSERT INTO public.companies (id, name, description, logo_url, admin_id)
        VALUES (v_company_id, 'TechCorp', 'Leading SaaS Provider', 'https://img.usecurling.com/i?q=tech&color=blue', NULL);
    END IF;

    -- 2. Insert Users into auth.users
    -- Inserting into auth.users will trigger `handle_new_user` which creates public.members
    -- We use `jsonb_build_object` to pass metadata that the trigger uses to populate roles and company_id

    -- Master User
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_master_id) THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_master_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'master@saas.com', crypt('password123', gen_salt('bf')), now(), 
        jsonb_build_object('full_name', 'System Master', 'role', 'MASTER'), now(), now());
    END IF;

    -- Admin User
    -- Note: We pass company_id in metadata. The trigger checks `members` foreign key constraints.
    -- Since we created the company in step 1, this foreign key check will pass.
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id) THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@techcorp.com', crypt('password123', gen_salt('bf')), now(), 
        jsonb_build_object('full_name', 'Tech Admin', 'role', 'ADMIN', 'company_id', v_company_id, 'job_title', 'CTO'), now(), now());
    END IF;

    -- Regular User
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user@techcorp.com', crypt('password123', gen_salt('bf')), now(), 
        jsonb_build_object('full_name', 'Jane Dev', 'role', 'USER', 'company_id', v_company_id, 'job_title', 'Senior Developer'), now(), now());
    END IF;

    -- 3. Update Company Admin Link
    -- Now that the Admin User is inserted and the Member record created by the trigger,
    -- we can safely update the company to point to its admin.
    UPDATE public.companies SET admin_id = v_admin_id WHERE id = v_company_id;

END $$;
