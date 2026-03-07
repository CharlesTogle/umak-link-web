"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomToast } from "@/components/ui/custom-toast";
import { UserCircle2, Trash2, ShieldCheck, Users, Download, CheckSquare, Square, MoreVertical, Pencil, ChevronLeft, ChevronRight, Calendar, Clock, Search, Filter, ArrowUpDown } from "lucide-react";
import type { PortalUserType } from "@/types/auth";
import { fetchUsers, updateUserRole, searchUsers as searchUsersAPI } from "@/services/admin-service";
import { insertAuditLog } from "@/services/audit-logs-service";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { UserListItem } from "@/types/auth";
import Image from "next/image";
import { toPhilippineTime, getRelativeTime } from "@/lib/date-utils";

interface UserCardProps {
  user: UserListItem;
  isCurrentUser: boolean;
  onRemove: (user: UserListItem) => void;
  onEdit?: (user: UserListItem) => void;
  isRemoving: boolean;
  isSelected?: boolean;
  onToggleSelect?: (userId: string) => void;
  showCheckbox?: boolean;
  isHighlighted?: boolean;
}

function UserCard({ user, isCurrentUser, onRemove, onEdit, isRemoving, isSelected, onToggleSelect, showCheckbox, isHighlighted }: UserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = user.user_name?.trim() || "Unknown User";
  const displayEmail = user.email || "No email";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div
      id={`user-card-${user.user_id}`}
      className={`group rounded-3xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        isSelected ? "border-[#1D2981] ring-2 ring-[#1D2981]/20" :
        isHighlighted ? "border-yellow-400 ring-4 ring-yellow-400/40 bg-yellow-50/50" :
        "border-slate-200"
      }`}>
      <div className="flex items-center gap-4">
        {showCheckbox && !isCurrentUser && (
          <button
            type="button"
            onClick={() => onToggleSelect?.(user.user_id)}
            className="shrink-0 text-slate-400 transition hover:text-[#1D2981]"
            aria-label={isSelected ? "Deselect user" : "Select user"}
          >
            {isSelected ? (
              <CheckSquare className="size-5 text-[#1D2981]" />
            ) : (
              <Square className="size-5" />
            )}
          </button>
        )}
        {showCheckbox && isCurrentUser && <div className="size-5 shrink-0" />}
        <div className="size-16 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
          {user.profile_picture_url ? (
            <Image
              src={user.profile_picture_url}
              alt={displayName}
              width={64}
              height={64}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center">
              <UserCircle2 className="size-12 text-slate-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-[#1D2981]">{user.user_type}</span>
            {isCurrentUser && (
              <span className="rounded-md bg-[#1D2981] px-2 py-0.5 text-xs font-medium text-white">
                You
              </span>
            )}
          </div>
          <p className="truncate text-lg font-semibold text-slate-900">{displayName}</p>
          <p className="truncate text-sm text-slate-500">{displayEmail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              <span>Joined {toPhilippineTime(user.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>Last login {getRelativeTime(user.last_login)}</span>
            </div>
          </div>
        </div>

        {!isCurrentUser && (
          <div className="relative shrink-0" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={isRemoving}
              className="shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Actions"
            >
              <MoreVertical className="size-4" />
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(user);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil className="size-4" />
                    Edit Role
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove(user);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 rounded-full bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-16 rounded bg-slate-200" />
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-4 w-48 rounded bg-slate-200" />
        </div>
        <div className="size-8 shrink-0 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

interface ConfirmRemoveModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmRemoveModal({ user, isOpen, onConfirm, onCancel }: ConfirmRemoveModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-2 text-xl font-semibold text-slate-900">Remove {user.user_type}?</h3>
        <p className="mb-6 text-sm text-slate-600">
          Are you sure you want to remove{" "}
          <span className="font-medium text-slate-900">{user.user_name || "this user"}</span> as a{" "}
          {user.user_type}? They will be converted back to a regular User and can be re-added later.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditRoleModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onConfirm: (newRole: PortalUserType) => void;
  onCancel: () => void;
}

function EditRoleModal({ user, isOpen, onConfirm, onCancel }: EditRoleModalProps) {
  if (!isOpen || !user) return null;

  return <EditRoleModalContent user={user} onConfirm={onConfirm} onCancel={onCancel} />;
}

function EditRoleModalContent({
  user,
  onConfirm,
  onCancel,
}: {
  user: UserListItem;
  onConfirm: (newRole: PortalUserType) => void;
  onCancel: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<PortalUserType>(user.user_type);

  const roles: PortalUserType[] = ["User", "Staff", "Admin"];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-2 text-xl font-semibold text-slate-900">Edit Role</h3>
        <p className="mb-4 text-sm text-slate-600">
          Change the role for <span className="font-medium text-slate-900">{user.user_name || "this user"}</span>
        </p>

        <div className="mb-6 space-y-2">
          {roles.map((role) => (
            <label
              key={role}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                selectedRole === role
                  ? "border-[#1D2981] bg-[#1D2981]/5"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={(e) => setSelectedRole(e.target.value as PortalUserType)}
                className="size-4 accent-[#1D2981]"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{role}</p>
                <p className="text-xs text-slate-500">
                  {role === "User" && "Basic access - can view and report items"}
                  {role === "Staff" && "Can manage posts, claims, and reports"}
                  {role === "Admin" && "Full system access and control"}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedRole)}
            className="flex-1 bg-[#1D2981] hover:bg-[#1D2981]/90"
            disabled={selectedRole === user.user_type}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminManagementPage() {
  const { user: currentUser } = useCurrentUser();
  const [admins, setAdmins] = useState<UserListItem[]>([]);
  const [staff, setStaff] = useState<UserListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; user: UserListItem | null }>({
    isOpen: false,
    user: null,
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; tone: "success" | "danger" }>({
    show: false,
    message: "",
    tone: "success",
  });
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBatchRemoving, setIsBatchRemoving] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; user: UserListItem | null }>({
    isOpen: false,
    user: null,
  });
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Pagination state for regular users
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);

  // Filter and sort state
  const [roleFilter, setRoleFilter] = useState<"All" | PortalUserType>("All");
  const [sortBy, setSortBy] = useState<"name" | "email" | "joined" | "lastLogin">("name");

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetchUsers(["Admin", "Staff"]);

      const adminList = response.users.filter((u) => u.user_type === "Admin");
      const staffList = response.users.filter((u) => u.user_type === "Staff");

      // Sort admins - current user first
      const sortedAdmins = adminList.sort((a, b) => {
        if (a.user_id === currentUser?.user_id) return -1;
        if (b.user_id === currentUser?.user_id) return 1;
        return 0;
      });

      setAdmins(sortedAdmins);
      setStaff(staffList);
    } catch (error) {
      console.error("Failed to load users:", error);
      setToast({
        show: true,
        message: "Failed to load users. Please try again.",
        tone: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegularUsers = async (page: number) => {
    try {
      setIsLoadingUsers(true);
      const response = await fetchUsers(["User"]);

      setTotalUsers(response.users.length);

      // Client-side pagination
      const startIndex = (page - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage;
      const paginatedUsers = response.users.slice(startIndex, endIndex);

      setUsers(paginatedUsers);
    } catch (error) {
      console.error("Failed to load regular users:", error);
      setToast({
        show: true,
        message: "Failed to load users. Please try again.",
        tone: "danger",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRegularUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.user_id]);

  useEffect(() => {
    loadRegularUsers(currentPage);
  }, [currentPage]);

  // Debounced search effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        // First, search local state
        const allLocalUsers = [...admins, ...staff, ...users];
        const localMatches = allLocalUsers.filter(
          (user) =>
            user.user_name?.toLowerCase().includes(trimmed.toLowerCase()) ||
            user.email?.toLowerCase().includes(trimmed.toLowerCase())
        );

        if (localMatches.length > 0) {
          // Found matches in local state
          setSearchResults(localMatches);
          setIsSearching(false);
        } else {
          // No local matches, query the database
          const dbResults = await searchUsersAPI(trimmed);
          // Map UserSearchResult to UserListItem format
          const mappedResults: UserListItem[] = dbResults.map((result) => ({
            user_id: result.user_id,
            user_name: result.user_name,
            email: result.email,
            profile_picture_url: result.profile_picture_url,
            user_type: result.user_type,
            created_at: "", // Not available from search
            last_login: null, // Not available from search
          }));
          setSearchResults(mappedResults);
          setIsSearching(false);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, admins, staff, users]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleRemoveClick = (user: UserListItem) => {
    setConfirmModal({ isOpen: true, user });
  };

  const handleConfirmRemove = async () => {
    const userToRemove = confirmModal.user;
    if (!userToRemove || !currentUser) return;

    setConfirmModal({ isOpen: false, user: null });
    setRemovingUserId(userToRemove.user_id);

    try {
      // Update user role to "User"
      await updateUserRole(userToRemove.user_id, "User", userToRemove.user_type);

      // Insert audit log
      await insertAuditLog({
        user_id: currentUser.user_id,
        action: "role_updated",
        table_name: "user_table",
        record_id: userToRemove.user_id,
        changes: {
          message: `${currentUser.user_name || "Admin"} removed ${userToRemove.user_name || "user"} from ${userToRemove.user_type} role`,
          target_user_id: userToRemove.user_id,
          target_user_email: userToRemove.email,
          old_role: userToRemove.user_type,
          new_role: "User",
        },
      });

      // Update local state
      if (userToRemove.user_type === "Admin") {
        setAdmins((prev) => prev.filter((u) => u.user_id !== userToRemove.user_id));
      } else {
        setStaff((prev) => prev.filter((u) => u.user_id !== userToRemove.user_id));
      }

      setToast({
        show: true,
        message: `${userToRemove.user_type} removed successfully`,
        tone: "success",
      });
    } catch (error) {
      console.error("Failed to remove user:", error);
      setToast({
        show: true,
        message: "Failed to remove user. Please try again.",
        tone: "danger",
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleCancelRemove = () => {
    setConfirmModal({ isOpen: false, user: null });
  };

  const handleEditClick = (user: UserListItem) => {
    setEditModal({ isOpen: true, user });
  };

  const handleConfirmEdit = async (newRole: PortalUserType) => {
    const userToEdit = editModal.user;
    if (!userToEdit || !currentUser) return;

    setEditModal({ isOpen: false, user: null });
    setIsUpdatingRole(true);

    try {
      // Update user role
      await updateUserRole(userToEdit.user_id, newRole, userToEdit.user_type);

      // Insert audit log
      await insertAuditLog({
        user_id: currentUser.user_id,
        action: "role_updated",
        table_name: "user_table",
        record_id: userToEdit.user_id,
        changes: {
          message: `${currentUser.user_name || "Admin"} changed ${userToEdit.user_name || "user"}'s role from ${userToEdit.user_type} to ${newRole}`,
          target_user_id: userToEdit.user_id,
          target_user_email: userToEdit.email,
          old_role: userToEdit.user_type,
          new_role: newRole,
        },
      });

      // Update local state
      const updatedUser = { ...userToEdit, user_type: newRole };

      // Remove from old list
      if (userToEdit.user_type === "Admin") {
        setAdmins((prev) => prev.filter((u) => u.user_id !== userToEdit.user_id));
      } else if (userToEdit.user_type === "Staff") {
        setStaff((prev) => prev.filter((u) => u.user_id !== userToEdit.user_id));
      } else if (userToEdit.user_type === "User") {
        // Remove from regular users list if being promoted
        setUsers((prev) => prev.filter((u) => u.user_id !== userToEdit.user_id));
      }

      // Add to new list
      if (newRole === "Admin") {
        setAdmins((prev) => [...prev, updatedUser]);
      } else if (newRole === "Staff") {
        setStaff((prev) => [...prev, updatedUser]);
      } else if (newRole === "User") {
        // If demoted to User, reload the users list to include them
        loadRegularUsers(currentPage);
      }

      setToast({
        show: true,
        message: `Role updated to ${newRole} successfully`,
        tone: "success",
      });
    } catch (error) {
      console.error("Failed to update role:", error);
      setToast({
        show: true,
        message: "Failed to update role. Please try again.",
        tone: "danger",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModal({ isOpen: false, user: null });
  };

  // Batch selection handlers
  const handleToggleSelect = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((filteredList: UserListItem[]) => {
    const selectableUsers = filteredList.filter((u) => u.user_id !== currentUser?.user_id);
    const allSelected = selectableUsers.every((u) => selectedUserIds.has(u.user_id));

    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all from this type
        selectableUsers.forEach((u) => newSet.delete(u.user_id));
      } else {
        // Select all from this type
        selectableUsers.forEach((u) => newSet.add(u.user_id));
      }
      return newSet;
    });
  }, [currentUser?.user_id, selectedUserIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
  }, []);

  const handleBatchRemove = async () => {
    if (!currentUser || selectedUserIds.size === 0) return;

    setShowBatchConfirm(false);
    setIsBatchRemoving(true);

    let successCount = 0;
    let failedCount = 0;
    const selectedUsers = [...admins, ...staff].filter((u) => selectedUserIds.has(u.user_id));

    try {
      for (const user of selectedUsers) {
        try {
          await updateUserRole(user.user_id, "User", user.user_type);

          await insertAuditLog({
            user_id: currentUser.user_id,
            action: "role_updated",
            table_name: "user_table",
            record_id: user.user_id,
            changes: {
              message: `${currentUser.user_name || "Admin"} removed ${user.user_name || "user"} from ${user.user_type} role (batch operation)`,
              target_user_id: user.user_id,
              target_user_email: user.email,
              old_role: user.user_type,
              new_role: "User",
            },
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to remove ${user.user_name}:`, error);
          failedCount++;
        }
      }

      // Update local state
      setAdmins((prev) => prev.filter((u) => !selectedUserIds.has(u.user_id)));
      setStaff((prev) => prev.filter((u) => !selectedUserIds.has(u.user_id)));
      setSelectedUserIds(new Set());

      if (successCount > 0 && failedCount === 0) {
        setToast({
          show: true,
          message: `Successfully removed ${successCount} user${successCount !== 1 ? "s" : ""}`,
          tone: "success",
        });
      } else if (successCount > 0 && failedCount > 0) {
        setToast({
          show: true,
          message: `Removed ${successCount}, failed ${failedCount}`,
          tone: "success",
        });
      } else {
        setToast({
          show: true,
          message: "Failed to remove users. Please try again.",
          tone: "danger",
        });
      }
    } catch (error) {
      console.error("Batch remove error:", error);
      setToast({
        show: true,
        message: "An error occurred. Please try again.",
        tone: "danger",
      });
    } finally {
      setIsBatchRemoving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle search result click - scroll to and highlight user
  const handleSearchResultClick = (userId: string) => {
    setHighlightedUserId(userId);
    setSearchQuery("");
    setSearchResults([]);

    // Scroll to the user card
    const userCard = document.getElementById(`user-card-${userId}`);
    if (userCard) {
      userCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Remove highlight after 3 seconds
    setTimeout(() => {
      setHighlightedUserId(null);
    }, 3000);
  };

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const allUsers = [...admins, ...staff, ...users];
    if (allUsers.length === 0) {
      setToast({
        show: true,
        message: "No users to export",
        tone: "danger",
      });
      return;
    }

    // CSV headers
    const headers = ["Name", "Email", "Role", "User ID", "Date Joined", "Last Login"];
    const rows = allUsers.map((u) => [
      u.user_name || "Unknown",
      u.email || "No email",
      u.user_type,
      u.user_id,
      toPhilippineTime(u.created_at),
      u.last_login ? toPhilippineTime(u.last_login) : "Never",
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape cells that contain commas or quotes
            const escaped = String(cell).replace(/"/g, '""');
            return escaped.includes(",") || escaped.includes('"') ? `"${escaped}"` : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-management-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      show: true,
      message: `Exported ${allUsers.length} user${allUsers.length !== 1 ? "s" : ""}`,
      tone: "success",
    });
  }, [admins, staff, users]);

  const selectedCount = selectedUserIds.size;
  const hasSelection = selectedCount > 0;
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  // Apply sorting
  const sortUsers = (userList: UserListItem[]) => {
    return [...userList].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.user_name || "").localeCompare(b.user_name || "");
        case "email":
          return (a.email || "").localeCompare(b.email || "");
        case "joined": {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }
        case "lastLogin": {
          const dateA = a.last_login ? new Date(a.last_login).getTime() : 0;
          const dateB = b.last_login ? new Date(b.last_login).getTime() : 0;
          return dateB - dateA;
        }
        default:
          return 0;
      }
    });
  };

  const sortedAdmins = sortUsers(admins);
  const sortedStaff = sortUsers(staff);
  const sortedUsers = sortUsers(users);

  return (
    <div className="h-full space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-[#1D2981]">User Management</h1>
      </div>

      {/* 2-Column Layout */}
      <div className="grid h-[calc(100%-5rem)] min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column - User Lists */}
        <div className="space-y-4 overflow-y-auto pr-1 lg:col-span-8">

          {/* Batch Action Bar */}
          {hasSelection && (
            <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-5 text-[#1D2981]" />
                    <span className="font-medium text-slate-900">
                      {selectedCount} user{selectedCount !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                    Clear
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBatchConfirm(true)}
                    disabled={isBatchRemoving}
                  >
                    {isBatchRemoving ? (
                      <>
                        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 size-4" />
                        Remove Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Admin List */}
          {(roleFilter === "All" || roleFilter === "Admin") && (
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1D2981]/10">
                <ShieldCheck className="size-5 text-[#1D2981]" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">Administrators</CardTitle>
                <p className="text-sm text-slate-500">
                  {isLoading ? "Loading..." : `${sortedAdmins.length} admin${sortedAdmins.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            {sortedAdmins.length > 0 && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAll(sortedAdmins)}
                className="text-sm text-slate-600 hover:text-[#1D2981]"
              >
                {sortedAdmins.filter((a) => a.user_id !== currentUser?.user_id && selectedUserIds.has(a.user_id)).length ===
                sortedAdmins.filter((a) => a.user_id !== currentUser?.user_id).length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <UserCardSkeleton />
              <UserCardSkeleton />
            </div>
          ) : sortedAdmins.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12">
              <div className="text-center">
                <ShieldCheck className="mx-auto mb-3 size-12 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No administrators found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAdmins.map((admin) => (
                <UserCard
                  key={admin.user_id}
                  user={admin}
                  isCurrentUser={admin.user_id === currentUser?.user_id}
                  onRemove={handleRemoveClick}
                  onEdit={handleEditClick}
                  isRemoving={removingUserId === admin.user_id || isUpdatingRole}
                  showCheckbox
                  isSelected={selectedUserIds.has(admin.user_id)}
                  onToggleSelect={handleToggleSelect}
                  isHighlighted={highlightedUserId === admin.user_id}
                />
              ))}
            </div>
          )}
        </CardContent>
          </Card>
          )}

          {/* Staff List */}
          {(roleFilter === "All" || roleFilter === "Staff") && (
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10">
                <Users className="size-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">Staff Members</CardTitle>
                <p className="text-sm text-slate-500">
                  {isLoading ? "Loading..." : `${sortedStaff.length} staff member${sortedStaff.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            {sortedStaff.length > 0 && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAll(sortedStaff)}
                className="text-sm text-slate-600 hover:text-[#1D2981]"
              >
                {sortedStaff.filter((s) => selectedUserIds.has(s.user_id)).length === sortedStaff.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </div>
          ) : sortedStaff.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12">
              <div className="text-center">
                <Users className="mx-auto mb-3 size-12 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No staff members found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStaff.map((staffMember) => (
                <UserCard
                  key={staffMember.user_id}
                  user={staffMember}
                  isCurrentUser={staffMember.user_id === currentUser?.user_id}
                  onRemove={handleRemoveClick}
                  onEdit={handleEditClick}
                  isRemoving={removingUserId === staffMember.user_id || isUpdatingRole}
                  showCheckbox
                  isSelected={selectedUserIds.has(staffMember.user_id)}
                  onToggleSelect={handleToggleSelect}
                  isHighlighted={highlightedUserId === staffMember.user_id}
                />
              ))}
            </div>
          )}
        </CardContent>
          </Card>
          )}

          {/* Regular Users List (Paginated) */}
          {(roleFilter === "All" || roleFilter === "User") && (
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-500/10">
                <UserCircle2 className="size-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">Regular Users</CardTitle>
                <p className="text-sm text-slate-500">
                  {isLoadingUsers ? "Loading..." : `${totalUsers} total user${totalUsers !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            {sortedUsers.length > 0 && !isLoadingUsers && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const selectableUsers = sortedUsers.filter((u) => !selectedUserIds.has(u.user_id));
                  if (selectableUsers.length === 0) {
                    // Deselect all on current page
                    setSelectedUserIds((prev) => {
                      const newSet = new Set(prev);
                      sortedUsers.forEach((u) => newSet.delete(u.user_id));
                      return newSet;
                    });
                  } else {
                    // Select all on current page
                    setSelectedUserIds((prev) => {
                      const newSet = new Set(prev);
                      sortedUsers.forEach((u) => newSet.add(u.user_id));
                      return newSet;
                    });
                  }
                }}
                className="text-sm text-slate-600 hover:text-[#1D2981]"
              >
                {sortedUsers.every((u) => selectedUserIds.has(u.user_id)) ? "Deselect Page" : "Select Page"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-3">
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12">
              <div className="text-center">
                <UserCircle2 className="mx-auto mb-3 size-12 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No users found</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sortedUsers.map((user) => (
                  <UserCard
                    key={user.user_id}
                    user={user}
                    isCurrentUser={false}
                    onRemove={handleRemoveClick}
                    onEdit={handleEditClick}
                    isRemoving={removingUserId === user.user_id || isUpdatingRole}
                    showCheckbox
                    isSelected={selectedUserIds.has(user.user_id)}
                    onToggleSelect={handleToggleSelect}
                    isHighlighted={highlightedUserId === user.user_id}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages} • Showing {sortedUsers.length} of {totalUsers}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoadingUsers}
                    >
                      <ChevronLeft className="mr-1 size-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoadingUsers}
                    >
                      Next
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
          </Card>
          )}
        </div>

        {/* Right Column - Search, Filters, Sort */}
        <div className="space-y-4 overflow-y-auto pr-1 lg:col-span-4">
          {/* Export Button */}
          <Button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="w-full bg-[#1D2981] hover:bg-[#1D2981]/90"
          >
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>

          {/* Search Bar */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Search Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="size-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-[#1D2981] focus:outline-none focus:ring-2 focus:ring-[#1D2981]/20"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="size-5 animate-spin rounded-full border-2 border-[#1D2981] border-t-transparent" />
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-96 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                  <p className="px-2 text-xs font-medium text-slate-500">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                  </p>
                  {searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      type="button"
                      onClick={() => handleSearchResultClick(user.user_id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-slate-50 p-2 text-left transition hover:border-[#1D2981] hover:bg-[#1D2981]/5"
                    >
                      <div className="size-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                        {user.profile_picture_url ? (
                          <Image
                            src={user.profile_picture_url}
                            alt={user.user_name || "User"}
                            width={40}
                            height={40}
                            unoptimized
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center">
                            <UserCircle2 className="size-8 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {user.user_name || "Unknown"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        <p className="mt-0.5 text-xs font-medium text-[#1D2981]">{user.user_type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.trim().length > 0 && !isSearching && searchResults.length === 0 && (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Filter className="size-4" />
                Filter by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(["All", "Admin", "Staff", "User"] as const).map((role) => (
                  <label
                    key={role}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      roleFilter === role
                        ? "border-[#1D2981] bg-[#1D2981]/5"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleFilter"
                      value={role}
                      checked={roleFilter === role}
                      onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                      className="size-4 accent-[#1D2981]"
                    />
                    <span className="text-sm font-medium text-slate-900">{role}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sort */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <ArrowUpDown className="size-4" />
                Sort by
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { value: "name" as const, label: "Name" },
                  { value: "email" as const, label: "Email" },
                  { value: "joined" as const, label: "Date Joined" },
                  { value: "lastLogin" as const, label: "Last Login" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      sortBy === option.value
                        ? "border-[#1D2981] bg-[#1D2981]/5"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sortBy"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="size-4 accent-[#1D2981]"
                    />
                    <span className="text-sm font-medium text-slate-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Remove Modal */}
      <ConfirmRemoveModal
        user={confirmModal.user}
        isOpen={confirmModal.isOpen}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />

      {/* Edit Role Modal */}
      {editModal.user && (
        <EditRoleModal
          key={editModal.user.user_id}
          user={editModal.user}
          isOpen={editModal.isOpen}
          onConfirm={handleConfirmEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Batch Remove Confirmation Modal */}
      {showBatchConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Remove {selectedCount} users?</h3>
            <p className="mb-6 text-sm text-slate-600">
              Are you sure you want to remove {selectedCount} user{selectedCount !== 1 ? "s" : ""} from their
              Admin/Staff roles? They will be converted back to regular Users and can be re-added later.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBatchConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBatchRemove} className="flex-1">
                Remove All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast.show && <CustomToast mode="floating" message={toast.message} tone={toast.tone} />}
    </div>
  );
}
