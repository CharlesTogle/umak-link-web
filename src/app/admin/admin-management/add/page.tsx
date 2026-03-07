"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomToast } from "@/components/ui/custom-toast";
import { UserCircle2, X, UserPlus, Search, ArrowLeft } from "lucide-react";
import { searchUsers, updateUserRole } from "@/services/admin-service";
import { insertAuditLog } from "@/services/audit-logs-service";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { UserSearchResult } from "@/services/admin-service";
import type { PortalUserType } from "@/types/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

function SelectedUserCard({
  user,
  role,
  onRemove,
}: {
  user: SelectedUser;
  role: PortalUserType;
  onRemove: () => void;
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="size-14 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={56}
              height={56}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center">
              <UserCircle2 className="size-10 text-slate-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <span className="text-xs font-medium text-emerald-700">Will become {role}</span>
          </div>
          <p className="truncate text-base font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={`Remove ${user.name}`}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SearchResultItem({
  user,
  onSelect,
  isSelected,
}: {
  user: UserSearchResult;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isSelected}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-[#1D2981] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="size-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
        {user.profile_picture_url ? (
          <Image
            src={user.profile_picture_url}
            alt={user.user_name}
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
        <p className="truncate font-medium text-slate-900">{user.user_name}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>

      {isSelected && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          Selected
        </span>
      )}
    </button>
  );
}

function ConfirmSubmitModal({
  isOpen,
  selectedCount,
  role,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  selectedCount: number;
  role: PortalUserType;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-2 text-xl font-semibold text-slate-900">Confirm role assignment</h3>
        <p className="mb-6 text-sm text-slate-600">
          Are you sure you want to promote {selectedCount} user{selectedCount !== 1 ? "s" : ""} to {role}? This
          action will grant them elevated permissions.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AddAdminStaffPage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<"Staff" | "Admin">("Staff");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; tone: "success" | "danger" }>({
    show: false,
    message: "",
    tone: "success",
  });

  // Debounced search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(trimmed);
        // Filter out non-User types (only show regular users)
        const regularUsers = results.filter((u) => u.user_type === "User");
        setSearchResults(regularUsers);
      } catch (error) {
        console.error("Search failed:", error);
        setToast({
          show: true,
          message: "Search failed. Please try again.",
          tone: "danger",
        });
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleSelectUser = useCallback(
    (user: UserSearchResult) => {
      const isAlreadySelected = selectedUsers.some((u) => u.id === user.user_id);
      if (isAlreadySelected) {
        setToast({
          show: true,
          message: "User already selected",
          tone: "danger",
        });
        return;
      }

      setSelectedUsers((prev) => [
        ...prev,
        {
          id: user.user_id,
          name: user.user_name,
          email: user.email,
          image: user.profile_picture_url,
        },
      ]);
      setSearchQuery("");
      setSearchResults([]);
    },
    [selectedUsers]
  );

  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  const handleSubmit = async () => {
    if (!currentUser || selectedUsers.length === 0) return;

    setShowConfirmModal(false);
    setIsSubmitting(true);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (const user of selectedUsers) {
        try {
          await updateUserRole(user.id, selectedRole, "User");

          await insertAuditLog({
            user_id: currentUser.user_id,
            action: "role_updated",
            table_name: "user_table",
            record_id: user.id,
            changes: {
              message: `${currentUser.user_name || "Admin"} promoted ${user.name} to ${selectedRole}`,
              target_user_id: user.id,
              target_user_email: user.email,
              old_role: "User",
              new_role: selectedRole,
            },
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to promote ${user.name}:`, error);
          failedCount++;
        }
      }

      if (successCount > 0 && failedCount === 0) {
        setToast({
          show: true,
          message: `Successfully promoted ${successCount} user${successCount !== 1 ? "s" : ""}`,
          tone: "success",
        });
        setTimeout(() => {
          router.push("/admin/admin-management");
        }, 1500);
      } else if (successCount > 0 && failedCount > 0) {
        setToast({
          show: true,
          message: `Promoted ${successCount}, failed ${failedCount}`,
          tone: "success",
        });
        setSelectedUsers([]);
      } else {
        setToast({
          show: true,
          message: "Failed to promote users. Please try again.",
          tone: "danger",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      setToast({
        show: true,
        message: "An error occurred. Please try again.",
        tone: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#1D2981]">Add Admin or Staff</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search for users and promote them to Staff or Admin roles
          </p>
        </div>
      </div>

      {/* Role Selection */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Select Role to Assign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#1D2981] hover:bg-slate-100 has-[:checked]:border-[#1D2981] has-[:checked]:bg-[#1D2981]/5">
              <input
                type="radio"
                name="role"
                value="Staff"
                checked={selectedRole === "Staff"}
                onChange={(e) => setSelectedRole(e.target.value as "Staff" | "Admin")}
                className="size-4 accent-[#1D2981]"
              />
              <div>
                <p className="font-medium text-slate-900">Staff</p>
                <p className="text-xs text-slate-500">Can manage posts and reports</p>
              </div>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#1D2981] hover:bg-slate-100 has-[:checked]:border-[#1D2981] has-[:checked]:bg-[#1D2981]/5">
              <input
                type="radio"
                name="role"
                value="Admin"
                checked={selectedRole === "Admin"}
                onChange={(e) => setSelectedRole(e.target.value as "Staff" | "Admin")}
                className="size-4 accent-[#1D2981]"
              />
              <div>
                <p className="font-medium text-slate-900">Admin</p>
                <p className="text-xs text-slate-500">Full system access and control</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
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

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Found {searchResults.length} user{searchResults.length !== 1 ? "s" : ""}
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {searchResults.map((user) => (
                  <SearchResultItem
                    key={user.user_id}
                    user={user}
                    onSelect={() => handleSelectUser(user)}
                    isSelected={selectedUsers.some((u) => u.id === user.user_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-500">No users found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Selected Users ({selectedUsers.length})
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Will be promoted to {selectedRole} role
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClearAll} disabled={isSubmitting}>
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSubmitting}
                  className="bg-[#1D2981] hover:bg-[#1D2981]/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Promoting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 size-4" />
                      Promote {selectedUsers.length}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedUsers.map((user) => (
                <SelectedUserCard
                  key={user.id}
                  user={user}
                  role={selectedRole}
                  onRemove={() => handleRemoveUser(user.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Modal */}
      <ConfirmSubmitModal
        isOpen={showConfirmModal}
        selectedCount={selectedUsers.length}
        role={selectedRole}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Toast */}
      {toast.show && <CustomToast mode="floating" message={toast.message} tone={toast.tone} />}
    </div>
  );
}
