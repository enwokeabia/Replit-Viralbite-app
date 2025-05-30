import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Store,
  User,
  LayoutDashboard,
  Megaphone,
  ClipboardList,
  BarChart,
  Search,
  LineChart,
  Wallet,
  LogOut,
  Settings,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isRestaurant = user.role === "restaurant";
  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const navigationItems = isRestaurant
    ? [
        {
          path: "/restaurant/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard size={18} />,
        },
        {
          path: "/restaurant/campaigns",
          label: "Campaigns",
          icon: <Megaphone size={18} />,
        },
        {
          path: "/restaurant/submissions",
          label: "Submissions",
          icon: <ClipboardList size={18} />,
        },
        {
          path: "/restaurant/private-invitations",
          label: "Private Invitations",
          icon: <Mail size={18} />,
        },
        {
          path: "/restaurant/analytics",
          label: "Analytics",
          icon: <BarChart size={18} />,
        },
        {
          path: "/restaurant/settings",
          label: "Settings",
          icon: <Settings size={18} />,
        },
      ]
    : [
        {
          path: "/influencer/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard size={18} />,
        },
        {
          path: "/influencer/browse",
          label: "Browse Campaigns",
          icon: <Search size={18} />,
        },
        {
          path: "/influencer/private-invitations",
          label: "Private Invitations",
          icon: <Mail size={18} />,
        },
        {
          path: "/influencer/stats",
          label: "Earnings & Stats",
          icon: <Wallet size={18} />,
        },
        {
          path: "/influencer/profile",
          label: "Profile",
          icon: <User size={18} />,
        },
        {
          path: "/influencer/settings",
          label: "Settings",
          icon: <Settings size={18} />,
        },
      ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside
      className={cn(
        "flex flex-col w-64 bg-white border-r border-border h-screen",
        className
      )}
    >
      <div className="p-4 border-b border-border bg-gradient-to-r from-slate-50 to-white">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 text-transparent bg-clip-text">ViralBite</h1>
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6">
          <Avatar className="h-10 w-10 bg-muted">
            {user.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.name} />
            ) : (
              <AvatarFallback>
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {isRestaurant ? "Restaurant Owner" : "Influencer"}
            </p>
          </div>
        </div>

        <nav>
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                      location === item.path
                        ? "bg-gradient-to-r from-purple-800/15 to-purple-600/10 text-purple-800 font-medium shadow-sm border border-purple-100"
                        : "hover:bg-slate-50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}

            <li className="pt-6">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut size={18} className="mr-3" />
                <span>Logout</span>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
