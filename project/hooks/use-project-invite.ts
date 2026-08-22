// hooks/use-project-invite.ts
"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  searchUsersForInvite,
  addProjectMember,
} from "@/lib/actions/project-member";
import { useToast } from "@/hooks/use-toast";
import type { ProjectMember, ProjectMemberRole } from "@/types";

type SearchUser = {
  id: string;
  email: string;
  name: string;
  status: "available" | "member" | "owner";
  role?: ProjectMemberRole;
};

type UseProjectInviteProps = {
  projectId: string;
  onMemberAdded: (projectId: string, member: ProjectMember) => void;
  onMemberAddConfirmed: (
    projectId: string,
    tempId: string,
    realMember: ProjectMember,
  ) => void;
  onMemberRemoved: (projectId: string, memberId: string) => void;
  onSuccess: () => void;
};

export function useProjectInvite({
  projectId,
  onMemberAdded,
  onMemberAddConfirmed,
  onMemberRemoved,
  onSuccess,
}: UseProjectInviteProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>("viewer");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);

  // Click outside listener for the search dropdown container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live user search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsLoadingSearch(false);
      return;
    }

    setIsLoadingSearch(true);
    setShowDropdown(true);
    const currentRequestId = ++searchRequestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const result = await searchUsersForInvite(projectId, trimmed);
        if (currentRequestId !== searchRequestIdRef.current) return;

        if (result.success) {
          setSearchResults(result.data.slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        if (currentRequestId === searchRequestIdRef.current) {
          console.error("Failed to search users:", err);
          setSearchResults([]);
        }
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setIsLoadingSearch(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, projectId]);

  function resetInviteState() {
    setQuery("");
    setSelectedUser(null);
    setSearchResults([]);
    setShowDropdown(false);
    setInviteRole("viewer");
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    const targetEmail = selectedUser.email;
    const targetName = selectedUser.name;
    const assignedRole = inviteRole;
    const tempId = `temp-${Date.now()}`;

    const tempMember: ProjectMember = {
      id: tempId,
      userId: selectedUser.id,
      email: targetEmail,
      name: targetName,
      role: assignedRole,
    };

    onMemberAdded(projectId, tempMember);
    onSuccess();

    startTransition(async () => {
      const result = await addProjectMember(projectId, {
        email: targetEmail,
        role: assignedRole,
      });

      if (!result.success) {
        onMemberRemoved(projectId, tempId);
        toast({
          title: "Failed to add member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      onMemberAddConfirmed(projectId, tempId, {
        id: result.data.id,
        userId: result.data.userId,
        role: result.data.role,
        email: targetEmail,
        name: targetName,
      });

      toast({
        title: "Member added successfully",
        description: `${targetEmail} added as ${assignedRole}.`,
      });
    });
  }

  return {
    query,
    setQuery,
    selectedUser,
    setSelectedUser,
    inviteRole,
    setInviteRole,
    searchResults,
    isLoadingSearch,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    isPending,
    handleAddMember,
    resetInviteState,
  };
}
