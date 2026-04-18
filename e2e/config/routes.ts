/**
 * All application routes for UMak-LINK Web Portal
 * Verified against src/app directory structure
 */

export const APP_ROUTES = {
  home: '/',
  notAllowed: '/not-allowed',

  admin: {
    home: '/admin',
    dashboard: '/admin/dashboard',
    announcements: '/admin/generate-announcement',  // create form
    announcementsList: '/admin/announcement',        // list view
    auditLogs: '/admin/audit-log',
    userManagement: '/admin/admin-management',
    adminManagement: '/admin/admin-management',
    staffManagement: '/admin/staff-management',
    auditTrail: '/admin/audit-trail',
    notifications: '/admin/notifications',
    profile: '/admin/profile',
  },

  staff: {
    home: '/staff',
    dashboard: '/staff',  // Real dashboard — sidebar links here; /staff/home is a stub page
    posts: '/staff/post-records',
    createPost: '/staff/post/create',
    viewPost: (postId: string) => `/staff/post-record/view/${postId}`,
    search: '/staff/search',
    searchResults: '/staff/search/results',
    fraudReports: '/staff/fraud-reports',
    fraudReportDetails: (reportId: string) => `/staff/fraud-report/view/${reportId}`,
    notifications: '/staff/notifications',
    profile: '/staff/profile',
  },
};

export const ADMIN_ONLY_ROUTES = [
  APP_ROUTES.admin.dashboard,
  APP_ROUTES.admin.announcements,
  APP_ROUTES.admin.announcementsList,
  APP_ROUTES.admin.auditLogs,
  APP_ROUTES.admin.userManagement,
];

export const STAFF_ONLY_ROUTES = [
  APP_ROUTES.staff.dashboard,
  APP_ROUTES.staff.posts,
  APP_ROUTES.staff.createPost,
  APP_ROUTES.staff.search,
  APP_ROUTES.staff.fraudReports,
];

export const ALL_TEST_ROUTES = [
  APP_ROUTES.home,
  APP_ROUTES.notAllowed,
  APP_ROUTES.admin.home,
  APP_ROUTES.admin.dashboard,
  APP_ROUTES.admin.announcements,
  APP_ROUTES.admin.announcementsList,
  APP_ROUTES.admin.auditLogs,
  APP_ROUTES.admin.userManagement,
  APP_ROUTES.admin.notifications,
  APP_ROUTES.staff.home,
  APP_ROUTES.staff.dashboard,
  APP_ROUTES.staff.posts,
  APP_ROUTES.staff.createPost,
  APP_ROUTES.staff.search,
  APP_ROUTES.staff.fraudReports,
  APP_ROUTES.staff.notifications,
  APP_ROUTES.staff.profile,
];
