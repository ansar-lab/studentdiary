-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subject TEXT NOT NULL,
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Faculty can create assignments
CREATE POLICY "Faculty can create assignments"
ON public.assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'::app_role
  )
);

-- Faculty can view all assignments
CREATE POLICY "Faculty can view all assignments"
ON public.assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'::app_role
  )
);

-- Students can view all assignments
CREATE POLICY "Students can view all assignments"
ON public.assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'::app_role
  )
);

-- Faculty can update their own assignments
CREATE POLICY "Faculty can update their own assignments"
ON public.assignments
FOR UPDATE
USING (created_by = auth.uid());

-- Faculty can delete their own assignments
CREATE POLICY "Faculty can delete their own assignments"
ON public.assignments
FOR DELETE
USING (created_by = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();