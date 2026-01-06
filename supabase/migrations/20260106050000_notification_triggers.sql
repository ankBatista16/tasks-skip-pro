-- Migration to add notification triggers for Real-time updates

-- Function to notify task updates
CREATE OR REPLACE FUNCTION public.notify_task_update()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  project_link TEXT;
  msg TEXT;
  actor_id UUID;
BEGIN
  -- Get the current user ID if available (to avoid notifying self)
  actor_id := auth.uid();
  project_link := '/projects/' || NEW.project_id || '?task=' || NEW.id;
  msg := 'Task "' || NEW.title || '" has been updated.';
  
  -- Customize message based on change
  IF OLD.status <> NEW.status THEN
    msg := 'Task "' || NEW.title || '" status changed to ' || NEW.status;
  ELSIF OLD.priority <> NEW.priority THEN
     msg := 'Task "' || NEW.title || '" priority changed to ' || NEW.priority;
  END IF;

  -- 1. Notify Creator (if not the actor)
  IF NEW.creator_id IS NOT NULL AND (actor_id IS NULL OR NEW.creator_id <> actor_id) THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.creator_id, 'Task Updated', msg, 'task', project_link);
  END IF;

  -- 2. Notify Assignees
  IF NEW.assignee_ids IS NOT NULL THEN
    FOR recipient_id IN SELECT DISTINCT value::UUID FROM jsonb_array_elements_text(NEW.assignee_ids)
    LOOP
      -- Avoid duplicates if creator is also assignee, and avoid notifying actor
      IF (actor_id IS NULL OR recipient_id <> actor_id) AND (NEW.creator_id IS NULL OR recipient_id <> NEW.creator_id) THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (recipient_id, 'Task Updated', msg, 'task', project_link);
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Task Updates
DROP TRIGGER IF EXISTS on_task_update ON public.tasks;
CREATE TRIGGER on_task_update
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_update();


-- Function to notify project updates
CREATE OR REPLACE FUNCTION public.notify_project_update()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  project_link TEXT;
  msg TEXT;
  actor_id UUID;
BEGIN
  actor_id := auth.uid();
  project_link := '/projects/' || NEW.id;
  msg := 'Project "' || NEW.name || '" has been updated.';
  
  IF OLD.status <> NEW.status THEN
    msg := 'Project "' || NEW.name || '" status changed to ' || NEW.status;
  END IF;

  -- 1. Notify Leader
  IF NEW.leader_id IS NOT NULL AND (actor_id IS NULL OR NEW.leader_id <> actor_id) THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.leader_id, 'Project Updated', msg, 'project', project_link);
  END IF;

  -- 2. Notify Members
  IF NEW.members IS NOT NULL THEN
    FOR recipient_id IN SELECT DISTINCT value::UUID FROM jsonb_array_elements_text(NEW.members)
    LOOP
      IF (actor_id IS NULL OR recipient_id <> actor_id) AND (NEW.leader_id IS NULL OR recipient_id <> NEW.leader_id) THEN
         INSERT INTO public.notifications (user_id, title, message, type, link)
         VALUES (recipient_id, 'Project Updated', msg, 'project', project_link);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Project Updates
DROP TRIGGER IF EXISTS on_project_update ON public.projects;
CREATE TRIGGER on_project_update
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_update();


-- Function to notify member permission/role updates
CREATE OR REPLACE FUNCTION public.notify_member_update()
RETURNS TRIGGER AS $$
DECLARE
  msg TEXT;
  has_change BOOLEAN := FALSE;
BEGIN
  IF OLD.role <> NEW.role THEN
    msg := 'Your role has been updated to ' || NEW.role;
    has_change := TRUE;
  ELSIF OLD.permissions::TEXT <> NEW.permissions::TEXT THEN
    msg := 'Your permissions have been updated.';
    has_change := TRUE;
  END IF;

  IF has_change THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.id, 'Account Update', msg, 'system', '/profile');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Member Updates
DROP TRIGGER IF EXISTS on_member_update ON public.members;
CREATE TRIGGER on_member_update
  AFTER UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_member_update();
