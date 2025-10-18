import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import QRCode from "qrcode";

const GenerateAttendanceQR = () => {
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      // QR code expired
      deactivateSession();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Check if user is a faculty member
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (profile?.role !== "faculty") {
      navigate("/");
      toast.error("Only faculty members can access this page");
    }
  };

  const generateQRCode = async () => {
    if (!classId || !subject) {
      toast.error("Please enter class ID and subject");
      return;
    }

    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Calculate expiry time (90 seconds from now)
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 90);
      
      // Generate a session ID locally since the table might not exist yet
      const localSessionId = crypto.randomUUID();
      
      try {
        // Try to create session in Supabase if table exists
        const { data: session, error } = await supabase
          .from("attendance_sessions")
          .insert({
            class_id: classId,
            subject: subject,
            expires_at: expiresAt.toISOString(),
            is_active: true,
            created_by: user.id
          })
          .select()
          .single();
        
        if (!error) {
          setSessionId(session.session_id);
        } else {
          console.error("Could not save to Supabase, using local session:", error);
          setSessionId(localSessionId);
        }
      } catch (err) {
        console.error("Error accessing attendance_sessions table:", err);
        // Fall back to local session ID
        setSessionId(localSessionId);
      }
      
      // Generate QR code with session data
      const qrData = JSON.stringify({
        session_id: sessionId || localSessionId,
        subject: subject,
        timestamp: new Date().toISOString()
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      
      // Update state
      setQrCodeUrl(qrCodeDataUrl);
      setSessionId(sessionId || localSessionId);
      setCountdown(90);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const deactivateSession = async () => {
    if (!sessionId) return;
    
    try {
      await supabase
        .from("attendance_sessions")
        .update({ is_active: false })
        .eq("session_id", sessionId);
      
      setQrCodeUrl(null);
      setSessionId(null);
      setCountdown(null);
    } catch (error: any) {
      console.error("Failed to deactivate session:", error);
    }
  };

  // Create a circular progress indicator for countdown
  const calculateProgress = () => {
    if (countdown === null) return 0;
    return (countdown / 90) * 100;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Generate Attendance QR</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Attendance Session</CardTitle>
          <CardDescription>
            Generate a QR code for students to scan and mark their attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="classId">Class ID</Label>
              <Input
                id="classId"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="Enter class ID"
                disabled={loading || countdown !== null}
              />
            </div>
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject name"
                disabled={loading || countdown !== null}
              />
            </div>
            
            <Button 
              onClick={generateQRCode} 
              disabled={loading || countdown !== null}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate QR Code"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {qrCodeUrl && countdown !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance QR Code</CardTitle>
            <CardDescription>
              Valid for {countdown} seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative">
              <img src={qrCodeUrl} alt="Attendance QR Code" className="w-64 h-64" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-72 h-72">
                  <circle
                    cx="144"
                    cy="144"
                    r="70"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="144"
                    cy="144"
                    r="70"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray="440"
                    strokeDashoffset={440 - (440 * calculateProgress()) / 100}
                    transform="rotate(-90 144 144)"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
              </div>
            </div>
            <p className="text-center mt-4 text-2xl font-bold">{countdown}s</p>
          </CardContent>
        </Card>
      )}
      
      {countdown === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-xl font-semibold text-red-500 mb-4">QR expired — generate new one.</p>
              <Button onClick={() => {
                setQrCodeUrl(null);
                setSessionId(null);
                setCountdown(null);
              }}>
                Generate New QR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <BottomNav />
    </div>
  );
};

export default GenerateAttendanceQR;