"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CircleUserRound, Clock, Mail, Phone, Search, User, X } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { api } from "@/lib/api";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import { getPostFull } from "@/services/posts-service";
import { CustomToast } from "@/components/ui/custom-toast";
import type { ApiPostRecordDetails } from "@/types/post-record-api";

interface SelectedUser {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url?: string | null;
}

interface UserSearchResult {
  out_user_id: string;
  out_user_name: string;
  out_email: string;
  out_profile_picture_url?: string | null;
}

interface ClaimFormData {
  contactNumber: string;
  lostItemId: string;
  claimedAt: string;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">{children}</div>;
}

function normalizePhoneNumber(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, "");

  // +63XXXXXXXXXX (13 digits total) -> 0XXXXXXXXXX (11 digits)
  if (/^63\d{10}$/.test(digits)) {
    return "0" + digits.slice(2);
  }

  // 9XXXXXXXXX (10 digits) -> 0XXXXXXXXXX (11 digits)
  if (/^9\d{9}$/.test(digits)) {
    return "0" + digits;
  }

  // 0XXXXXXXXXX (11 digits) - already valid
  if (/^0\d{10}$/.test(digits)) {
    return digits;
  }

  return null;
}

function formatPhoneNumber(local: string): string {
  // Format as 0912 345 6789
  if (local.length === 11) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return local;
}

export function StaffClaimPostView({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<ApiPostRecordDetails | null>(null);
  const [lostItemPost, setLostItemPost] = useState<ApiPostRecordDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  // Manual input state
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  // Form state
  const [formData, setFormData] = useState<ClaimFormData>({
    contactNumber: "",
    lostItemId: "",
    claimedAt: new Date().toISOString().slice(0, 16), // Default to now in local time
  });

  // Lost item loading
  const [isLoadingLostItem, setIsLoadingLostItem] = useState(false);
  const [lostItemError, setLostItemError] = useState<string | null>(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const hasUnsavedChanges = useMemo(
    () => selectedUser !== null || formData.contactNumber !== "" || formData.lostItemId !== "",
    [selectedUser, formData.contactNumber, formData.lostItemId]
  );

  const showToast = useCallback((message: string, tone: "success" | "danger") => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPost = await getPostFull(postId);

      if (fetchedPost.item_type !== "found") {
        showToast("Only found items can be claimed", "danger");
        setPost(null);
        return;
      }

      setPost(fetchedPost);
    } catch (error) {
      showToast("Failed to load post", "danger");
      setPost(null);
    } finally {
      setIsLoading(false);
    }
  }, [postId, showToast]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get<{ results: UserSearchResult[] }>("/users/search", {
          params: { query: searchQuery },
        });
        setSearchResults(data.results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load lost item when ID changes
  useEffect(() => {
    if (!formData.lostItemId.trim()) {
      setLostItemPost(null);
      setLostItemError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingLostItem(true);
      setLostItemError(null);
      try {
        const { data } = await api.get<{ posts: ApiPostRecordDetails[] }>("/posts/public", {
          params: { item_id: formData.lostItemId },
        });

        if (!data.posts || data.posts.length === 0) {
          setLostItemError("Lost item not found with this ID");
          setLostItemPost(null);
          return;
        }

        const lostPost = data.posts[0];
        if (lostPost.item_type !== "missing") {
          setLostItemError("Item ID must be a missing/lost item post");
          setLostItemPost(null);
          return;
        }

        setLostItemPost(lostPost);
      } catch {
        setLostItemError("Failed to fetch lost item");
        setLostItemPost(null);
      } finally {
        setIsLoadingLostItem(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.lostItemId]);

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser({
      user_id: user.out_user_id,
      user_name: user.out_user_name,
      email: user.out_email,
      profile_picture_url: user.out_profile_picture_url,
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowManualInput(false);
  };

  const handleManualSubmit = () => {
    const emailPattern = /^[a-zA-Z0-9._-]+@umak\.edu\.ph$/;

    if (!manualEmail.trim() || !emailPattern.test(manualEmail)) {
      showToast("Please enter a valid UMak email (e.g., user@umak.edu.ph)", "danger");
      return;
    }

    if (!manualName.trim()) {
      showToast("Please enter the user's name", "danger");
      return;
    }

    setSelectedUser({
      user_id: `manual-${Date.now()}`,
      user_name: manualName.trim(),
      email: manualEmail.trim(),
      profile_picture_url: null,
    });

    setManualName("");
    setManualEmail("");
    setShowManualInput(false);
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);

    if (!post || !selectedUser) {
      showToast("Missing required information", "danger");
      return;
    }

    const normalized = normalizePhoneNumber(formData.contactNumber);
    if (!normalized) {
      showToast(
        "Please enter a valid Philippine mobile number (e.g., 09123456789, +639123456789)",
        "danger"
      );
      return;
    }

    if (formData.lostItemId.trim() && !lostItemPost) {
      showToast("Referenced lost item not found. Please verify the Item ID.", "danger");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user from token storage
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Authentication required", "danger");
        return;
      }

      // Decode JWT to get user info (simple base64 decode of payload)
      const payload = JSON.parse(atob(token.split(".")[1]));

      await api.post("/claims/process", {
        found_post_id: Number(postId),
        missing_post_id: lostItemPost ? Number(lostItemPost.post_id) : null,
        claim_details: {
          claimer_name: selectedUser.user_name,
          claimer_school_email: selectedUser.email,
          claimer_contact_num: formatPhoneNumber(normalized),
          poster_name: post.is_anonymous ? "Anonymous" : post.poster_name,
          staff_id: payload.user_id,
          staff_name: payload.user_name,
        },
      });

      showToast("Item claimed successfully", "success");

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push("/staff/post-records");
      }, 1500);
    } catch (err) {
      console.error("Claim submission error:", err);
      let errorMessage = "Failed to claim item. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const response = err.response as { data?: { message?: string } };
        if (response.data?.message) {
          errorMessage = response.data.message;
        }
      }
      showToast(errorMessage, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true);
    } else {
      router.push("/staff/post-records");
    }
  };

  if (isLoading) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Post not found or cannot be claimed</h1>
          <button
            type="button"
            onClick={() => router.push("/staff/post-records")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]"
          >
            <ArrowLeft className="size-4" /> Go back
          </button>
        </div>
      </section>
    );
  }

  const isFormValid =
    selectedUser !== null &&
    formData.contactNumber.trim() !== "" &&
    normalizePhoneNumber(formData.contactNumber) !== null &&
    (!formData.lostItemId.trim() || lostItemPost !== null);

  return (
    <PhotoProvider>
      <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden pr-1">
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" /> Back to Post Records
            </button>
            <button
              type="button"
              disabled={!isFormValid || isSubmitting}
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
            >
              <Check className="size-4" /> {isSubmitting ? "Claiming..." : "Claim Item"}
            </button>
          </div>
        </article>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
          {/* Main Content - Found Item */}
          <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-7">
            <h2 className="mb-3 text-lg font-semibold text-[#1D2981]">Item to be Claimed</h2>

            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
                {post.poster_profile_picture_url ? (
                  <Image
                    src={post.poster_profile_picture_url}
                    alt={post.poster_name}
                    width={40}
                    height={40}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <CircleUserRound className="size-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {post.is_anonymous ? "Anonymous" : post.poster_name}
                </p>
                <p className="text-xs text-slate-500">
                  Found {formatDateTimeInPhilippineTime(post.submitted_on_date_local, "Unknown")}
                </p>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{post.item_name}</h1>
            <p className="mt-2 text-sm text-slate-600">{post.item_description ?? "No description provided."}</p>

            {post.item_image_url ? (
              <PhotoView src={post.item_image_url}>
                <div className="relative mt-4 h-64 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 md:h-80">
                  <Image
                    src={post.item_image_url}
                    alt={post.item_name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              </PhotoView>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-700">Category:</span> {post.category ?? "N/A"}
              </p>
              <p>
                <span className="font-medium text-slate-700">Last seen location:</span>{" "}
                {post.last_seen_location ?? "N/A"}
              </p>
              <p>
                <span className="font-medium text-slate-700">Last seen at:</span>{" "}
                {formatDateTimeInPhilippineTime(post.last_seen_at, "N/A")}
              </p>
            </div>

            {/* Lost Item Preview */}
            {lostItemPost ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="mb-3 text-sm font-semibold text-emerald-800">Linked Lost Item</p>
                <div className="flex gap-4">
                  {lostItemPost.item_image_url ? (
                    <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-emerald-200">
                      <Image
                        src={lostItemPost.item_image_url}
                        alt={lostItemPost.item_name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-slate-900">{lostItemPost.item_name}</p>
                    <p className="mt-1 text-slate-600">{lostItemPost.item_description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Posted by {lostItemPost.is_anonymous ? "Anonymous" : lostItemPost.poster_name}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </article>

          {/* Sidebar - Claim Form */}
          <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-5">
            {/* Claimer Search */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#1D2981]">
                  Claimer Email <span className="text-rose-600">*</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="rounded-full border border-[#1D2981] bg-white px-3 py-1.5 text-xs font-medium text-[#1D2981] transition-colors hover:bg-[#1D2981] hover:text-white"
                >
                  {showManualInput ? "Switch to Search" : "Manual Input"}
                </button>
              </div>

              {!showManualInput ? (
                <>
                  {selectedUser ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                            {selectedUser.profile_picture_url ? (
                              <Image
                                src={selectedUser.profile_picture_url}
                                alt={selectedUser.user_name}
                                width={40}
                                height={40}
                                unoptimized
                                className="size-full object-cover"
                              />
                            ) : (
                              <User className="size-5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{selectedUser.user_name}</p>
                            <p className="text-xs text-slate-500">{selectedUser.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="rounded-full p-1 hover:bg-slate-200"
                        >
                          <X className="size-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
                      />

                      {searchResults.length > 0 ? (
                        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                          {searchResults.map((user) => (
                            <button
                              key={user.out_user_id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 last:border-b-0"
                            >
                              <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                                {user.out_profile_picture_url ? (
                                  <Image
                                    src={user.out_profile_picture_url}
                                    alt={user.out_user_name}
                                    width={32}
                                    height={32}
                                    unoptimized
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <User className="size-4 text-slate-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{user.out_user_name}</p>
                                <p className="text-xs text-slate-500">{user.out_email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {isSearching ? (
                        <div className="mt-2 text-center text-xs text-slate-500">Searching...</div>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Full Name</label>
                    <input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">UMak Email</label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="user@umak.edu.ph"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={!manualName.trim() || !manualEmail.trim()}
                    className="w-full rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
                  >
                    Add Claimer
                  </button>
                </div>
              )}
            </div>

            {/* Contact Number */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]">
                <Phone className="size-4" />
                Contact Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="0912 345 6789"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
              />
              <p className="mt-1 text-xs text-slate-500">Philippine mobile number</p>
            </div>

            {/* Claimed At */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]">
                <Clock className="size-4" />
                Claimed At <span className="text-rose-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.claimedAt}
                onChange={(e) => setFormData({ ...formData, claimedAt: e.target.value })}
                max={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
              />
            </div>

            {/* Lost Item ID (Optional) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]">
                <Mail className="size-4" />
                Lost Item ID (Optional)
              </label>
              <input
                type="text"
                value={formData.lostItemId}
                onChange={(e) => setFormData({ ...formData, lostItemId: e.target.value })}
                placeholder="Enter Item ID if linking to lost post"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
              />
              {isLoadingLostItem ? (
                <p className="mt-2 text-xs text-slate-500">Loading lost item...</p>
              ) : null}
              {lostItemError ? (
                <p className="mt-2 text-xs text-rose-600">{lostItemError}</p>
              ) : null}
            </div>
          </aside>
        </div>

        {/* Confirm Modal */}
        {showConfirmModal ? (
          <Overlay>
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-900">Confirm Claim</h2>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to claim this item for {selectedUser?.user_name}?
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit()}
                  className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
                >
                  {isSubmitting ? "Claiming..." : "Confirm"}
                </button>
              </div>
            </div>
          </Overlay>
        ) : null}

        {/* Cancel Modal */}
        {showCancelModal ? (
          <Overlay>
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-900">Discard Changes?</h2>
              <p className="mt-2 text-sm text-slate-600">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/staff/post-records")}
                  className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                  Discard
                </button>
              </div>
            </div>
          </Overlay>
        ) : null}

        {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}
      </section>
    </PhotoProvider>
  );
}
