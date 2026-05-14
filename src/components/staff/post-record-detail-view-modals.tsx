"use client";

import { Overlay } from "@/components/ui/overlay";
import { toDisplayLabel } from "@/lib/format-utils";
import type {
  ApiEditableClaimedCustodyStatus,
  ApiItemStatus,
  ApiPostStatus,
} from "@/types/post-record-api";

export function PostRecordModals(props: {
  showStatusModal: boolean;
  showRejectModal: boolean;
  showUnclaimModal: boolean;
  showNotifyModal: boolean;
  isSubmitting: boolean;
  selectedStatus: ApiPostStatus | null;
  selectedItemStatus: ApiItemStatus | null;
  selectedCustodyStatus: ApiEditableClaimedCustodyStatus | null;
  postItemType: string;
  postStatusOptions: ApiPostStatus[];
  claimedCustodyStatusOptions: ApiEditableClaimedCustodyStatus[];
  rejectReasons: readonly string[];
  statusHelpText?: string | null;
  showItemStatusSection: boolean;
  showCustodyStatusSection: boolean;
  getStatusChipClass: (active: boolean, disabled?: boolean) => string;
  isPostStatusAllowed: (postStatus: ApiPostStatus, selectedItemStatus: ApiItemStatus | null) => boolean;
  isItemStatusAllowed: (itemStatus: ApiItemStatus, selectedPostStatus: ApiPostStatus | null) => boolean;
  getItemStatusOptions: (itemType: string | undefined) => ApiItemStatus[];
  onSelectStatus: (value: ApiPostStatus) => void;
  onSelectItemStatus: (value: ApiItemStatus) => void;
  onSelectCustodyStatus: (value: ApiEditableClaimedCustodyStatus) => void;
  onCancelStatus: () => void;
  onApplyStatusChange: () => void;
  onReject: (reason: string) => void;
  onCancelReject: () => void;
  onCancelUnclaim: () => void;
  onConfirmUnclaim: () => void;
  onCancelNotify: () => void;
  onConfirmNotify: () => void;
}) {
  return (
    <>
      {props.showStatusModal ? (
        <Overlay>
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Update Post Status</h2>
            <p className="mt-1 text-sm text-slate-600">Select the available post, item, and custody statuses to apply.</p>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Post Status</p>
              {props.statusHelpText ? <p className="mb-3 text-sm text-amber-700">{props.statusHelpText}</p> : null}
              <div className="flex flex-wrap gap-2">
                {props.postStatusOptions.map((status) => {
                  const allowed = props.isPostStatusAllowed(status, props.selectedItemStatus);
                  const active = props.selectedStatus === status;
                  return (
                    <button key={status} type="button" disabled={!allowed} onClick={() => props.onSelectStatus(status)} className={`rounded-full border px-3 py-1.5 text-sm transition ${props.getStatusChipClass(active, !allowed)}`}>
                      {toDisplayLabel(status)}
                    </button>
                  );
                })}
              </div>
            </div>
            {props.showItemStatusSection ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Item Status</p>
                <div className="flex flex-wrap gap-2">
                  {props.getItemStatusOptions(props.postItemType).map((status) => {
                    const allowed = props.isItemStatusAllowed(status, props.selectedStatus);
                    const active = props.selectedItemStatus === status;
                    return (
                      <button key={status} type="button" disabled={!allowed} onClick={() => props.onSelectItemStatus(status)} className={`rounded-full border px-3 py-1.5 text-sm transition ${props.getStatusChipClass(active, !allowed)}`}>
                        {toDisplayLabel(status)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {props.showCustodyStatusSection ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Custody Status</p>
                <div className="flex flex-wrap gap-2">
                  {props.claimedCustodyStatusOptions.map((status) => {
                    const active = props.selectedCustodyStatus === status;
                    return (
                      <button key={status} type="button" onClick={() => props.onSelectCustodyStatus(status)} className={`rounded-full border px-3 py-1.5 text-sm transition ${props.getStatusChipClass(active)}`}>
                        {toDisplayLabel(status)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <ModalActions>
              <button type="button" onClick={props.onCancelStatus} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={props.isSubmitting} onClick={props.onApplyStatusChange} className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60">
                {props.isSubmitting ? "Updating..." : "Apply Changes"}
              </button>
            </ModalActions>
          </div>
        </Overlay>
      ) : null}

      {props.showRejectModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Reject Post</h2>
            <p className="mt-2 text-sm text-slate-600">Select a reason to reject the post. Uploader will be notified.</p>
            <div className="mt-4 space-y-2">
              {props.rejectReasons.map((reason) => (
                <button key={reason} type="button" disabled={props.isSubmitting} onClick={() => props.onReject(reason)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  {reason}
                </button>
              ))}
            </div>
            <ModalActions>
              <button type="button" onClick={props.onCancelReject} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </ModalActions>
          </div>
        </Overlay>
      ) : null}

      {props.showUnclaimModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Confirm Unclaim Action</h2>
            <p className="mt-2 text-sm text-slate-600">This deletes the claim record and resets linked missing items back to lost status. Continue?</p>
            <ModalActions>
              <button type="button" onClick={props.onCancelUnclaim} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={props.isSubmitting} onClick={props.onConfirmUnclaim} className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60">
                {props.isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </ModalActions>
          </div>
        </Overlay>
      ) : null}

      {props.showNotifyModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Notify Owner</h2>
            <p className="mt-2 text-sm text-slate-600">Notify the owner that similar items may be in the Security Office?</p>
            <ModalActions>
              <button type="button" onClick={props.onCancelNotify} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={props.onConfirmNotify} className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]">Confirm</button>
            </ModalActions>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}

function ModalActions(props: { children: React.ReactNode }) {
  return <div className="mt-4 flex items-center justify-end gap-2">{props.children}</div>;
}
