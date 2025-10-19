import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
}

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
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

        <h1 className="text-3xl font-bold mb-6">Events</h1>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No upcoming events</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{event.title}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {event.event_type}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.description && (
                    <p className="text-muted-foreground">{event.description}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-semibold">Date:</span>{" "}
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
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

export default Events;