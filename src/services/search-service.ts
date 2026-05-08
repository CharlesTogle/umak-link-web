import { api } from "@/lib/api";
import type {
  MatchMissingItemApiRequest,
  MatchMissingItemRequest,
  MatchMissingItemResponse,
  ReverseImageQueryApiRequest,
  ReverseImageQueryRequest,
  ReverseImageQueryResponse,
  SearchItemsStaffApiRequest,
  SearchItemsStaffApiResponse,
  SearchItemsStaffRequest,
  SearchMatchRow,
} from "@/types/search";

function mapToApiRequest(params: SearchItemsStaffRequest): SearchItemsStaffApiRequest {
  const request: SearchItemsStaffApiRequest = {
    query: params.query,
  };

  if (params.limit !== undefined) request.limit = params.limit;
  if (params.lastSeenDate !== undefined) request.last_seen_date = params.lastSeenDate;
  if (params.category !== undefined) request.category = params.category;
  if (params.locationLastSeen !== undefined) request.location_last_seen = params.locationLastSeen;
  if (params.claimFrom !== undefined) request.claim_from = params.claimFrom;
  if (params.claimTo !== undefined) request.claim_to = params.claimTo;
  if (params.itemStatus !== undefined) request.item_status = params.itemStatus;
  if (params.sort !== undefined) request.sort = params.sort;
  if (params.sortDirection !== undefined) request.sort_direction = params.sortDirection;

  return request;
}

export async function searchItemsStaff(params: SearchItemsStaffRequest): Promise<SearchMatchRow[]> {
  const request = mapToApiRequest(params);
  const { data } = await api.post<SearchItemsStaffApiResponse>("/search/items/staff", request);
  return data.results ?? [];
}

function mapMatchMissingItemRequest(params: MatchMissingItemRequest): MatchMissingItemApiRequest {
  return { post_id: params.postId };
}

export async function matchMissingItem(
  params: MatchMissingItemRequest
): Promise<MatchMissingItemResponse> {
  const request = mapMatchMissingItemRequest(params);
  const { data } = await api.post<MatchMissingItemResponse>("/search/match-missing-item", request);
  return {
    ...data,
    matches: data.matches ?? [],
  };
}

function mapReverseImageRequest(params: ReverseImageQueryRequest): ReverseImageQueryApiRequest {
  const request: ReverseImageQueryApiRequest = {
    image_data_url: params.imageDataUrl,
  };

  if (params.searchValue !== undefined) {
    request.search_value = params.searchValue;
  }

  return request;
}

export async function generateReverseImageQuery(
  params: ReverseImageQueryRequest
): Promise<ReverseImageQueryResponse> {
  const request = mapReverseImageRequest(params);
  const { data } = await api.post<ReverseImageQueryResponse>("/search/image-query", request);
  return data;
}
