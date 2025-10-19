import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ScanAttendanceQR = () => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } });

    const onScanSuccess = async (decodedText: string) => {
      try {
        const qrData = JSON.parse(decodedText);
        const now = new Date();

        const { data: session } = await supabase
          .from("attendance_sessions")
          .select("*")
          .eq("session_id", qrData.session_id)
          .eq("is_active", true)
          .single();

        if (!session) {
          toast.error("QR expired or invalid");
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("User not logged in");
          return;
        }

        const { error } = await supabase.from("attendance_records").insert({
          student_id: user.id,
          session_id: session.session_id,
          subject: session.subject,
          timestamp: now.toISOString(),
        });

        if (error) throw error;
        toast.success("✅ Attendance marked successfully!");
        scanner.clear();
      } catch (err) {
        console.error(err);
        toast.error("Invalid QR or scan failed!");
      }
    };

    scanner.render(onScanSuccess, (error) => console.warn("Scan error", error));

    return () => scanner.clear();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F5EB]">
      <h1 className="text-2xl font-bold text-[#7D3C0A] mb-4">Scan Attendance QR</h1>
      <div id="reader" style={{ width: "100%" }} />
    </div>
  );
};

export default ScanAttendanceQR;
