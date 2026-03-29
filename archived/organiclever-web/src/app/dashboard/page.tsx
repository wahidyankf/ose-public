"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@open-sharia-enterprise/ts-ui";
import { Code, Users, LucideIcon } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Breadcrumb from "@/components/Breadcrumb";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  value: number;
  description: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon: Icon, value, description, onClick }) => (
  <Card className={onClick ? "cursor-pointer" : ""} onClick={onClick}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

interface DashboardContentProps {
  router: ReturnType<typeof useRouter>;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ router }) => (
  <div className="container mx-auto px-6 py-8">
    <Breadcrumb />
    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
    <div className="mt-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard title="Active Projects" icon={Code} value={12} description="Active software projects" />
        <DashboardCard
          title="Team Members"
          icon={Users}
          value={24}
          description="Across all projects"
          onClick={() => router.push("/dashboard/members")}
        />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { isAuthenticated, logout, setIntendedDestination } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      setIntendedDestination("/dashboard");
      router.push("/login");
    }
  }, [isAuthenticated, router, setIntendedDestination]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation logout={logout} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <DashboardContent router={router} />
        </main>
      </div>
    </div>
  );
}
