import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import BottomNav from "@/components/BottomNav";

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  created_at: string;
}

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPastEvent = (eventDate: string) => {
    return new Date(eventDate) < new Date();
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

        <h1 className="text-3xl font-bold mb-6">Events</h1>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">No events scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className={isPastEvent(event.event_date) ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {event.title}
                    </span>
                    {event.event_type && (
                      <span className="text-sm font-normal px-3 py-1 bg-primary/10 text-primary rounded-full">
                        {event.event_type}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-muted-foreground mb-3">{event.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.event_date), "PPP")}
                    </p>
                    {isPastEvent(event.event_date) && (
                      <span className="text-sm text-muted-foreground">Past Event</span>
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

export default Events;