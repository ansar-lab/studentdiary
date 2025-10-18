import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, BookOpen } from "lucide-react";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<"student" | "faculty" | null>(null);
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [course, setCourse] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        role: selectedRole,
        roll_number: selectedRole === "student" ? rollNumber : null,
        course: selectedRole === "student" ? course : null,
        department,
      });

      if (error) throw error;

      toast.success("Profile created successfully!");
      navigate(selectedRole === "student" ? "/student" : "/faculty");
    } catch (error: any) {
      toast.error(error.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">Choose your role and provide details</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card
            className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
              selectedRole === "student"
                ? "border-primary shadow-lg scale-105"
                : "border-border/50 hover:border-primary/50"
            }`}
            onClick={() => setSelectedRole("student")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Student</CardTitle>
              <CardDescription>Access your academic portal and track your progress</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
              selectedRole === "faculty"
                ? "border-accent shadow-lg scale-105"
                : "border-border/50 hover:border-accent/50"
            }`}
            onClick={() => setSelectedRole("faculty")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Faculty</CardTitle>
              <CardDescription>Manage classes, attendance, and student progress</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {selectedRole && (
          <Card className="border-border/50 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <CardDescription>
                Fill in your information to complete your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              {selectedRole === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="CS2024001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="Computer Science"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Engineering"
                  required
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
              >
                {loading ? "Creating Profile..." : "Complete Setup"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RoleSelection;
