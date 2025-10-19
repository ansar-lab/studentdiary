import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  file_url: string;
}

const Assignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="p-4 max-w-4xl mx-auto">
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
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No assignments available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{assignment.title}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {assignment.subject}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {assignment.description && (
                    <p className="text-muted-foreground">{assignment.description}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-semibold">Due:</span>{" "}
                    {new Date(assignment.due_date).toLocaleString()}
                  </p>
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