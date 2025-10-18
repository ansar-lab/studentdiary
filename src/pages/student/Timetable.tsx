import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, User, Clock } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface TimetableEntry {
  id: string;
  day_of_week: number;
  subject: string;
  start_time: string;
  end_time: string;
  room: string;
  faculty_name: string;
}

const Timetable = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    checkAuth();
    loadTimetable();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadTimetable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .eq("student_id", user.id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setTimetable(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getTimetableByDay = (dayIndex: number) => {
    return timetable.filter(entry => entry.day_of_week === dayIndex);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
              <h1 className="text-xl font-heading font-bold">Timetable</h1>
              <p className="text-xs text-muted-foreground">View your schedule</p>
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
        {timetable.length === 0 ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="py-12 text-center">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">No Timetable Yet</h3>
              <p className="text-muted-foreground">
                Your timetable will appear here once faculty adds it
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {days.map((day, index) => {
              const daySchedule = getTimetableByDay(index + 1);
              if (daySchedule.length === 0) return null;

              return (
                <Card key={day} className="border-border/50 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                    <CardTitle>{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {daySchedule.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-lg">{entry.subject}</h4>
                              <p className="text-sm text-muted-foreground">{entry.faculty_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-primary">
                                {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">Room: {entry.room}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Timetable;
