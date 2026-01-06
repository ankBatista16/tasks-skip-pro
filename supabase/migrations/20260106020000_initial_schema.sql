-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Companies Table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    admin_id UUID, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Members Table (Profiles linked to auth.users)
CREATE TABLE public.members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'USER',
    status TEXT DEFAULT 'active',
    job_title TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Foreign Key for admin_id in companies (referencing members)
ALTER TABLE public.companies ADD CONSTRAINT fk_companies_admin FOREIGN KEY (admin_id) REFERENCES public.members(id) ON DELETE SET NULL;

-- Create Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Tasks Table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    assignee_ids JSONB DEFAULT '[]'::jsonb,
    due_date DATE,
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Comments Table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Attachments Table
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  _role TEXT;
BEGIN
  SELECT role INTO _role FROM public.members WHERE id = auth.uid();
  RETURN _role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Companies
CREATE POLICY "Companies are viewable by authenticated users" 
ON public.companies FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Companies are editable by Master or Company Admin" 
ON public.companies FOR ALL 
USING (
  public.get_current_user_role() = 'MASTER' OR 
  (public.get_current_user_role() = 'ADMIN' AND id = (SELECT company_id FROM public.members WHERE id = auth.uid()))
);

CREATE POLICY "Companies are insertable by Master" 
ON public.companies FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'MASTER');

-- Policies for Members
CREATE POLICY "Members are viewable by authenticated users" 
ON public.members FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Members are editable by themselves or Master/Admin" 
ON public.members FOR UPDATE 
USING (
  auth.uid() = id OR 
  public.get_current_user_role() = 'MASTER' OR 
  (public.get_current_user_role() = 'ADMIN' AND company_id = (SELECT company_id FROM public.members WHERE id = auth.uid()))
);

-- Policies for Projects
CREATE POLICY "Projects are viewable by authenticated users" 
ON public.projects FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Projects editable by Master, Admin or Leader" 
ON public.projects FOR ALL 
USING (
  public.get_current_user_role() IN ('MASTER', 'ADMIN') OR
  leader_id = auth.uid()
);

-- Policies for Tasks
CREATE POLICY "Tasks viewable by auth users" 
ON public.tasks FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Tasks editable by auth users" 
ON public.tasks FOR ALL 
USING (auth.role() = 'authenticated');

-- Policies for Comments
CREATE POLICY "Comments viewable by auth users" 
ON public.comments FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Comments editable by owner" 
ON public.comments FOR ALL 
USING (user_id = auth.uid());

-- Policies for Attachments
CREATE POLICY "Attachments viewable by auth users" 
ON public.attachments FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Attachments editable by owner" 
ON public.attachments FOR ALL 
USING (user_id = auth.uid());

-- Policies for Notifications
CREATE POLICY "Notifications viewable by owner" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Notifications updateable by owner" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Notifications insertable by system/users" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- Trigger to create member on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the first user in the system
  SELECT NOT EXISTS (SELECT 1 FROM public.members) INTO is_first_user;
  
  INSERT INTO public.members (id, email, full_name, role, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
    CASE WHEN is_first_user THEN 'MASTER' ELSE 'USER' END,
    'https://img.usecurling.com/ppl/medium?gender=male'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
