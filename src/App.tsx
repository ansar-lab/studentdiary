import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import NotFound from "./pages/NotFound";
import Calendar from "./pages/student/Calendar";
import Profile from "./pages/student/Profile";
import Attendance from "./pages/student/Attendance";
import Timetable from "./pages/student/Timetable";
import FacultyProfile from "./pages/faculty/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/calendar" element={<Calendar />} />
          <Route path="/student/profile" element={<Profile />} />
          <Route path="/student/attendance" element={<Attendance />} />
          <Route path="/student/timetable" element={<Timetable />} />
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/profile" element={<FacultyProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
