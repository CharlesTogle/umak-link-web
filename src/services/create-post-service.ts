import { isAxiosError } from "axios";
import { api } from "@/lib/api";
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
  p_category?: string;
  p_date_day?: number;
  p_date_month?: number;
  p_date_year?: number;
  p_time_hour?: number;
  p_time_minute?: number;
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
  if (isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "object" &&
      error.response?.data &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
        ? error.response.data.message
        : null;
    if (responseMessage) return responseMessage;
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function uploadDisplayImage(image: File, userId: string): Promise<void> {
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
}

export async function createStaffPost(input: CreateStaffPostInput): Promise<{ post_id: number }> {
  try {
    await uploadDisplayImage(input.image, input.userId);
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
      p_date_day: lastSeenDate.day,
      p_date_month: lastSeenDate.month,
      p_date_year: lastSeenDate.year,
      p_time_hour: lastSeenDate.hour,
      p_time_minute: lastSeenDate.minute,
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
