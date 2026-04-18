import type { AuthUser } from '@/types/auth';
import type { PostRecord } from '@/types/post-record';
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
export function createMockPost(overrides?: Partial<PostRecord>): PostRecord {
  const categories = TEST_CONSTANTS.VALID_CATEGORIES;
  const category = categories[Math.floor(Math.random() * categories.length)] || 'Other';
  const itemTypes = ['missing', 'found'] as const;
  const itemType = itemTypes[Math.floor(Math.random() * 2)];
  const itemStatuses = ['Claimed', 'Unclaimed', 'Lost', 'Returned'] as const;
  const itemStatus = itemStatuses[Math.floor(Math.random() * 4)];

  return {
    postId: `post-${Date.now()}-${Math.random()}`,
    posterId: 'staff-001',
    itemType,
    itemName: `Test ${itemType} Item ${Date.now()}`,
    category,
    itemDescription: 'This is a test item description',
    imageUrl: 'https://via.placeholder.com/300x300',
    lastSeenLocation: TEST_CONSTANTS.VALID_LOCATIONS[0] || 'Other',
    itemStatus,
    postStatus: 'Accepted',
    submissionDate: new Date().toISOString(),
    hoursAgo: 0,
    username: 'Test User',
    isAnonymous: false,
    posterProfileUrl: null,
    itemId: null,
    title: `Test ${itemType} Item`,
    lastSeenAt: new Date().toISOString(),
    ...overrides,
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
