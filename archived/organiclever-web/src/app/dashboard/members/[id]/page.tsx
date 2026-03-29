"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@open-sharia-enterprise/ts-ui";
import { Github, Mail } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Breadcrumb from "@/components/Breadcrumb";

type Member = {
  id: number;
  name: string;
  role: string;
  email?: string;
  github: string;
};

const MemberInfo = ({ member }: { member: Member }) => (
  <div className="space-y-4">
    <div>
      <strong>Role:</strong> {member.role}
    </div>
    {member.email && (
      <div className="flex items-center">
        <Mail className="mr-2 h-4 w-4" />
        <span>{member.email}</span>
      </div>
    )}
    <div className="flex items-center">
      <Github className="mr-2 h-4 w-4" />
      <a
        href={`https://github.com/${member.github}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {member.github}
      </a>
    </div>
  </div>
);

const MemberCard = ({ member }: { member: Member }) => (
  <Card>
    <CardHeader>
      <CardTitle>{member.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <MemberInfo member={member} />
    </CardContent>
  </Card>
);

const MemberDetailContent = ({ member }: { member: Member }) => (
  <div className="container mx-auto px-6 py-8">
    <Breadcrumb />
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Member Details</h1>
    </div>
    <MemberCard member={member} />
  </div>
);

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated, logout, setIntendedDestination } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const router = useRouter();

  const fetchMember = useCallback(async () => {
    try {
      const response = await fetch(`/api/members/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch member");
      }
      const data = await response.json();
      setMember(data);
    } catch (error) {
      console.error("Error fetching member:", error);
      router.push("/dashboard/members");
    }
  }, [id, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIntendedDestination(`/dashboard/members/${id}`);
      router.push("/login");
    } else {
      fetchMember();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router, fetchMember]);

  if (!isAuthenticated || !member) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation logout={logout} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <MemberDetailContent member={member} />
        </main>
      </div>
    </div>
  );
}
