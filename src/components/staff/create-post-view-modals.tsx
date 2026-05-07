"use client";

import { Sparkles } from "lucide-react";

interface AiGeneratedContent {
  itemName?: string;
  itemDescription?: string;
  itemCategory?: string;
}

export function ActionModal(props: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmTone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!props.isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{props.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{props.description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={props.onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">{props.cancelLabel}</button>
          <button type="button" onClick={props.onConfirm} className={`rounded-full px-4 py-2 text-sm text-white ${props.confirmTone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-[#1D2981] hover:bg-[#16206b]"}`}>{props.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function AiGeneratingOverlay(props: { isOpen: boolean; onCancel: () => void }) {
  if (!props.isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#1D2981]/10 text-[#1D2981]">
          <Sparkles className="size-5" />
        </div>
        <p className="mt-3 text-base font-semibold text-slate-900">Generating suggestions...</p>
        <p className="mt-1 text-sm text-slate-600">This may take a few seconds.</p>
        <button type="button" onClick={props.onCancel} className="mt-4 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100">Cancel</button>
      </div>
    </div>
  );
}

export function AiGeneratedContentModal(props: {
  content: AiGeneratedContent | null;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!props.isOpen || !props.content) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-[#1D2981] px-5 py-3 text-white">
          <p className="text-base font-semibold">Generated Content</p>
        </div>
        <div className="space-y-4 p-5">
          {props.content.itemName ? <ModalField label="Item Name" value={props.content.itemName} /> : null}
          {props.content.itemDescription ? <ModalField label="Description" value={props.content.itemDescription} /> : null}
          {props.content.itemCategory ? <ModalField label="Category" value={props.content.itemCategory} /> : null}
        </div>
        <div className="flex border-t border-slate-200">
          <button type="button" onClick={props.onCancel} className="flex-1 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={props.onConfirm} className="flex-1 border-l border-slate-200 px-4 py-3 text-sm font-medium text-[#1D2981] hover:bg-[#1D2981]/5">Apply Changes</button>
        </div>
      </div>
    </div>
  );
}

function ModalField(props: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">{props.value}</p>
    </div>
  );
}
