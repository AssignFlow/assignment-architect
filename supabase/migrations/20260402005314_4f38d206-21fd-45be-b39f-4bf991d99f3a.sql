
-- Create enums
CREATE TYPE public.student_type AS ENUM ('high_school', 'college', 'grad', 'other');
CREATE TYPE public.assignment_type AS ENUM ('essay', 'lab_report', 'programming', 'reading_response', 'presentation', 'project', 'other');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE public.planning_style AS ENUM ('simple_checklist', 'daily_schedule', 'detailed_plan');

-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  school TEXT,
  student_type public.student_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course_name TEXT,
  raw_input_text TEXT NOT NULL,
  assignment_type public.assignment_type DEFAULT 'other',
  due_date TIMESTAMP WITH TIME ZONE,
  effort_estimate TEXT,
  difficulty_estimate TEXT,
  priority_level public.priority_level DEFAULT 'medium',
  parsed_requirements JSONB DEFAULT '[]'::jsonb,
  parsed_warnings JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments" ON public.assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assignments" ON public.assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assignments" ON public.assignments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assignments" ON public.assignments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assignment tasks table
CREATE TABLE public.assignment_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'not_started',
  estimated_minutes INTEGER,
  suggested_due_date TIMESTAMP WITH TIME ZONE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON public.assignment_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.assignment_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.assignment_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.assignment_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.assignment_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  planning_style public.planning_style DEFAULT 'simple_checklist',
  week_start TEXT NOT NULL DEFAULT 'monday',
  default_session_length INTEGER NOT NULL DEFAULT 25,
  break_length INTEGER NOT NULL DEFAULT 5,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  help_topics TEXT[] DEFAULT '{}',
  biggest_struggle TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_preferences AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- Indexes
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_assignments_status ON public.assignments(status);
CREATE INDEX idx_tasks_assignment_id ON public.assignment_tasks(assignment_id);
CREATE INDEX idx_tasks_user_id ON public.assignment_tasks(user_id);
CREATE INDEX idx_tasks_status ON public.assignment_tasks(status);
