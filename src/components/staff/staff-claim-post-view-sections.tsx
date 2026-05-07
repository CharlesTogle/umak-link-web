"use client";

import Image from "next/image";
import { ArrowLeft, Check, CircleUserRound, Clock, Mail, Phone, Search, User, X } from "lucide-react";
import { PhotoView } from "react-photo-view";
import { Overlay } from "@/components/ui/overlay";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";

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

export function ClaimToolbar(props: {
  isFormValid: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={props.onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" /> Back to Post Records
        </button>
        <button
          type="button"
          disabled={!props.isFormValid || props.isSubmitting}
          onClick={props.onSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
        >
          <Check className="size-4" /> {props.isSubmitting ? "Claiming..." : "Claim Item"}
        </button>
      </div>
    </article>
  );
}

export function FoundItemPanel(props: { post: any; lostItemPost: any | null }) {
  const { post, lostItemPost } = props;
  return (
    <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-7">
      <h2 className="mb-3 text-lg font-semibold text-[#1D2981]">Item to be Claimed</h2>
      <p className="mb-3 text-sm text-slate-600">Review the found item details before processing the claim.</p>

      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
          {post.poster_profile_picture_url ? (
            <Image src={post.poster_profile_picture_url} alt={post.poster_name} width={40} height={40} unoptimized className="size-full object-cover" />
          ) : (
            <CircleUserRound className="size-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{post.is_anonymous ? "Anonymous" : post.poster_name}</p>
          <p className="text-xs text-slate-500">Found {formatDateTimeInPhilippineTime(post.submitted_on_date_local, "Unknown")}</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{post.item_name}</h1>
      <p className="mt-2 text-sm text-slate-600">{post.item_description ?? "No description provided."}</p>

      {post.item_image_url ? (
        <PhotoView src={post.item_image_url}>
          <div className="relative mt-4 h-64 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 md:h-80">
            <Image src={post.item_image_url} alt={post.item_name} fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
          </div>
        </PhotoView>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600">
        <p><span className="font-medium text-slate-700">Category:</span> {post.category ?? "N/A"}</p>
        <p><span className="font-medium text-slate-700">Last seen location:</span> {post.last_seen_location ?? "N/A"}</p>
        <p><span className="font-medium text-slate-700">Last seen at:</span> {formatDateTimeInPhilippineTime(post.last_seen_at, "N/A")}</p>
      </div>

      {lostItemPost ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-3 text-sm font-semibold text-emerald-800">Linked Lost Item</p>
          <div className="flex gap-4">
            {lostItemPost.item_image_url ? (
              <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-emerald-200">
                <Image src={lostItemPost.item_image_url} alt={lostItemPost.item_name} fill unoptimized className="object-cover" />
              </div>
            ) : null}
            <div className="flex-1 text-sm">
              <p className="font-semibold text-slate-900">{lostItemPost.item_name}</p>
              <p className="mt-1 text-slate-600">{lostItemPost.item_description}</p>
              <p className="mt-2 text-xs text-slate-500">Posted by {lostItemPost.is_anonymous ? "Anonymous" : lostItemPost.poster_name}</p>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ClaimSidebar(props: {
  selectedUser: SelectedUser | null;
  searchQuery: string;
  searchResults: UserSearchResult[];
  isSearching: boolean;
  showManualInput: boolean;
  manualName: string;
  manualEmail: string;
  formData: ClaimFormData;
  isLoadingLostItem: boolean;
  lostItemError: string | null;
  onToggleManualInput: () => void;
  onSearchQueryChange: (value: string) => void;
  onUserSelect: (user: UserSearchResult) => void;
  onClearUser: () => void;
  onManualNameChange: (value: string) => void;
  onManualEmailChange: (value: string) => void;
  onSubmitManual: () => void;
  onFieldChange: (key: keyof ClaimFormData, value: string) => void;
}) {
  return (
    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1D2981]">Claimer Email <span className="text-rose-600">*</span></p>
          <button type="button" onClick={props.onToggleManualInput} className="rounded-full border border-[#1D2981] bg-white px-3 py-1.5 text-xs font-medium text-[#1D2981] transition-colors hover:bg-[#1D2981] hover:text-white">
            {props.showManualInput ? "Switch to Search" : "Manual Input"}
          </button>
        </div>

        {!props.showManualInput ? (
          props.selectedUser ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                    {props.selectedUser.profile_picture_url ? (
                      <Image src={props.selectedUser.profile_picture_url} alt={props.selectedUser.user_name} width={40} height={40} unoptimized className="size-full object-cover" />
                    ) : (
                      <User className="size-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{props.selectedUser.user_name}</p>
                    <p className="text-xs text-slate-500">{props.selectedUser.email}</p>
                  </div>
                </div>
                <button type="button" onClick={props.onClearUser} className="rounded-full p-1 hover:bg-slate-200">
                  <X className="size-4 text-slate-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="claimer-search" className="sr-only">Search by name or email</label>
              <input id="claimer-search" value={props.searchQuery} onChange={(event) => props.onSearchQueryChange(event.target.value)} placeholder="Search by name or email..." className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30" />
              {props.searchResults.length > 0 ? (
                <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {props.searchResults.map((user) => (
                    <button key={user.out_user_id} type="button" onClick={() => props.onUserSelect(user)} className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 last:border-b-0">
                      <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                        {user.out_profile_picture_url ? (
                          <Image src={user.out_profile_picture_url} alt={user.out_user_name} width={32} height={32} unoptimized className="size-full object-cover" />
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
              {props.isSearching ? <div className="mt-2 text-center text-xs text-slate-500">Searching...</div> : null}
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Full Name</label>
              <input value={props.manualName} onChange={(event) => props.onManualNameChange(event.target.value)} placeholder="Enter full name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">UMak Email</label>
              <input type="email" value={props.manualEmail} onChange={(event) => props.onManualEmailChange(event.target.value)} placeholder="user@umak.edu.ph" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30" />
            </div>
            <button type="button" onClick={props.onSubmitManual} disabled={!props.manualName.trim() || !props.manualEmail.trim()} className="w-full rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60">
              Add Claimer
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]"><Phone className="size-4" />Contact Number <span className="text-rose-600">*</span></label>
        <input type="tel" value={props.formData.contactNumber} onChange={(event) => props.onFieldChange("contactNumber", event.target.value)} placeholder="0912 345 6789" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30" />
        <p className="mt-1 text-xs text-slate-500">Philippine mobile number</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]"><Clock className="size-4" />Claimed At <span className="text-rose-600">*</span></label>
        <input type="datetime-local" value={props.formData.claimedAt} onChange={(event) => props.onFieldChange("claimedAt", event.target.value)} max={new Date().toISOString().slice(0, 16)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]"><Mail className="size-4" />Lost Item ID (Optional)</label>
        <input type="text" value={props.formData.lostItemId} onChange={(event) => props.onFieldChange("lostItemId", event.target.value)} placeholder="Enter Item ID if linking to lost post" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30" />
        {props.isLoadingLostItem ? <p className="mt-2 text-xs text-slate-500">Loading lost item...</p> : null}
        {props.lostItemError ? <p className="mt-2 text-xs text-rose-600">{props.lostItemError}</p> : null}
      </div>
    </aside>
  );
}

export function ClaimModals(props: {
  showConfirmModal: boolean;
  showCancelModal: boolean;
  selectedUserName: string | undefined;
  isSubmitting: boolean;
  onCloseConfirm: () => void;
  onConfirm: () => void;
  onCloseCancel: () => void;
  onDiscard: () => void;
}) {
  return (
    <>
      {props.showConfirmModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Confirm Claim</h2>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to claim this item for {props.selectedUserName}?</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={props.onCloseConfirm} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={props.isSubmitting} onClick={props.onConfirm} className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60">
                {props.isSubmitting ? "Claiming..." : "Confirm"}
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {props.showCancelModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Discard Changes?</h2>
            <p className="mt-2 text-sm text-slate-600">You have unsaved changes. Are you sure you want to discard them?</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={props.onCloseCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Keep Editing</button>
              <button type="button" onClick={props.onDiscard} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Discard</button>
            </div>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}
