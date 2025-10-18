import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, QrCode, Upload, Calendar, LogOut, User, Users, QrCodeIcon } from "lucide-react";
import { toast } from "sonner";

const FacultyDashboard = () => {
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
      
      if (data.role !== "faculty") {
        navigate("/student");
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-card border-border shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">Faculty Portal</h1>
              <p className="text-xs text-muted-foreground">Welcome, {profile?.full_name}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/faculty/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Profile Card */}
        <Card className="mb-8 border-border/50 shadow-lg">
          <CardHeader className="bg-accent/10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{profile?.full_name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  Faculty • {profile?.department}
                </CardDescription>
              </div>
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-2xl text-white font-bold">
                {profile?.full_name?.charAt(0)}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-accent">142</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">5</p>
                  <p className="text-xs text-muted-foreground">Classes Today</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-accent">2</p>
                  <p className="text-xs text-muted-foreground">Events Created</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-accent/50 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Generate QR Code</CardTitle>
                  <CardDescription>Create attendance QR for your class</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/faculty/generate-attendance-qr")} 
                className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
              >
                Generate Now
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/50 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Upload Assignment</CardTitle>
                  <CardDescription>Share study materials with students</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                Upload Files
              </Button>
            </CardContent>
          </Card>

          <Card className="border-accent/50 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">View Attendance</CardTitle>
                  <CardDescription>Track and manage student attendance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-2">
                View Records
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/50 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create Event</CardTitle>
                  <CardDescription>Add academic or extracurricular events</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-2">
                Add Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
