"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Upload, X, AlertCircle } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomToast } from "@/components/ui/custom-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logError } from "@/lib/error-utils";
import { createAnnouncement } from "@/services/announcements-service";
import { insertAuditLog } from "@/services/audit-logs-service";
import { uploadAndGetPublicUrl } from "@/services/storage-service";

interface Toast {
  show: boolean;
  message: string;
  tone: "success" | "danger";
}

export default function AdminGenerateAnnouncementPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>({ show: false, message: "", tone: "success" });
  const [showConfirmPost, setShowConfirmPost] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showToast("Image size must be less than 5MB", "danger");
        return;
      }

      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file", "danger");
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const showToast = (message: string, tone: "success" | "danger") => {
    setToast({ show: true, message, tone });
    setTimeout(() => setToast({ show: false, message: "", tone: "success" }), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (title.trim() === "" && description.trim() === "") {
      showToast("Title or Description must not be empty", "danger");
      return;
    }

    setShowConfirmPost(true);
  };

  const handleConfirmPost = async () => {
    setShowConfirmPost(false);
    setLoading(true);

    try {
      if (!user) {
        showToast("User not found. Please log in again.", "danger");
        return;
      }

      // Upload image if exists
      let imageUrl: string | null = null;
      if (image) {
        try {
          const path = `announcements/${Date.now()}_${image.name}`;
          imageUrl = await uploadAndGetPublicUrl("items", path, image);
        } catch (uploadError) {
          logError("Failed to upload image:", uploadError);
          showToast("Failed to upload image. Posting without image.", "danger");
        }
      }

      // Create announcement
      await createAnnouncement({
        user_id: user.user_id,
        message: title || "New Feature Available",
        description: description || "Check out our latest update with amazing new features!",
        image_url: imageUrl,
      });

      // Insert audit log
      try {
        await insertAuditLog({
          user_id: user.user_id,
          action: "create_announcement",
          table_name: "global_announcement_table",
          record_id: user.user_id,
          changes: {
            title: title || "New Feature Available",
            message: `${user.user_name || "Admin"} has sent a global announcement`,
            description: description || "Check out our latest update with amazing new features!",
            timestamp: new Date().toISOString(),
          },
        });
      } catch (auditError) {
        logError("Failed to insert audit log:", auditError);
        // Continue even if audit log fails
      }

      showToast("Announcement posted and notifications sent.", "success");

      // Reset form
      setTitle("");
      setDescription("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Navigate back after a delay
      setTimeout(() => {
        router.push("/admin/announcement");
      }, 1500);
    } catch (error) {
      logError("Failed to post announcement:", error);
      showToast("Failed to post announcement. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmCancel(true);
  };

  const handleConfirmCancel = () => {
    setShowConfirmCancel(false);
    router.push("/admin/announcement");
  };

  return (
    <PhotoProvider>
      <div className="h-full space-y-4 overflow-y-auto pr-1">
      {/* Toast Notifications */}
      {toast.show && <CustomToast message={toast.message} tone={toast.tone} mode="floating" />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1D2981]">Create Announcement</h1>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" size="sm" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#1D2981] hover:bg-[#1D2981]/90"
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting...
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Icon and Title Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10">
                <Megaphone className="size-5 text-[#1D2981]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1D2981]">Create Announcements</h2>
            </div>

            {/* Title Field */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Enter announcement title (max 100 characters)"
                className="min-h-[80px] w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#1D2981] focus:outline-none focus:ring-2 focus:ring-[#1D2981]/20"
                rows={3}
              />
              <p className="mt-1 text-right text-xs text-slate-500">{title.length}/100</p>
            </div>

            {/* Message/Description Field */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="Enter announcement details (max 500 characters)"
                className="min-h-[120px] w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#1D2981] focus:outline-none focus:ring-2 focus:ring-[#1D2981]/20"
                rows={5}
              />
              <p className="mt-1 text-right text-xs text-slate-500">{description.length}/500</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Preview Image (Optional)
              </label>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative">
                    <PhotoView src={imagePreview}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="aspect-video w-full cursor-zoom-in rounded-lg border border-slate-300 object-cover"
                      />
                    </PhotoView>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition hover:bg-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 transition hover:border-[#1D2981] hover:bg-slate-100"
                  >
                    <Upload className="size-6 text-slate-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-700">
                        Click to upload image
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#1D2981] hover:bg-[#1D2981]/90"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="mr-2 size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Posting Announcement...
                </>
              ) : (
                "Post Announcement"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal - Post */}
      {showConfirmPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10">
                  <Megaphone className="size-5 text-[#1D2981]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Post announcement?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Are you sure you want to post this announcement and send notifications to all
                    users?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmPost(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPost}
                  className="flex-1 bg-[#1D2981] hover:bg-[#1D2981]/90"
                >
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Modal - Cancel */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="size-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Discard announcement?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Are you sure you want to discard this announcement? Unsaved changes will be
                    lost.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmCancel(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Keep editing
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </PhotoProvider>
  );
}
