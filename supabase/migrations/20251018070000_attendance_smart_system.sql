-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id)
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id),
    session_id UUID REFERENCES public.attendance_sessions(session_id),
    subject TEXT NOT NULL,
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_lat FLOAT,
    location_long FLOAT,
    biometric_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Present',
    UNIQUE(student_id, session_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON public.attendance_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);