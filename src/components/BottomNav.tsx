import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Calendar, BookOpen, User } from "lucide-react";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: GraduationCap, label: "Home", path: "/student" },
    { icon: Calendar, label: "Calendar", path: "/student/calendar" },
    { icon: BookOpen, label: "Attendance", path: "/student/attendance" },
    { icon: User, label: "Profile", path: "/student/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-around items-center">
          {navItems.map(({ icon: Icon, label, path }) => (
            <Button
              key={path}
              variant="ghost"
              className={`flex-col h-auto py-2 ${
                location.pathname === path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => navigate(path)}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
