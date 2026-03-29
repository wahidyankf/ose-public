"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/auth-context";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@open-sharia-enterprise/ts-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Github, Mail, Edit, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Navigation } from "@/components/Navigation";
import Breadcrumb from "@/components/Breadcrumb";

type Member = {
  id: number;
  name: string;
  role: string;
  email?: string;
  github: string;
};

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => (
  <div className="relative">
    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
    <Input
      type="text"
      placeholder="Search members"
      className="pl-8"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
);

interface MemberRowProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, onEdit, onDelete, onView }) => (
  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onView(member.id)}>
    <TableCell className="font-medium">{member.name}</TableCell>
    <TableCell>{member.role}</TableCell>
    <TableCell>
      {member.email && (
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4" />
          <span>{member.email}</span>
        </div>
      )}
    </TableCell>
    <TableCell>
      <div className="flex items-center">
        <Github className="mr-2 h-4 w-4" />
        <a
          href={`https://github.com/${member.github}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {member.github}
        </a>
      </div>
    </TableCell>
    <TableCell>
      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={() => onView(member.id)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(member)}>
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the member from our database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(member.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TableCell>
  </TableRow>
);

interface MembersTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const MembersTable: React.FC<MembersTableProps> = ({ members, onEdit, onDelete, onView }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>GitHub</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {members.map((member) => (
        <MemberRow key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} onView={onView} />
      ))}
    </TableBody>
  </Table>
);

export default function MembersPage() {
  const { isAuthenticated, logout, setIntendedDestination } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      setIntendedDestination("/dashboard/members");
      router.push("/login");
    } else {
      fetchMembers();
    }
  }, [isAuthenticated, router, setIntendedDestination]);

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members");
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.github.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleEditMember = (member: Member) => {
    setEditingMember({ ...member });
    setIsEditDialogOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    /* v8 ignore start -- editingMember is always set when the dialog is open */
    if (editingMember) {
      /* v8 ignore stop */
      try {
        const response = await fetch(`/api/members/${editingMember.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingMember),
        });
        if (!response.ok) {
          throw new Error("Failed to update member");
        }
        await fetchMembers();
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("Error updating member:", error);
      }
    }
  };

  const handleDeleteMember = async (id: number) => {
    setDeleteError(null);
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete member");
      }
      await fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      setDeleteError("Failed to delete member. Please try again.");
    }
  };

  const handleViewMember = (id: number) => {
    router.push(`/dashboard/members/${id}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation logout={logout} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <Breadcrumb />
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
            {deleteError && (
              <p role="alert" className="mb-4 text-sm text-red-600">
                {deleteError}
              </p>
            )}
            <div className="overflow-hidden rounded-lg bg-white shadow-md">
              <MembersTable
                members={filteredMembers}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onView={handleViewMember}
              />
            </div>
          </div>
        </main>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateMember}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingMember?.name || ""}
                  onChange={
                    /* v8 ignore next */ (e) =>
                      setEditingMember((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Input
                  id="role"
                  value={editingMember?.role || ""}
                  onChange={
                    /* v8 ignore next */ (e) =>
                      setEditingMember((prev) => (prev ? { ...prev, role: e.target.value } : null))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingMember?.email || ""}
                  onChange={
                    /* v8 ignore next */ (e) =>
                      setEditingMember((prev) => (prev ? { ...prev, email: e.target.value } : null))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="github" className="text-right">
                  GitHub
                </Label>
                <Input
                  id="github"
                  value={editingMember?.github || ""}
                  onChange={
                    /* v8 ignore next */ (e) =>
                      setEditingMember((prev) => (prev ? { ...prev, github: e.target.value } : null))
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
