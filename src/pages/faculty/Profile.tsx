import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, LogOut, User, Mail, Building, Edit, Save, X, Camera } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  department: z.string().trim().min(1, "Department is required").max(100, "Department must be less than 100 characters"),
});

interface Profile {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  created_at: string;
  profile_picture_url: string | null;
}

const FacultyProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    department: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setEditForm({
        full_name: data.full_name || "",
        department: data.department || "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        department: profile.department || "",
      });
    }
  };

  const handleSave = async () => {
    try {
      setErrors({});
      
      // Validate form
      const validatedData = profileSchema.parse(editForm);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validatedData.full_name,
          department: validatedData.department,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      loadProfile();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the errors in the form");
      } else {
        toast.error(error.message || "Failed to update profile");
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/profile.${fileExt}`;

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile picture updated successfully!');
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">My Profile</h1>
              <p className="text-xs text-muted-foreground">View and edit your information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button variant="ghost" size="icon" onClick={handleEdit}>
                <Edit className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <Card className="mb-6 border-border/50 shadow-lg overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-accent to-primary"></div>
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col items-center -mt-16 mb-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
                  <AvatarImage src={profile?.profile_picture_url || undefined} alt={profile?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-5xl text-primary-foreground font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="w-5 h-5" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
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
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    className={errors.full_name ? "border-destructive" : ""}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <User className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{profile?.full_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={editForm.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    className={errors.department ? "border-destructive" : ""}
                  />
                  {errors.department && (
                    <p className="text-sm text-destructive">{errors.department}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Building className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{profile?.department}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-accent to-accent/90">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Button
            onClick={() => navigate("/faculty")}
            variant="outline"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FacultyProfile;
