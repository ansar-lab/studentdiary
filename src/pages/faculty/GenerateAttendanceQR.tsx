import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const GenerateAttendanceQR = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState("CSE101"); // Default course ID for demo
  const [facultyId, setFacultyId] = useState<string | null>(null);

  useEffect(() => {
    // Get faculty ID from auth session
    const getFacultyId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setFacultyId(data.session.user.id);
      }
    };

    getFacultyId();
  }, []);

  const generateQRCode = async () => {
    if (!facultyId) {
      toast.error("Please login to generate attendance QR code");
      return;
    }

    setLoading(true);
    try {
      // Create a new attendance session
      const timestamp = new Date().toISOString();
      const { data, error } = await supabase
        .from("attendance_sessions")
        .insert({
          course_id: courseId,
          faculty_id: facultyId,
          created_at: timestamp,
          status: "active"
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      toast.success("QR code generated successfully");
    } catch (error: any) {
      console.error("Error generating QR code:", error);
      toast.error(error.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({ status: "closed" })
        .eq("id", sessionId);

      if (error) throw error;

      setSessionId(null);
      toast.success("Attendance session closed");
    } catch (error: any) {
      console.error("Error closing session:", error);
      toast.error(error.message || "Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate QR code display when sessionId changes
    if (sessionId && qrRef.current) {
      // Simple visual representation of a QR code (placeholder)
      qrRef.current.innerHTML = `
        <div class="qr-code-display">
          <div class="text-center p-4 bg-white rounded-lg" style="width: 200px; height: 200px; margin: 0 auto;">
            <div class="font-bold mb-2">Session QR Code</div>
            <div class="text-xs overflow-hidden break-all">${sessionId}</div>
            <div class="border-2 border-black mt-2 p-2 rounded">
              <div class="grid grid-cols-5 gap-1">
                ${Array(25).fill(0).map(() => 
                  `<div class="w-6 h-6 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}"></div>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }, [sessionId]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F5EB]">
      <div className="flex-1 container mx-auto p-4">
        <h1 className="text-2xl font-bold text-[#7D3C0A] mb-4">Generate Attendance QR</h1>
        
        <Card className="bg-[#F9F5EB] border-[#E4DCCF] mb-6">
          <CardHeader>
            <CardTitle className="text-[#7D3C0A]">Attendance QR Code</CardTitle>
            <CardDescription>Generate a QR code for students to scan and mark attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionId ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg mb-4" ref={qrRef}>
                  {/* QR code will be rendered here */}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Session ID: {sessionId}
                </p>
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={closeSession}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Closing Session...
                    </>
                  ) : (
                    "Close Session"
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                onClick={generateQRCode}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate QR Code"
                )}
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