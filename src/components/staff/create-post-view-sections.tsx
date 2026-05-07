"use client";

import Image from "next/image";
import { Info, Loader2, Upload, X } from "lucide-react";
import { POST_CATEGORIES } from "@/lib/post-categories";
import type { Meridian } from "@/lib/date-time-helpers";
import type { LocationDetails } from "@/types/create-post";

export function CreatePostImageSection(props: {
  image: File | null;
  imagePreviewUrl: string | null;
  onChangeImage: (file: File | null) => void | Promise<void>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#1D2981]">Item Image</p>
        {props.image ? (
          <button
            type="button"
            onClick={() => void props.onChangeImage(null)}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <X className="size-3.5" />
            Remove
          </button>
        ) : null}
      </div>

      <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
        {props.imagePreviewUrl ? (
          <div className="space-y-3">
            <div className="relative h-64 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Image src={props.imagePreviewUrl} alt="Item preview" fill className="object-contain" />
            </div>
            <p className="truncate text-xs text-slate-500">{props.image?.name}</p>
          </div>
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 text-center text-slate-500">
            <Upload className="size-8 text-slate-400" />
            <p className="text-sm font-medium">Upload item photo</p>
            <p className="text-xs">The image will be compressed to WebP (1600px max edge) before upload.</p>
          </div>
        )}

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm text-white hover:bg-[#16206b]">
          <Upload className="size-4" />
          {props.image ? "Replace image" : "Choose image"}
          <input
            type="file"
            accept="image/*"
            onChange={(event) => void props.onChangeImage(event.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700">
        <Info className="mt-0.5 size-4 text-sky-700" />
        <p>Uploading an image can trigger Gemini suggestions for item title, description, and category.</p>
      </div>
    </div>
  );
}

export function CreatePostFormSection(props: {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  meridian: Meridian;
  locationDetails: LocationDetails;
  isAiGenerating: boolean;
  formatDateForInput: (value: string) => string;
  parseInputDate: (value: string) => string;
  to24HourTime: (time: string, meridian: Meridian) => string;
  parse24HourTime: (value: string) => { time: string; meridian: Meridian };
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (time: string, meridian: Meridian) => void;
  onMeridianChange: (value: Meridian) => void;
  onLocationChange: (key: keyof LocationDetails, value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Item Name/Title *</label>
        <input
          type="text"
          value={props.title}
          maxLength={32}
          onChange={(event) => props.onTitleChange(event.target.value)}
          disabled={props.isAiGenerating}
          placeholder="Max 32 characters"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Description *</label>
        <textarea
          value={props.description}
          maxLength={150}
          onChange={(event) => props.onDescriptionChange(event.target.value)}
          disabled={props.isAiGenerating}
          placeholder="Provide additional details about the item. Max 150 characters."
          className="h-28 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Category *</label>
        <select
          value={props.category}
          onChange={(event) => props.onCategoryChange(event.target.value)}
          disabled={props.isAiGenerating}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
        >
          <option value="">Select category</option>
          {POST_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Last Seen Date *</label>
          <input
            type="date"
            value={props.formatDateForInput(props.date)}
            onChange={(event) => props.onDateChange(props.parseInputDate(event.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Time *</label>
          <input
            type="time"
            value={props.to24HourTime(props.time, props.meridian)}
            onChange={(event) => {
              const parsed = props.parse24HourTime(event.target.value);
              props.onTimeChange(parsed.time, parsed.meridian);
            }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Meridian *</label>
          <select
            value={props.meridian}
            onChange={(event) => props.onMeridianChange(event.target.value as Meridian)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Building/Area *</label>
          <input
            type="text"
            value={props.locationDetails.level1}
            onChange={(event) => props.onLocationChange("level1", event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Floor/Side *</label>
          <input
            type="text"
            value={props.locationDetails.level2}
            onChange={(event) => props.onLocationChange("level2", event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Room/Place *</label>
          <input
            type="text"
            value={props.locationDetails.level3}
            onChange={(event) => props.onLocationChange("level3", event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
          />
        </div>
      </div>
    </div>
  );
}

export function CreatePostSidebar(props: {
  isSubmitting: boolean;
  isAiGenerating: boolean;
  onDiscard: () => void;
  onSubmit: () => void;
}) {
  return (
    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#1D2981]">Submission Rules</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>Please fill out all required fields before submitting.</li>
          <li>Staff posts are automatically marked as found items.</li>
          <li>Images will be automatically converted to WebP format for faster loading.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#1D2981]">Actions</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={props.onDiscard}
            disabled={props.isSubmitting}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onSubmit}
            disabled={props.isSubmitting || props.isAiGenerating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm text-white hover:bg-[#16206b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit Post
          </button>
        </div>
      </div>
    </aside>
  );
}
