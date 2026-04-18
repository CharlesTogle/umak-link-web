# University of Makati – College of Computing and Information Sciences
## ELEC2

### Title
**WEB-BASED STAFF AND SYSTEM ADMINISTRATOR PORTAL FOR UMAK LOST AND FOUND SYSTEM (UMak-LINK)**

### Group Members
*<Group Members Name>*

---

## A. Narrative Description on the Proposed System/Process

The proposed web-based portal extends the UMak-LINK mobile application by providing a dedicated interface for **Staff** and **System Administrators** to manage the University of Makati's Lost and Found System. This portal centralizes the management of found item posts, user moderation, and system analytics while maintaining the same core functionality as the mobile app. The following outlines the step-by-step processes of the Web-based Staff and System Administrator Portal for UMak-LINK:

### 1. Secure Authentication and Access Control
The proposed system implements Google OAuth 2.0 authentication to ensure secure access for authorized university personnel. The system distinguishes between two user roles: **System Administrator** (with full system access and management capabilities) and **Staff** (for campus security and lost-and-found office personnel). Each role has specifically tailored permissions and interface views based on their responsibilities. Login errors are displayed clearly to guide users in case of authentication failures.

### 2. Found Item Post Management
Staff members can submit new found item posts through the web portal, which includes uploading images, providing detailed descriptions, and specifying the location where items were found. All submitted posts enter a pending state and require administrative approval before becoming visible to mobile app users. Staff can also mark items as **claimed** (when owners successfully retrieve their items) or **discarded** (when items exceed the retention period or are disposed of according to university policy). This workflow ensures data quality and prevents spam or inappropriate content from reaching end users.

### 3. Content Moderation and Review System
The system provides administrators with a comprehensive moderation dashboard to review pending posts. Admins can **accept** valid posts (making them live on the mobile app) or **reject** posts that do not meet quality standards or violate posting guidelines. Additionally, the portal handles user-generated reports from the mobile app—when users flag inappropriate content, admins can review these reported posts and take action by verifying the report (removing the post) or rejecting the report (keeping the post live). This dual-layer moderation system maintains content integrity across the platform.

### 4. Staff Account Administration
Using the System Administrator account, authorized personnel can create, modify, and deactivate staff accounts. This includes assigning appropriate permissions, managing account credentials, and tracking staff activity within the system. The System Administrator dashboard provides a centralized interface for overseeing all staff members who have access to the web portal, ensuring accountability and proper access control.

### 5. System Analytics and Dashboard
The web portal features a comprehensive dashboard that displays real-time statistics and key performance indicators. System Administrators can view metrics such as:
- Total number of found items posted
- Items successfully claimed vs. items discarded
- Pending posts awaiting moderation
- Active reports requiring review
- Staff activity and contribution metrics

These analytics help administrators make informed decisions about system usage and identify trends in lost and found activity across campus.

### 6. Audit Trail and Activity Logging
The system maintains a detailed audit trail of all administrative actions performed within the portal. Every significant event, including post approvals, rejections, staff account modifications, and report handling, is logged with timestamps and user attribution. System Administrators can view this audit trail to ensure accountability, investigate issues, and maintain compliance with university data governance policies.

### 7. Announcement Generation and Broadcasting
Administrators can generate system-wide announcements that are displayed to mobile app users. This feature enables the lost and found office to communicate important updates, policy changes, operating hours, or special notices directly to the university community through the mobile application.

### 8. Comprehensive Reporting System
The portal provides advanced reporting capabilities, allowing System Administrators to generate detailed reports on system usage, item statistics, staff performance, and historical trends. Reports can be viewed on-screen or downloaded in various formats for record-keeping, presentations, or administrative review. This feature supports data-driven decision-making and helps demonstrate the system's impact on campus operations.

### 9. Database Backup and Recovery
The proposed system implements automated database backup mechanisms to protect against data loss. In the event of system failures or data corruption, administrators can recover the database to a previous stable state, ensuring business continuity and data integrity.

---

## B. Use Case Diagram of Proposed System

![UMak Lost and Found System (Web) - Use Case Diagram](./use-case-diagram-web.png)

### Use Case Summary

#### System Administrator Actor
The System Administrator role has full system access and is responsible for:
- **Authentication**: Log in via Google OAuth with error handling
- **User Management**: Manage staff accounts (create, modify, deactivate)
- **Content Moderation**: Review and approve/reject pending posts
- **Report Handling**: Verify or reject user-submitted reports on inappropriate content
- **Analytics**: View comprehensive dashboard data and system metrics
- **Announcements**: Generate and broadcast system announcements to mobile users
- **Reporting**: View detailed system reports and download them for analysis
- **Audit**: View complete audit trail of all system activities

#### Staff Actor
The Staff role is designed for campus security and lost-and-found office personnel:
- **Authentication**: Log in via Google OAuth with error handling
- **Post Management**: Add new found item posts with images and descriptions
- **Post Status Updates**: Mark items as claimed or discarded
- **Pending Queue**: View all pending posts awaiting System Administrator approval
- **Post Records**: Access historical records of all submitted posts
- **Report Monitoring**: View posts that have been reported by mobile users
- **Report Review**: Review reported posts and provide input for System Administrator decision-making

### Key System Features
- **Google OAuth Integration**: Secure, university-affiliated authentication
- **Role-Based Access Control**: Distinct permissions for System Administrator and Staff roles
- **Multi-Stage Post Workflow**: Submission → Pending → Approval/Rejection → Live/Discarded
- **Dual Moderation System**: System Administrator approval for new posts + community reporting for live posts
- **Real-Time Analytics**: Dashboard updates reflecting current system state
- **Audit Trail**: Complete logging of administrative actions for accountability
- **Announcement System**: Direct communication channel to mobile app users
- **Export Capabilities**: Download reports for external analysis and record-keeping

---

*This web-based Staff and System Administrator portal serves as the management backbone of the UMak-LINK ecosystem, ensuring efficient operations, content quality, and data-driven insights while maintaining seamless integration with the mobile application used by students and faculty across campus.*
