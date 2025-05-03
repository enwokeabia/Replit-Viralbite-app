import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("p-4 border hover:shadow-md transition-all duration-200 hover:border-purple-200", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 text-transparent bg-clip-text mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600/10 to-purple-800/10 flex items-center justify-center shadow-sm border border-purple-100">
          <div className="text-purple-700">
            {icon}
          </div>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center">
          <span 
            className={cn(
              "text-xs font-medium flex items-center py-1 px-2 rounded-full",
              trend.positive 
                ? "bg-gradient-to-r from-green-50 to-transparent text-green-700 border border-green-100" 
                : "bg-gradient-to-r from-red-50 to-transparent text-red-700 border border-red-100"
            )}
          >
            {trend.positive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
            {trend.value}
          </span>
          <span className="text-xs text-slate-500 ml-2">vs. previous period</span>
        </div>
      )}
    </Card>
  );
}
