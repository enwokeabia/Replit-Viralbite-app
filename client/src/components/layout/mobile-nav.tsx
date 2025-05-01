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
  Settings,
} from "lucide-react";

export function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  if (!user) return null;

  const isRestaurant = user.role === "restaurant";
  
  const navigationItems = isRestaurant
    ? [
        {
          path: "/restaurant/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          path: "/restaurant/campaigns",
          label: "Campaigns",
          icon: <Megaphone size={20} />,
        },
        {
          path: "/restaurant/submissions",
          label: "Submissions",
          icon: <ClipboardList size={20} />,
        },
        {
          path: "/restaurant/analytics",
          label: "Analytics",
          icon: <BarChart size={20} />,
        },
      ]
    : [
        {
          path: "/influencer/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          path: "/influencer/browse",
          label: "Browse",
          icon: <Search size={20} />,
        },
        {
          path: "/influencer/stats",
          label: "Stats",
          icon: <LineChart size={20} />,
        },
        {
          path: "/influencer/earnings",
          label: "Earnings",
          icon: <Wallet size={20} />,
        },
        {
          path: "/influencer/profile",
          label: "Profile",
          icon: <User size={20} />,
        },
        {
          path: "/influencer/settings",
          label: "Settings",
          icon: <Settings size={20} />,
        },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-10">
      <div className="flex items-center justify-around">
        {navigationItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={cn(
                "flex flex-col items-center p-3",
                location === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
