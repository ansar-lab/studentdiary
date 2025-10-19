import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import BottomNav from "@/components/BottomNav";

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  file_url: string;
  created_at: string;
}

const Assignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/student")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-6">Assignments</h1>

        {loading ? (
          <p>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">No assignments available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {assignment.title}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {assignment.subject}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignment.description && (
                    <p className="text-muted-foreground mb-3">{assignment.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isOverdue(assignment.due_date) ? "text-destructive" : "text-muted-foreground"}`}>
                        Due: {format(new Date(assignment.due_date), "PPpp")}
                      </p>
                      {isOverdue(assignment.due_date) && (
                        <p className="text-sm text-destructive font-medium">Overdue</p>
                      )}
                    </div>
                    {assignment.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(assignment.file_url, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View File
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Assignments;