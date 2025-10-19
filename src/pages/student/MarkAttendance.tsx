import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAISuggestions } from "@/lib/ai";

const ScanAttendanceQR = () => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText: string) => {
      let qrData: any = null;
      try {
        // Some scanners return plain text or URL-encoded payloads. Try to be forgiving.
        const trimmed = decodedText?.trim();
        try {
          qrData = JSON.parse(trimmed);
        } catch (e) {
          // If not JSON, try decodeURIComponent then parse
          try {
            qrData = JSON.parse(decodeURIComponent(trimmed));
          } catch (e2) {
            console.warn("Failed to parse QR payload as JSON", { decodedText, e, e2 });
            toast.error("Invalid QR code");
            return;
          }
        }

        if (!qrData || !qrData.session_id) {
          toast.error("Invalid QR payload");
          return;
        }

        const now = new Date();

        // Fetch session by session_id first, then validate expiry/is_active client-side
        const { data: session, error: sessionError } = await supabase
          .from("attendance_sessions")
          .select("*")
          .eq("session_id", qrData.session_id)
          .maybeSingle();

        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          toast.error("Error validating QR");
          return;
        }

        if (!session) {
          toast.error("QR expired or invalid");
          return;
        }

        // Check expiry using expires_at (server stores timestamp with timezone)
        const expiresAt = session.expires_at ? new Date(session.expires_at) : null;
        if (!session.is_active || (expiresAt && expiresAt.getTime() <= now.getTime())) {
          toast.error("QR expired or invalid");
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("User not logged in");
          return;
        }

        // Prevent duplicate attendance for the same session
        const { data: existing } = await supabase
          .from("attendance_records")
          .select("record_id")
          .eq("student_id", user.id)
          .eq("session_id", session.session_id)
          .maybeSingle();

        if (existing) {
          toast.success("Attendance already marked for this session.");
          try { await scanner.clear(); } catch {}
          return;
        }

        // Insert attendance record (biometric authentication removed)
        const { error: insertError } = await supabase.from("attendance_records").insert({
          student_id: user.id,
          session_id: session.session_id,
          subject: session.subject,
          scan_time: now.toISOString(),
        });

        if (insertError) {
          // Unique constraint or other errors should be surfaced
          console.error("Failed to insert attendance record:", insertError);
          toast.error(insertError.message || "Failed to mark attendance");
          return;
        }

        toast.success("✅ Attendance marked successfully!");

        // Ask server-side AI for suggestions based on this attendance
        try {
          const suggestions = await getAISuggestions({ studentId: user.id, sessionId: session.session_id, subject: session.subject });
          console.log('AI suggestions:', suggestions);
          // Optionally show a toast or UI element with suggestions
          if (suggestions && suggestions.message) {
            toast(suggestions.message);
          }
        } catch (aiErr) {
          console.warn('AI suggestion failed:', aiErr);
        }
        // stop scanning after successful mark
        try {
          await scanner.clear();
        } catch (clearErr) {
          console.warn("Failed to clear scanner:", clearErr);
        }
      } catch (err) {
        console.error("Unexpected error scanning QR:", err);
        toast.error("Invalid QR or scan failed!");
      }
    };

    scanner.render(onScanSuccess, (error) => console.warn("Scan error", error));

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F5EB]">
      <h1 className="text-2xl font-bold text-[#7D3C0A] mb-4">Scan Attendance QR</h1>
      <div id="reader" style={{ width: "100%" }} />
    </div>
  );
};

export default ScanAttendanceQR;
