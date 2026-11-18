import { ClubEvent, StudentProject } from '../data/clubData';

export interface AdminSessionUser {
  id: string;
  role: 'admin';
  name: string;
  email: string;
  designation: 'Principal' | 'HOD' | 'Faculty Advisor' | 'Student Coordinator';
  department: string;
}

export interface AdminUserRecord {
  id: string;
  uid: string;
  name: string;
  email: string;
  designation: 'Principal' | 'HOD' | 'Faculty Advisor' | 'Student Coordinator';
  department: string;
}

export interface MemberSessionUser {
  id: string;
  uid?: string;
  role: 'member';
  name: string;
  usn: string;
  email: string;
  semester: string;
  domain: string;
  clubRole: 'Club Head' | 'Domain Lead' | 'Member';
  joinedAt: string;
  attendanceRate: number;
  githubHandle: string;
  bio: string;
}

export type AuthUser = AdminSessionUser | MemberSessionUser;

export interface ClubMemberRecord {
  id: string;
  uid?: string;
  name: string;
  usn: string;
  email: string;
  semester: string;
  domain: string;
  clubRole: 'Club Head' | 'Domain Lead' | 'Member';
  joinedAt: string;
  attendanceRate: number;
  githubHandle: string;
  bio: string;
}

export interface JoinRequestRecord {
  id: string;
  uid?: string;
  name: string;
  usn: string;
  email: string;
  semester: string;
  domain: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
}

export interface EventRegistrationItem {
  id: string;
  uid?: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  studentName: string;
  usn: string;
  email: string;
  semester: string;
  track?: string;
  passCode: string;
  checkedIn: boolean;
  createdAt: string;
}

export interface ContactInquiryItem {
  id: string;
  uid?: string;
  referenceId: string;
  name: string;
  email: string;
  usn: string;
  topic: string;
  message: string;
  status: 'open' | 'reviewed';
  createdAt: string;
}

export interface AdminDashboardPayload {
  summary: {
    totalMembers: number;
    headsCount: number;
    pendingRequestsCount: number;
    totalRegistrations: number;
    openInquiriesCount: number;
    semesterBreakdown: Record<string, number>;
    domainBreakdown: Record<string, number>;
  };
  admins: AdminUserRecord[];
  members: ClubMemberRecord[];
  joinRequests: JoinRequestRecord[];
  registrations: EventRegistrationItem[];
  events: ClubEvent[];
  inquiries: ContactInquiryItem[];
}

export interface MemberPortalPayload {
  member: ClubMemberRecord;
  registrations: EventRegistrationItem[];
  heads: ClubMemberRecord[];
  totalClubStudents: number;
}

export interface PublicOverviewPayload {
  events: ClubEvent[];
  projects: StudentProject[];
  stats: {
    totalMembers: number;
    totalHeads: number;
    totalEvents: number;
    totalProjects: number;
    totalRegistrations: number;
  };
  heads: ClubMemberRecord[];
}
