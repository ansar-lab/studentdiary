-- Create attendance_sessions table for QR code tracking
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  session_id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Faculty can create sessions
CREATE POLICY "Faculty can create attendance sessions"
ON public.attendance_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'
  )
);

-- Faculty can update their own sessions
CREATE POLICY "Faculty can update their own sessions"
ON public.attendance_sessions
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Everyone can view active sessions (needed for QR validation)
CREATE POLICY "Anyone can view active sessions"
ON public.attendance_sessions
FOR SELECT
TO authenticated
USING (true);

-- Create attendance_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.attendance_records (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES public.attendance_sessions(session_id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  scan_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location_lat DOUBLE PRECISION,
  location_long DOUBLE PRECISION,
  biometric_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'present',
  UNIQUE(student_id, session_id)
);

-- Enable RLS on attendance_records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Students can insert their own attendance
CREATE POLICY "Students can mark their own attendance"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Students can view their own records
CREATE POLICY "Students can view their own attendance records"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Faculty can view all records
CREATE POLICY "Faculty can view all attendance records"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'
  )
);