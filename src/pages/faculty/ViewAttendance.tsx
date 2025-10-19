import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  record_id: string;
  student_id: string;
  subject: string;
  session_id: string;
  scan_time: string;
  status: string;
}

const ViewAttendance = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .order("scan_time", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupBySubject = () => {
    const grouped: Record<string, AttendanceRecord[]> = {};
    records.forEach((record) => {
      if (!grouped[record.subject]) {
        grouped[record.subject] = [];
      }
      grouped[record.subject].push(record);
    });
    return grouped;
  };

  const groupedRecords = groupBySubject();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/faculty")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              View Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading attendance records...</p>
            ) : records.length === 0 ? (
              <p className="text-muted-foreground">No attendance records found</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedRecords).map(([subject, subjectRecords]) => (
                  <div key={subject}>
                    <h3 className="text-lg font-semibold mb-3">{subject}</h3>
                    <div className="space-y-2">
                      {subjectRecords.map((record) => (
                        <div
                          key={record.record_id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">Session: {record.session_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.scan_time), "PPpp")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              {record.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewAttendance;