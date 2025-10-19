import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, User, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

interface AttendanceRecord {
  record_id: string;
  scan_time: string;
  subject: string;
  session_id: string;
}

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadAttendance();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("student_id", user.id)
        .order("scan_time", { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const calculateAttendancePercentage = () => {
    if (attendanceRecords.length === 0) return 0;
    // All scanned QR records count as present
    return 100;
  };

  const getSubjectStats = () => {
    const subjects = new Map<string, { total: number }>();
    
    attendanceRecords.forEach(record => {
      const current = subjects.get(record.subject) || { total: 0 };
      subjects.set(record.subject, {
        total: current.total + 1
      });
    });

    return Array.from(subjects.entries()).map(([subject, stats]) => ({
      subject,
      percentage: 100, // All scanned records are present
      present: stats.total,
      total: stats.total
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const overallPercentage = calculateAttendancePercentage();
  const subjectStats = getSubjectStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">Attendance</h1>
              <p className="text-xs text-muted-foreground">Track your attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/student/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Overall Attendance Card */}
        <Card className="mb-6 border-border/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
            <CardTitle className="text-2xl">Overall Attendance</CardTitle>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-5xl font-bold text-primary">{attendanceRecords.length}</p>
                <p className="text-muted-foreground mt-1">
                  Classes attended
                </p>
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Subject-wise Attendance */}
        {subjectStats.length > 0 && (
          <Card className="mb-6 border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Subject-wise Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subjectStats.map(({ subject, percentage, present, total }) => (
                <div key={subject} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{subject}</span>
                    <span className={`font-bold ${percentage >= 75 ? 'text-accent' : 'text-destructive'}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${percentage >= 75 ? 'bg-accent' : 'bg-destructive'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {present} / {total} classes
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Attendance Records */}
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your recent attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.slice(0, 10).map((record) => (
                  <div key={record.record_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <div>
                        <p className="font-medium">{record.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.scan_time), "MMM dd, yyyy · hh:mm a")}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-accent">
                      Present
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Attendance;
