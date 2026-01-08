-- Migration: Audit Schema and Fix RLS for Multi-tenancy and Performance
-- Description: Adds missing indexes on foreign keys and updates RLS policies to enforce strict multi-tenancy isolation.

-- 1. Add missing indexes for Foreign Keys to improve performance of joins and RLS checks
CREATE INDEX IF NOT EXISTS idx_members_company_id ON public.members(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON public.attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 2. Audit and Fix RLS Policies for Multi-Tenancy
-- We utilize the SECURITY DEFINER helper functions (get_current_user_role, get_current_user_company_id)
-- defined in previous migrations to prevent recursion and ensure secure access.

-- --- COMPANIES ---
-- Drop loosely defined policies
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Companies are editable by Master or Company Admin" ON public.companies;
DROP POLICY IF EXISTS "Companies are insertable by Master" ON public.companies;

-- View: MASTER sees all, users only see their own company
CREATE POLICY "Companies viewable by Master or Member" 
ON public.companies FOR SELECT 
USING (
  public.get_current_user_role() = 'MASTER' OR 
  id = public.get_current_user_company_id()
);

-- Edit: MASTER can edit all, ADMIN can edit their own company
CREATE POLICY "Companies editable by Master or Admin" 
ON public.companies FOR UPDATE
USING (
  public.get_current_user_role() = 'MASTER' OR 
  (public.get_current_user_role() = 'ADMIN' AND id = public.get_current_user_company_id())
);

-- Insert: Only MASTER can create new companies
CREATE POLICY "Companies insertable by Master" 
ON public.companies FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'MASTER');

-- Delete: Only MASTER can delete companies
CREATE POLICY "Companies deletable by Master" 
ON public.companies FOR DELETE 
USING (public.get_current_user_role() = 'MASTER');


-- --- PROJECTS ---
DROP POLICY IF EXISTS "Projects are viewable by authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Projects editable by Master, Admin or Leader" ON public.projects;

-- View: MASTER sees all, others see projects of their company
CREATE POLICY "Projects viewable by Tenant" 
ON public.projects FOR SELECT 
USING (
  public.get_current_user_role() = 'MASTER' OR 
  company_id = public.get_current_user_company_id()
);

-- ALL (Insert/Update/Delete): MASTER, ADMIN (own company), or Leader (assigned)
CREATE POLICY "Projects manage by Master Admin Leader" 
ON public.projects FOR ALL 
USING (
  public.get_current_user_role() = 'MASTER' OR
  (public.get_current_user_role() = 'ADMIN' AND company_id = public.get_current_user_company_id()) OR
  leader_id = auth.uid()
);


-- --- TASKS ---
DROP POLICY IF EXISTS "Tasks viewable by auth users" ON public.tasks;
DROP POLICY IF EXISTS "Tasks editable by auth users" ON public.tasks;

-- View: Tasks belonging to projects of the user's company
CREATE POLICY "Tasks viewable by Tenant" 
ON public.tasks FOR SELECT 
USING (
  public.get_current_user_role() = 'MASTER' OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = tasks.project_id 
    AND projects.company_id = public.get_current_user_company_id()
  )
);

-- Manage: Same scope as view for simplicity ensuring tenant isolation
CREATE POLICY "Tasks editable by Tenant" 
ON public.tasks FOR ALL 
USING (
  public.get_current_user_role() = 'MASTER' OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = tasks.project_id 
    AND projects.company_id = public.get_current_user_company_id()
  )
);


-- --- COMMENTS ---
DROP POLICY IF EXISTS "Comments viewable by auth users" ON public.comments;
DROP POLICY IF EXISTS "Comments editable by owner" ON public.comments;

-- View: Within Tenant
CREATE POLICY "Comments viewable by Tenant" 
ON public.comments FOR SELECT 
USING (
  public.get_current_user_role() = 'MASTER' OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = comments.project_id 
    AND projects.company_id = public.get_current_user_company_id()
  )
);

-- Insert: Authenticated user in correct tenant
CREATE POLICY "Comments insertable by Tenant" 
ON public.comments FOR INSERT 
WITH CHECK (
  public.get_current_user_role() = 'MASTER' OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = comments.project_id 
    AND projects.company_id = public.get_current_user_company_id()
  )
);

-- Update: Owner only
CREATE POLICY "Comments editable by Owner" 
ON public.comments FOR UPDATE 
USING (user_id = auth.uid());

-- Delete: Owner only
CREATE POLICY "Comments deletable by Owner" 
ON public.comments FOR DELETE 
USING (user_id = auth.uid());


-- --- ATTACHMENTS ---
DROP POLICY IF EXISTS "Attachments viewable by auth users" ON public.attachments;
DROP POLICY IF EXISTS "Attachments editable by owner" ON public.attachments;

-- View: Tenant
CREATE POLICY "Attachments viewable by Tenant" 
ON public.attachments FOR SELECT 
USING (
  public.get_current_user_role() = 'MASTER' OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = attachments.project_id 
    AND projects.company_id = public.get_current_user_company_id()
  )
);

-- Insert: Tenant
CREATE POLICY "Attachments insertable by Tenant" 
ON public.attachments FOR INSERT 
WITH CHECK (
  public.get_current_user_role() = 'MASTER' OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = attachments.project_id 
    AND projects.company_id = public.get_current_user_company_id()
  )
);

-- Update: Owner
CREATE POLICY "Attachments editable by Owner" 
ON public.attachments FOR UPDATE 
USING (user_id = auth.uid());

-- Delete: Owner
CREATE POLICY "Attachments deletable by Owner" 
ON public.attachments FOR DELETE 
USING (user_id = auth.uid());
