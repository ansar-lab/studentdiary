import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, GraduationCap, BookOpen, Lightbulb, LogOut, User } from "lucide-react";
import { toast } from "sonner";

const StudentDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      if (data.role !== "student") {
        navigate("/faculty");
        return;
      }

      setProfile(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load profile");
      navigate("/role-selection");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">Student Diary</h1>
              <p className="text-xs text-muted-foreground">Welcome back, {profile?.full_name}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
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
        {/* Profile Card */}
        <Card className="mb-8 border-border/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{profile?.full_name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {profile?.roll_number} • {profile?.course}
                </CardDescription>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-2xl text-white font-bold">
                {profile?.full_name?.charAt(0)}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Attendance Card */}
          <Card className="border-border/50 shadow-md hover:shadow-xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">78%</p>
                  <p className="text-xs text-muted-foreground">Overall</p>
                </div>
              </div>
              <CardTitle className="text-lg mt-4">Attendance</CardTitle>
              <CardDescription>Track your attendance across all subjects</CardDescription>
            </CardHeader>
          </Card>

          {/* Timetable Card */}
          <Card className="border-border/50 shadow-md hover:shadow-xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-accent">5</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
              <CardTitle className="text-lg mt-4">Timetable</CardTitle>
              <CardDescription>View your daily and weekly schedule</CardDescription>
            </CardHeader>
          </Card>

          {/* Events Card */}
          <Card className="border-border/50 shadow-md hover:shadow-xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">3</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
              <CardTitle className="text-lg mt-4">Events</CardTitle>
              <CardDescription>Stay updated on academic events</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* AI Suggestions Card */}
        <Card className="border-accent/50 shadow-xl bg-gradient-to-br from-accent/5 to-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>AI Study Tips</CardTitle>
                <CardDescription>Personalized recommendations for you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-card rounded-lg border border-accent/20">
              <p className="text-sm font-medium mb-2">💡 Focus on Data Structures</p>
              <p className="text-sm text-muted-foreground">
                Your attendance in Data Structures is 72%. Consider attending more classes to improve understanding.
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-accent/20">
              <p className="text-sm font-medium mb-2">📚 Free Period Suggestion</p>
              <p className="text-sm text-muted-foreground">
                You have a 2-hour gap tomorrow. Perfect time to review last week's algorithms lecture!
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-accent/20">
              <p className="text-sm font-medium mb-2">🎯 Upcoming Exam Prep</p>
              <p className="text-sm text-muted-foreground">
                Mathematics exam in 5 days. Start with Chapter 3 - Linear Algebra today.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <Button variant="ghost" className="flex-col h-auto py-2">
              <GraduationCap className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2">
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-xs">Calendar</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2">
              <BookOpen className="w-5 h-5 mb-1" />
              <span className="text-xs">Attendance</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default StudentDashboard;
