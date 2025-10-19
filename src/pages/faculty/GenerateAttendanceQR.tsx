import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    setCurrentSubject("General");
  };

  const generateQRCode = async () => {
    try {
      setLoading(true);
      await deactivateSession();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const sessionId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + QR_EXPIRATION_SECONDS * 1000);

      const newQrData = {
        session_id: sessionId,
        created_by: user.id,
        subject: currentSubject || "General",
        timestamp: now.toISOString(),
      };

      const { error: insertError } = await supabase
        .from("attendance_sessions")
        .insert({
          session_id: sessionId,
          class_id: "default-class",
          subject: currentSubject || "General",
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_by: user.id
        });

      if (insertError) throw insertError;

      setQrData(newQrData);
      setTimeLeft(QR_EXPIRATION_SECONDS);
      toast.success("QR Code generated!");
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
