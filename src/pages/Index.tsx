import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Calendar, BookOpen, Lightbulb, Users, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        navigate(profile.role === "student" ? "/student" : "/faculty");
      } else {
        navigate("/role-selection");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Student Diary
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A smart academic PWA for students and faculty — bringing attendance, academics, AI-powered learning tips, and event management together
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg hover:shadow-xl transition-all text-lg"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 text-lg"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
          Everything You Need
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Student Features */}
          <Card className="bg-card text-card-foreground border-border/50 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Attendance Tracking</CardTitle>
              <CardDescription>
                Track your attendance with QR scanning and GPS validation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card text-card-foreground border-border/50 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Smart Timetable</CardTitle>
              <CardDescription>
                Personalized daily and weekly schedules at your fingertips
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card text-card-foreground border-border/50 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI Study Tips</CardTitle>
              <CardDescription>
                Get personalized learning recommendations powered by AI
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Faculty Features */}
          <Card className="bg-card text-card-foreground border-border/50 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>QR Attendance</CardTitle>
              <CardDescription>
                Generate secure QR codes for quick attendance marking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card text-card-foreground border-border/50 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                Track and manage student progress and attendance records
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card text-card-foreground border-border/50 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Event Creator</CardTitle>
              <CardDescription>
                Organize and share academic and extracurricular events
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="bg-card text-card-foreground max-w-4xl mx-auto border-border shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl font-heading mb-4">
              Ready to Transform Your Academic Experience?
            </CardTitle>
            <CardDescription className="text-lg">
              Join thousands of students and faculty using Student Diary
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg hover:shadow-xl transition-all text-lg"
              onClick={() => navigate("/auth")}
            >
              Get Started Now
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
