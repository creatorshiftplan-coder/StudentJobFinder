import { useState } from "react";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  PenTool, 
  Camera, 
  Briefcase, 
  ClipboardList,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    submenu: [
      {
        title: "Signature",
        url: "/signature",
        icon: PenTool,
      },
      {
        title: "Photo",
        url: "/photo",
        icon: Camera,
      },
    ],
  },
  {
    title: "Jobs",
    url: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: ClipboardList,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-bold px-4 py-4">
            JobAssist
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item: any) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    {item.submenu ? (
                      <>
                        <SidebarMenuButton
                          onClick={() => toggleSubmenu(item.title)}
                          className="cursor-pointer"
                          isActive={location === item.url || item.submenu?.some((sub: any) => location === sub.url)}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${expandedItems[item.title] ? "rotate-180" : ""}`} />
                        </SidebarMenuButton>
                        {expandedItems[item.title] && (
                          <SidebarMenuSub>
                            {item.submenu.map((subItem: any) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuButton asChild isActive={location === subItem.url}>
                                  <Link href={subItem.url} data-testid={`link-nav-${subItem.title.toLowerCase()}`}>
                                    <subItem.icon className="h-5 w-5" />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </>
                    ) : (
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-md bg-sidebar-accent">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt="Student" />
            <AvatarFallback>ST</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Student Name</p>
            <p className="text-xs text-muted-foreground truncate">student@email.com</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0" 
            data-testid="button-logout"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
