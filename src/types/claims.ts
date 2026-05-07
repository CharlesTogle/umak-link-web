export interface ClaimDetails {
  claimer_name: string;
  claimer_school_email: string;
  claimer_contact_num: string;
  poster_name: string;
  staff_id: string;
  staff_name: string;
}

export interface ProcessClaimRequest {
  found_post_id: number;
  missing_post_id?: number | null;
  claim_details: ClaimDetails;
}

export interface ProcessClaimResponse {
  success: boolean;
  claim_id: string | number | null;
}

export interface DeleteClaimResponse {
  success: boolean;
}
