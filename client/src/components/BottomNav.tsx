import { Link, useLocation } from "wouter";
import { User, Briefcase, FileText, ClipboardList } from "lucide-react";

const navItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Jobs",
    url: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: ClipboardList,
  },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 hover-elevate ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`link-bottom-nav-${item.title.toLowerCase()}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
