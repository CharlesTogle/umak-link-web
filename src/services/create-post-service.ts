import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { extractPhilippineDateTimeParts } from "@/lib/date-time-helpers";
import { computeBlockHash64 } from "@/lib/hash-utils";
import { makeDisplay } from "@/lib/image-utils";

interface LocationPathNode {
  name: string;
  type: string;
}

interface CreatePostRequest {
  p_item_name: string;
  p_item_description?: string;
  p_item_type: "found" | "lost" | "missing";
  p_poster_id?: string;
  p_image_hash: string;
  p_image_link: string;
  p_category?: string;
  p_last_seen_date: string;
  p_last_seen_hours: number;
  p_last_seen_minutes: number;
  p_item_status: "claimed" | "unclaimed" | "discarded" | "returned" | "lost";
  p_post_status: "pending" | "accepted" | "rejected" | "archived" | "deleted" | "reported" | "fraud";
  p_location_path: LocationPathNode[];
  p_is_anonymous?: boolean;
}

interface CreatePostAutofillRequest {
  image_data_url: string;
  current_title?: string;
  current_description?: string;
  current_category?: string;
}

interface CreatePostAutofillResponse {
  success: boolean;
  content?: {
    itemName?: string;
    itemDescription?: string;
    itemCategory?: string;
  };
  error?: string;
}

export interface CreateStaffPostInput {
  userId: string;
  itemName: string;
  itemDescription: string;
  category: string;
  lastSeenISO: string;
  locationDetails: {
    level1: string;
    level2: string;
    level3: string;
  };
  image: File;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, { context: "action", fallback });
}

async function uploadDisplayImage(image: File, userId: string): Promise<string> {
  const displayBlob = await makeDisplay(image);
  const fileName = `${userId}_${Date.now()}.webp`;

  const { data: uploadData } = await api.post<{
    uploadUrl: string;
    objectPath: string;
    publicUrl: string;
  }>("/storage/upload-url", {
    bucket: "items",
    fileName,
    contentType: displayBlob.type,
  });

  const uploadResponse = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    body: displayBlob,
    headers: {
      "Content-Type": displayBlob.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload image");
  }

  await api.post("/storage/confirm-upload", {
    bucket: "items",
    objectPath: uploadData.objectPath,
  });

  return uploadData.publicUrl;
}

export async function createStaffPost(input: CreateStaffPostInput): Promise<{ post_id: number }> {
  try {
    const imageLink = await uploadDisplayImage(input.image, input.userId);
    const imageHash = await computeBlockHash64(input.image);
    const lastSeenDate = extractPhilippineDateTimeParts(input.lastSeenISO);

    const locationPath: LocationPathNode[] = [
      { name: input.locationDetails.level1, type: "building" },
      { name: input.locationDetails.level2, type: "floor" },
      { name: input.locationDetails.level3, type: "room" },
    ].filter((node) => node.name.trim().length > 0);

    const payload: CreatePostRequest = {
      p_item_name: input.itemName,
      p_item_type: "found",
      p_poster_id: input.userId,
      p_image_hash: imageHash,
      p_image_link: imageLink,
      p_last_seen_date: `${String(lastSeenDate.year).padStart(4, "0")}-${String(lastSeenDate.month).padStart(2, "0")}-${String(lastSeenDate.day).padStart(2, "0")}`,
      p_last_seen_hours: lastSeenDate.hour,
      p_last_seen_minutes: lastSeenDate.minute,
      p_item_status: "unclaimed",
      p_post_status: "pending",
      p_location_path: locationPath,
      p_is_anonymous: false,
    };

    if (input.itemDescription.trim().length > 0) {
      payload.p_item_description = input.itemDescription;
    }
    if (input.category.trim().length > 0) {
      payload.p_category = input.category;
    }

    const { data } = await api.post<{ post_id: number }>("/posts", payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create post"));
  }
}

export async function requestCreatePostAutofill(
  payload: CreatePostAutofillRequest
): Promise<CreatePostAutofillResponse> {
  try {
    const { data } = await api.post<CreatePostAutofillResponse>("/ai/create-post-autofill", payload);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 429) {
      return {
        success: false,
        error: "rate_limit_exceeded",
      };
    }

    return {
      success: false,
      error: getErrorMessage(error, "Failed to generate autofill"),
    };
  }
}
