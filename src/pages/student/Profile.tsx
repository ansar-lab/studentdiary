import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, User, Mail, Hash, BookOpen, Building } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  roll_number: string;
  course: string;
  department: string;
  role: string;
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
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
      setProfile(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load profile");
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">My Profile</h1>
              <p className="text-xs text-muted-foreground">View your information</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <Card className="mb-6 border-border/50 shadow-lg overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary to-accent"></div>
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col items-center -mt-16 mb-4">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-5xl text-white font-bold border-4 border-card shadow-xl">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-heading font-bold mt-4">{profile?.full_name}</h2>
              <p className="text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="space-y-4">
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
              </div>
              
              {profile?.roll_number && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Hash className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{profile.roll_number}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.course && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <BookOpen className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="font-medium">{profile.course}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Building className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">{profile?.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
