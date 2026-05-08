import type { AuthUser } from '@/types/auth';
import type { ApiPostRecord } from '@/types/post-record-api';
import { POST_CATEGORIES } from '@/lib/post-categories';

// Test user accounts with their JWT tokens (mocked payloads)
export const testUsers = {
  admin: {
    user_id: 'admin-001',
    user_name: 'Admin User',
    email: 'admin@umak.edu.ph',
    profile_picture_url: null,
    user_type: 'Admin' as const,
    notification_token: null,
  },
  staff: {
    user_id: 'staff-001',
    user_name: 'Staff User',
    email: 'staff@umak.edu.ph',
    profile_picture_url: null,
    user_type: 'Staff' as const,
    notification_token: null,
  },
  user: {
    user_id: 'user-001',
    user_name: 'Regular User',
    email: 'student@umak.edu.ph',
    profile_picture_url: null,
    user_type: 'User' as const,
    notification_token: null,
  },
} satisfies Record<string, AuthUser>;

// Constants for test data
export const TEST_CONSTANTS = {
  VALID_CATEGORIES: POST_CATEGORIES,
  VALID_ITEM_STATUSES: ['Pending Verification', 'Verified', 'Claimed', 'Unclaimed'],
  VALID_POST_STATUSES: ['Draft', 'Posted', 'Resolved'],
  VALID_POST_TYPES: ['Lost', 'Found'],
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  VALID_LOCATIONS: [
    'Lobby',
    'Library',
    'Gymnasium',
    'Cafeteria',
    'Auditorium',
    'Classroom Building',
    'Science Building',
    'Engineering Building',
    'Administrative Building',
    'Parking Area',
    'Other',
  ],
  PAGINATION: {
    PAGE_SIZES: [10, 25, 50],
    DEFAULT_PAGE_SIZE: 10,
  },
};

// Helper to create random post data
type MockPostOverrides = Partial<ApiPostRecord> & {
  imageUrl?: string | null;
  itemName?: string | null;
  itemStatus?: string | null;
  itemType?: ApiPostRecord['item_type'] | 'lost';
  lastSeenAt?: string | null;
  lastSeenLocation?: string | null;
  postStatus?: string | null;
  post_type?: 'Lost' | 'Found' | 'lost' | 'found' | null;
  posterId?: string | null;
  posterName?: string | null;
  posterProfileUrl?: string | null;
  submissionDate?: string | null;
};

function normalizeMockItemType(
  itemType: MockPostOverrides['item_type'] | MockPostOverrides['itemType'] | MockPostOverrides['post_type']
): ApiPostRecord['item_type'] | null {
  if (!itemType) return null;
  const normalized = itemType.toLowerCase();
  if (normalized === 'missing' || normalized === 'lost') return 'missing';
  if (normalized === 'found') return 'found';
  return null;
}

export function createMockPost(overrides?: MockPostOverrides): ApiPostRecord {
  const categories = TEST_CONSTANTS.VALID_CATEGORIES;
  const category = categories[Math.floor(Math.random() * categories.length)] || 'Other';
  const itemTypes = ['missing', 'found'] as const;
  const fallbackItemType = itemTypes[Math.floor(Math.random() * 2)]!;
  const itemStatuses = ['claimed', 'unclaimed', 'lost', 'returned'] as const;
  const fallbackItemStatus = itemStatuses[Math.floor(Math.random() * 4)]!;
  const {
    imageUrl,
    itemName,
    itemStatus,
    itemType,
    lastSeenAt,
    lastSeenLocation,
    postStatus,
    post_type,
    posterId,
    posterName,
    posterProfileUrl,
    submissionDate,
    ...apiOverrides
  } = overrides ?? {};
  const resolvedItemType =
    normalizeMockItemType(apiOverrides.item_type ?? itemType ?? post_type) ?? fallbackItemType;

  return {
    post_id: Date.now(),
    item_id: null,
    poster_name: posterName ?? apiOverrides.poster_name ?? 'Test User',
    poster_id: posterId ?? apiOverrides.poster_id ?? 'staff-001',
    poster_profile_picture_url:
      posterProfileUrl ?? apiOverrides.poster_profile_picture_url ?? null,
    item_name:
      itemName ?? apiOverrides.item_name ?? `Test ${resolvedItemType} Item ${Date.now()}`,
    item_description: apiOverrides.item_description ?? 'This is a test item description',
    item_type: resolvedItemType,
    item_image_url:
      imageUrl ?? apiOverrides.item_image_url ?? 'https://via.placeholder.com/300x300',
    category: apiOverrides.category ?? category,
    last_seen_at: lastSeenAt ?? apiOverrides.last_seen_at ?? new Date().toISOString(),
    last_seen_location:
      lastSeenLocation ??
      apiOverrides.last_seen_location ??
      TEST_CONSTANTS.VALID_LOCATIONS[0] ??
      'Other',
    submission_date: submissionDate ?? apiOverrides.submission_date ?? new Date().toISOString(),
    post_status: postStatus ?? apiOverrides.post_status ?? 'accepted',
    item_status: itemStatus ?? apiOverrides.item_status ?? fallbackItemStatus,
    is_anonymous: apiOverrides.is_anonymous ?? false,
    ...apiOverrides,
  };
}

// Helper to create random announcement data
export function createMockAnnouncement(overrides?: any) {
  return {
    announcement_id: `ann-${Date.now()}-${Math.random()}`,
    title: `Test Announcement ${Date.now()}`,
    description: 'This is a test announcement description',
    image_url: null,
    posted_by_user_id: 'admin-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create random fraud report data
export function createMockFraudReport(overrides?: any): any {
  return {
    fraud_report_id: `fraud-${Date.now()}-${Math.random()}`,
    post_id: `post-${Date.now()}`,
    reporting_user_id: 'staff-001',
    reason: 'Test fraud reason',
    status: 'Open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create random audit log data
export function createMockAuditLog(overrides?: any) {
  const actions = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'VIEW',
    'LOGIN',
    'LOGOUT',
    'EXPORT',
  ];
  const action = actions[Math.floor(Math.random() * actions.length)];

  return {
    audit_log_id: `audit-${Date.now()}-${Math.random()}`,
    user_id: 'admin-001',
    action,
    resource: 'Post',
    resource_id: `post-${Date.now()}`,
    details: `User performed ${action} action`,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create test user by role
export function createMockUser(role: 'Admin' | 'Staff' | 'User', overrides?: Partial<AuthUser>): AuthUser {
  const baseUser = testUsers[role.toLowerCase() as keyof typeof testUsers];
  return {
    ...baseUser,
    ...overrides,
  };
}

// Helper to create notification data
export function createMockNotification(overrides?: any) {
  const types = ['POST_CREATED', 'POST_CLAIMED', 'FRAUD_REPORT', 'ANNOUNCEMENT'];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    notification_id: `notif-${Date.now()}-${Math.random()}`,
    user_id: 'staff-001',
    type,
    title: `Test ${type} Notification`,
    message: 'This is a test notification message',
    read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create dashboard stats data
export function createMockDashboardStats(overrides?: any) {
  return {
    pending_verifications: 15,
    verified_items: 42,
    claimed_items: 8,
    total_posts: 65,
    fraud_reports: 3,
    pending_fraud_reports: 2,
    last_updated: new Date().toISOString(),
    ...overrides,
  };
}
