import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, RefreshCw, Clock } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { v4 as uuidv4 } from "uuid";

const QR_EXPIRATION_SECONDS = 90;

const GenerateAttendanceQR = () => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentSubject, setCurrentSubject] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (qrData && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            deactivateSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [qrData, timeLeft]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/auth");

    try {
      // First check if user exists in faculty table
      const { data: faculty, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("faculty_id", user.id)
        .single();

      // If no faculty record found, create one
      if (error || !faculty) {
        // Create a faculty record for this user
        const { error: insertError } = await supabase
          .from("faculty")
          .insert({
            faculty_id: user.id,
            name: user.email?.split('@')[0] || 'Faculty',
            email: user.email,
            current_subject: "General"
          });
          
        if (insertError) {
          console.error("Error creating faculty record:", insertError);
          toast.error("Error setting up your account");
          return;
        }
        
        setCurrentSubject("General");
      } else if (faculty && faculty.current_subject) {
        setCurrentSubject(faculty.current_subject);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      toast.error("Error checking authentication");
    }
  };

  const generateQRCode = async () => {
    try {
      setLoading(true);

      // Basic validation for Session ID and Name
      const sid = sessionId.trim();
      const sname = (currentSubject || "").trim();
      const idRegex = /^[A-Za-z0-9-_]{3,64}$/;
      if (!sid || !idRegex.test(sid)) {
        toast.error("Enter a valid Session ID (3-64 chars: letters, numbers, - or _).");
        return;
      }
      if (!sname || sname.length < 2 || sname.length > 100) {
        toast.error("Enter a valid Session Name (2-100 chars).");
        return;
      }

      // Ensure Session ID not already in use (avoids duplicates on validation)
      const { data: existing } = await supabase
        .from("attendance_sessions")
        .select("session_id, is_active, expires_at")
        .eq("session_id", sid)
        .maybeSingle();

      if (existing) {
        const notExpired = existing.expires_at ? new Date(existing.expires_at).getTime() > Date.now() : false;
        if (existing.is_active && notExpired) {
          toast.error("Session ID already in use. Choose a different ID.");
          return;
        }
      }

      // First deactivate any existing session for this screen
      await deactivateSession();

      // Clear existing QR data immediately
      setQrData(null);
      setTimeLeft(0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const now = new Date();
      const expiresAt = new Date(now.getTime() + QR_EXPIRATION_SECONDS * 1000);

      const newQrData = {
        session_id: sid,
        session_name: sname,
        created_by: user.id,
        timestamp: now.toISOString(),
        v: 1,
      };

      // First try to update if exists but inactive, otherwise insert
      const { error: upsertError } = await supabase
        .from("attendance_sessions")
        .upsert({
          session_id: sid,
          class_id: "default-class",
          subject: sname,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_by: user.id
        }, {
          onConflict: 'session_id',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;

      // Set new QR data and timer
      setQrData(newQrData);
      setTimeLeft(QR_EXPIRATION_SECONDS);
      toast.success("New QR Code generated!");
    } catch (err: any) {
      toast.error(err.message || "Error generating QR code");
    } finally {
      setLoading(false);
    }
  };

  const deactivateSession = useCallback(async () => {
    if (!qrData) return;
    try {
      await supabase
        .from("attendance_sessions")
        .update({ is_active: false })
        .eq("session_id", qrData.session_id);

      setQrData(null);
      setTimeLeft(0);
    } catch (err) {
      console.error("Error deactivating session:", err);
    }
  }, [qrData]);

  const formatTimeLeft = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F5EB]">
      <div className="flex-1 container mx-auto p-4">
        <h1 className="text-2xl font-bold text-[#7D3C0A] mb-4">Generate Attendance QR</h1>
        <Card className="bg-[#F9F5EB] border-[#E4DCCF]">
          <CardHeader>
            <CardTitle className="text-[#7D3C0A]">Attendance QR Code</CardTitle>
            <CardDescription>QR valid for 90 seconds only</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="grid gap-2">
                <Label htmlFor="sessionId">Session ID</Label>
                <Input
                  id="sessionId"
                  placeholder="e.g. CSE101-2025-10-19"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  placeholder="e.g. Computer Networks"
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                />
              </div>
            </div>
            {qrData ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <QRCodeSVG value={JSON.stringify(qrData)} size={250} level="H" includeMargin />
                </div>
                <div className="flex items-center mb-2 text-[#7D3C0A]">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>Expires in: {formatTimeLeft(timeLeft)}</span>
                </div>
                <Button
                  className="w-full bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                  onClick={generateQRCode}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Generate New
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                onClick={generateQRCode}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate QR Code"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default GenerateAttendanceQR;
