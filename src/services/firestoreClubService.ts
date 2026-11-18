import { User, signInWithPopup, signOut } from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { CLUB_EVENTS, ClubEvent, LEADERSHIP_TEAM, STUDENT_PROJECTS, StudentProject } from '../data/clubData';
import { OperationType, auth, db, googleProvider, handleFirestoreError } from '../firebase';
import {
  AdminDashboardPayload,
  AdminSessionUser,
  AdminUserRecord,
  ClubMemberRecord,
  ContactInquiryItem,
  EventRegistrationItem,
  JoinRequestRecord,
  MemberPortalPayload,
} from '../types/portal';

export const BOOTSTRAP_ADMIN_EMAIL = 'chethanb187@gmail.com';

export function sanitizeUsn(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isBootstrapAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}

function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Checks whether the signed-in Google user holds admin governance access.
 * Checks bootstrap owner email first, then /admins/{uid} and /admins/{email}.
 */
export async function resolveAdminSession(user: User): Promise<AdminSessionUser | null> {
  const email = (user.email || '').trim().toLowerCase();
  const isOwnerEmail = isBootstrapAdminEmail(email);

  const byUidPath = `admins/${user.uid}`;
  try {
    const uidSnap = await getDoc(doc(db, 'admins', user.uid));
    if (uidSnap.exists()) {
      const d = uidSnap.data();
      return {
        id: uidSnap.id,
        role: 'admin',
        name: String(d.name || user.displayName || 'Administrator'),
        email: String(d.email || email),
        designation: (d.designation as AdminSessionUser['designation']) || 'Student Coordinator',
        department: String(d.department || 'Computer Science & Engineering, RIT Hassan'),
      };
    }
  } catch (error) {
    if (!isOwnerEmail) {
      handleFirestoreError(error, OperationType.GET, byUidPath);
    }
  }

  if (email) {
    const byEmailPath = `admins/${email}`;
    try {
      const emailSnap = await getDoc(doc(db, 'admins', email));
      if (emailSnap.exists()) {
        const d = emailSnap.data();
        return {
          id: emailSnap.id,
          role: 'admin',
          name: String(d.name || user.displayName || 'Administrator'),
          email: String(d.email || email),
          designation: (d.designation as AdminSessionUser['designation']) || 'HOD',
          department: String(d.department || 'Computer Science & Engineering, RIT Hassan'),
        };
      }
    } catch (error) {
      if (!isOwnerEmail) {
        handleFirestoreError(error, OperationType.GET, byEmailPath);
      }
    }
  }

  if (isOwnerEmail) {
    const profile: AdminSessionUser = {
      id: user.uid,
      role: 'admin',
      name: user.displayName || 'Chethan B (Project Owner)',
      email,
      designation: 'Student Coordinator',
      department: 'CSE Department · GDG on Campus RIT Hassan',
    };
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        name: profile.name,
        email: profile.email,
        designation: profile.designation,
        department: profile.department,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${user.uid}`);
    }
    return profile;
  }

  return null;
}

/**
 * Resolves an approved club member record by Firebase UID or verified email.
 * Automatically links the Firebase UID on first Google Sign-In.
 */
export async function resolveMemberRecord(user: User): Promise<ClubMemberRecord | null> {
  const email = (user.email || '').trim().toLowerCase();
  try {
    const byUidSnap = await getDocs(
      query(collection(db, 'members'), where('uid', '==', user.uid))
    );
    if (!byUidSnap.empty) {
      const d = byUidSnap.docs[0];
      return mapMemberDoc(d.id, d.data());
    }

    if (email) {
      const byEmailSnap = await getDocs(
        query(collection(db, 'members'), where('email', '==', email))
      );
      if (!byEmailSnap.empty) {
        const d = byEmailSnap.docs[0];
        const member = mapMemberDoc(d.id, d.data());
        if (!member.uid) {
          await updateDoc(doc(db, 'members', d.id), { uid: user.uid });
          member.uid = user.uid;
        }
        return member;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'members');
  }
}

function mapMemberDoc(id: string, d: Record<string, unknown>): ClubMemberRecord {
  return {
    id,
    uid: typeof d.uid === 'string' ? d.uid : undefined,
    name: String(d.name || ''),
    usn: String(d.usn || ''),
    email: String(d.email || ''),
    semester: String(d.semester || ''),
    domain: String(d.domain || ''),
    clubRole: (d.clubRole as ClubMemberRecord['clubRole']) || 'Member',
    joinedAt: String(d.joinedAt || ''),
    attendanceRate: Number(d.attendanceRate ?? 85),
    githubHandle: String(d.githubHandle || ''),
    bio: String(d.bio || ''),
  };
}

function mapEventDoc(id: string, d: Record<string, unknown>): ClubEvent {
  return {
    id,
    title: String(d.title || ''),
    category: (d.category as ClubEvent['category']) || 'Workshop',
    date: String(d.date || ''),
    time: String(d.time || ''),
    venue: String(d.venue || ''),
    seatsTotal: Number(d.seatsTotal ?? 60),
    seatsRemaining: Number(d.seatsRemaining ?? 0),
    coordinator: String(d.coordinator || ''),
    summary: String(d.summary || ''),
    agenda: Array.isArray(d.agenda) ? d.agenda.map(String) : ['Session briefing'],
    featured: typeof d.featured === 'boolean' ? d.featured : undefined,
    image: typeof d.image === 'string' ? d.image : undefined,
  };
}

function mapProjectDoc(id: string, d: Record<string, unknown>): StudentProject {
  return {
    id,
    title: String(d.title || ''),
    domain: (d.domain as StudentProject['domain']) || 'Web & Cloud',
    semester: String(d.semester || ''),
    contributors: String(d.contributors || ''),
    stack: Array.isArray(d.stack) ? d.stack.map(String) : ['TypeScript'],
    summary: String(d.summary || ''),
    architectureNote: String(d.architectureNote || ''),
    impactMetric: String(d.impactMetric || ''),
    repoSlug: String(d.repoSlug || ''),
    featured: typeof d.featured === 'boolean' ? d.featured : undefined,
    image: typeof d.image === 'string' ? d.image : undefined,
  };
}

function mapRegistrationDoc(id: string, d: Record<string, unknown>): EventRegistrationItem {
  return {
    id,
    uid: typeof d.uid === 'string' ? d.uid : undefined,
    eventId: String(d.eventId || ''),
    eventTitle: String(d.eventTitle || ''),
    eventDate: String(d.eventDate || ''),
    eventVenue: String(d.eventVenue || ''),
    studentName: String(d.studentName || ''),
    usn: String(d.usn || ''),
    email: String(d.email || ''),
    semester: String(d.semester || ''),
    track: typeof d.track === 'string' ? d.track : undefined,
    passCode: String(d.passCode || ''),
    checkedIn: Boolean(d.checkedIn),
    createdAt: timestampToIso(d.createdAt),
  };
}

/**
 * Seeds Firestore collections once when an authorized Admin signs in and events/members are empty.
 */
export async function seedFirestoreIfNeeded(adminUid: string): Promise<boolean> {
  try {
    const existingEvents = await getDocs(collection(db, 'events'));
    if (!existingEvents.empty) {
      return false;
    }

    const batch1 = writeBatch(db);

    for (const ev of CLUB_EVENTS) {
      batch1.set(
        doc(db, 'events', ev.id),
        omitUndefined({
          title: ev.title,
          category: ev.category,
          date: ev.date,
          time: ev.time,
          venue: ev.venue,
          seatsTotal: ev.seatsTotal,
          seatsRemaining: ev.seatsRemaining,
          coordinator: ev.coordinator,
          summary: ev.summary,
          agenda: ev.agenda,
          featured: ev.featured,
          image: ev.image,
          createdAt: serverTimestamp(),
        })
      );
    }

    for (const proj of STUDENT_PROJECTS) {
      batch1.set(
        doc(db, 'projects', proj.id),
        omitUndefined({
          uid: adminUid,
          title: proj.title,
          domain: proj.domain,
          semester: proj.semester,
          contributors: proj.contributors,
          stack: proj.stack,
          summary: proj.summary,
          architectureNote: proj.architectureNote,
          impactMetric: proj.impactMetric,
          repoSlug: proj.repoSlug,
          featured: proj.featured,
          image: proj.image,
          createdAt: serverTimestamp(),
        })
      );
    }

    const initialMembers: Omit<ClubMemberRecord, 'id'>[] = [
      {
        name: 'Yashawantha H M',
        usn: '4RA23CS098',
        email: 'yashawantha.hm@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'Web & Cloud',
        clubRole: 'Club Head',
        joinedAt: 'Aug 2024',
        attendanceRate: 98,
        githubHandle: 'Yashawantha26',
        bio: 'Student Coordinator for GDG on Campus – RIT Hassan & full-stack mentor.',
      },
      {
        name: 'Ananya K S',
        usn: '4RA23CS012',
        email: 'ananya.ks@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'Web & Cloud',
        clubRole: 'Domain Lead',
        joinedAt: 'Aug 2024',
        attendanceRate: 95,
        githubHandle: 'ananya-cloud',
        bio: 'Leads Cloud Study Jams, Kubernetes workshops, and CI/CD sprints.',
      },
      {
        name: 'Karthik Gowda R',
        usn: '4RA23CS045',
        email: 'karthik.gowda@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'Systems & IoT',
        clubRole: 'Domain Lead',
        joinedAt: 'Sep 2024',
        attendanceRate: 93,
        githubHandle: 'karthik-sys',
        bio: 'Linux systems mentor and campus open-source maintainer.',
      },
      {
        name: 'Spoorthi M N',
        usn: '4RA24CS081',
        email: 'spoorthi.mn@rithassan.ac.in',
        semester: '5th Semester',
        domain: 'Algorithms & CP',
        clubRole: 'Domain Lead',
        joinedAt: 'Aug 2025',
        attendanceRate: 96,
        githubHandle: 'spoorthi-cp',
        bio: 'Conducts weekly DSA & graph algorithm problem sprints.',
      },
      {
        name: 'Chethan B',
        usn: '4RA24CS024',
        email: 'chethanb187@gmail.com',
        semester: '5th Semester',
        domain: 'Web & Cloud',
        clubRole: 'Member',
        joinedAt: 'Sep 2025',
        attendanceRate: 91,
        githubHandle: 'chethan-rit',
        bio: 'Building CampusPass & Three.js interactive web tools.',
      },
      {
        name: 'Pranav H',
        usn: '4RA23CS067',
        email: 'pranav.h@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'AI & ML',
        clubRole: 'Member',
        joinedAt: 'Aug 2024',
        attendanceRate: 89,
        githubHandle: 'pranav-ml',
        bio: 'Edge vision & TensorFlow Lite agricultural tools.',
      },
      {
        name: 'Meghana V',
        usn: '4RA23CS052',
        email: 'meghana.v@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'AI & ML',
        clubRole: 'Member',
        joinedAt: 'Aug 2024',
        attendanceRate: 92,
        githubHandle: 'meghana-ai',
        bio: 'Applied NLP & regional crop advisory datasets.',
      },
      {
        name: 'Nischitha S',
        usn: '4RA24CS059',
        email: 'nischitha.s@rithassan.ac.in',
        semester: '5th Semester',
        domain: 'Web & Cloud',
        clubRole: 'Member',
        joinedAt: 'Sep 2025',
        attendanceRate: 88,
        githubHandle: 'nischitha-dev',
        bio: 'Co-creator of LibVault VTU question & lab archive.',
      },
      {
        name: 'Darshan Shetty B',
        usn: '4RA25CS019',
        email: 'darshan.sb@rithassan.ac.in',
        semester: '3rd Semester',
        domain: 'Web & Cloud',
        clubRole: 'Member',
        joinedAt: 'Aug 2026',
        attendanceRate: 87,
        githubHandle: 'darshan-oss',
        bio: 'Coordinates Git workflow & first-PR onboarding.',
      },
      {
        name: 'Tejaswini R',
        usn: '4RA25CS088',
        email: 'tejaswini.r@rithassan.ac.in',
        semester: '3rd Semester',
        domain: 'Systems & IoT',
        clubRole: 'Member',
        joinedAt: 'Aug 2026',
        attendanceRate: 90,
        githubHandle: 'tejaswini-cpp',
        bio: 'Working on CodeJudge sandbox test runners.',
      },
    ];

    initialMembers.forEach((m, idx) => {
      const memId = `mem-seed-${idx + 1}`;
      batch1.set(doc(db, 'members', memId), {
        ...m,
        createdAt: serverTimestamp(),
      });
      if (m.clubRole === 'Club Head' || m.clubRole === 'Domain Lead') {
        batch1.set(doc(db, 'clubHeads', memId), {
          name: m.name,
          semester: m.semester,
          domain: m.domain,
          clubRole: m.clubRole,
          updatedAt: serverTimestamp(),
        });
      }
    });

    const initialRequests = [
      {
        id: 'req-seed-1',
        uid: adminUid,
        name: 'Aishwarya P',
        usn: '4RA25CS004',
        email: 'aishwarya.p@rithassan.ac.in',
        semester: '3rd Semester',
        domain: 'AI & ML',
        statement:
          'Built a Python attendance parser in 2nd semester and want to join the Applied ML lab cohort.',
        status: 'pending',
        submittedAt: 'Nov 10, 2026',
      },
      {
        id: 'req-seed-2',
        uid: adminUid,
        name: 'Rohan Kulkarni',
        usn: '4RA24CS071',
        email: 'rohan.k@rithassan.ac.in',
        semester: '5th Semester',
        domain: 'Web & Cloud',
        statement:
          'Active TypeScript contributor looking to volunteer for CODESTORM 2026 web operations.',
        status: 'pending',
        submittedAt: 'Nov 11, 2026',
      },
      {
        id: 'req-seed-3',
        uid: adminUid,
        name: 'Shreya Hegde',
        usn: '4RA26CS033',
        email: 'shreya.h@rithassan.ac.in',
        semester: '1st Semester',
        domain: 'Algorithms & CP',
        statement:
          'Eager to participate in weekly DSA sessions and learn collaborative Git workflows.',
        status: 'pending',
        submittedAt: 'Nov 12, 2026',
      },
    ];

    for (const r of initialRequests) {
      batch1.set(doc(db, 'joinRequests', r.id), {
        uid: r.uid,
        name: r.name,
        usn: r.usn,
        email: r.email,
        semester: r.semester,
        domain: r.domain,
        statement: r.statement,
        status: r.status,
        submittedAt: r.submittedAt,
        createdAt: serverTimestamp(),
      });
    }

    batch1.set(doc(db, 'inquiries', 'inq-seed-1'), {
      uid: adminUid,
      referenceId: 'INQ-4821',
      name: 'Prof. Raghavendra S',
      email: 'raghavendra.cse@rithassan.ac.in',
      usn: 'FACULTY-CSE',
      topic: 'CODESTORM 2026 Query',
      message:
        'Please share final lab workstation allocation list for Block B ahead of CODESTORM kickoff.',
      status: 'open',
      createdAt: serverTimestamp(),
    });

    batch1.set(doc(db, 'meta', 'clubStats'), {
      totalMembers: initialMembers.length,
      totalHeads: 4,
      totalEvents: CLUB_EVENTS.length,
      totalRegistrations: 4,
      updatedAt: serverTimestamp(),
    });

    await batch1.commit();

    // Commit sample registrations in second batch so /events/{id} exists in DB rules
    const batch2 = writeBatch(db);
    const sampleRegs = [
      {
        id: 'reg-seed-1',
        eventId: 'codestorm-2026-nov',
        eventTitle: 'CODESTORM 2026 – November Edition',
        eventDate: 'Nov 22, 2026',
        eventVenue: 'RIT Main Auditorium & CSE Labs',
        studentName: 'Chethan B',
        usn: '4RA24CS024',
        email: 'chethanb187@gmail.com',
        semester: '5th Semester',
        track: 'Web & Cloud',
        passCode: 'RIT-9012',
        checkedIn: true,
      },
      {
        id: 'reg-seed-2',
        eventId: 'codestorm-2026-nov',
        eventTitle: 'CODESTORM 2026 – November Edition',
        eventDate: 'Nov 22, 2026',
        eventVenue: 'RIT Main Auditorium & CSE Labs',
        studentName: 'Pranav H',
        usn: '4RA23CS067',
        email: 'pranav.h@rithassan.ac.in',
        semester: '7th Semester',
        track: 'AI & ML',
        passCode: 'RIT-9045',
        checkedIn: false,
      },
      {
        id: 'reg-seed-3',
        eventId: 'cloud-study-jam-k8s',
        eventTitle: 'Google Cloud Study Jam: Containers & Gemini APIs',
        eventDate: 'Nov 28, 2026',
        eventVenue: 'CSE Seminar Hall, Academic Block B',
        studentName: 'Nischitha S',
        usn: '4RA24CS059',
        email: 'nischitha.s@rithassan.ac.in',
        semester: '5th Semester',
        track: 'Web & Cloud',
        passCode: 'RIT-9103',
        checkedIn: false,
      },
      {
        id: 'reg-seed-4',
        eventId: 'systems-linux-primer',
        eventTitle: 'Systems Engineering & Linux Internals Workshop',
        eventDate: 'Dec 05, 2026',
        eventVenue: 'CSE Systems Lab 204',
        studentName: 'Tejaswini R',
        usn: '4RA25CS088',
        email: 'tejaswini.r@rithassan.ac.in',
        semester: '3rd Semester',
        track: 'Systems & IoT',
        passCode: 'RIT-9148',
        checkedIn: false,
      },
    ];

    for (const reg of sampleRegs) {
      batch2.set(doc(db, 'registrations', reg.id), {
        uid: adminUid,
        eventId: reg.eventId,
        eventTitle: reg.eventTitle,
        eventDate: reg.eventDate,
        eventVenue: reg.eventVenue,
        studentName: reg.studentName,
        usn: reg.usn,
        email: reg.email,
        semester: reg.semester,
        track: reg.track,
        passCode: reg.passCode,
        checkedIn: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch2.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}

/**
 * Real-time public subscriptions for Events, Projects, ClubHeads, and Stats.
 */
export function subscribePublicOverview(callbacks: {
  onEvents: (events: ClubEvent[]) => void;
  onProjects: (projects: StudentProject[]) => void;
  onStats: (stats: {
    totalMembers: number;
    totalHeads: number;
    totalEvents: number;
    totalRegistrations: number;
  }) => void;
}): () => void {
  const unsubEvents = onSnapshot(
    collection(db, 'events'),
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => mapEventDoc(d.id, d.data()));
        // Keep CODESTORM 2026 first when present
        list.sort((a, b) => {
          if (a.id === 'codestorm-2026-nov') return -1;
          if (b.id === 'codestorm-2026-nov') return 1;
          return a.title.localeCompare(b.title);
        });
        callbacks.onEvents(list);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    }
  );

  const unsubProjects = onSnapshot(
    collection(db, 'projects'),
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => mapProjectDoc(d.id, d.data()));
        list.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.title.localeCompare(b.title);
        });
        callbacks.onProjects(list);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    }
  );

  const unsubStats = onSnapshot(
    doc(db, 'meta', 'clubStats'),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        callbacks.onStats({
          totalMembers: Number(d.totalMembers ?? 10),
          totalHeads: Number(d.totalHeads ?? LEADERSHIP_TEAM.length),
          totalEvents: Number(d.totalEvents ?? CLUB_EVENTS.length),
          totalRegistrations: Number(d.totalRegistrations ?? 4),
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'meta/clubStats');
    }
  );

  return () => {
    unsubEvents();
    unsubProjects();
    unsubStats();
  };
}

export function subscribeUserRegistrations(
  uid: string,
  onChange: (items: EventRegistrationItem[]) => void
): () => void {
  return onSnapshot(
    query(collection(db, 'registrations'), where('uid', '==', uid)),
    (snap) => {
      onChange(snap.docs.map((d) => mapRegistrationDoc(d.id, d.data())));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'registrations');
    }
  );
}

/**
 * Recomputes and stores aggregate stats in /meta/clubStats (Admin only).
 */
export async function syncClubStatsFromCounts(counts: {
  totalMembers: number;
  totalHeads: number;
  totalEvents: number;
  totalRegistrations: number;
}): Promise<void> {
  try {
    await setDoc(doc(db, 'meta', 'clubStats'), {
      totalMembers: counts.totalMembers,
      totalHeads: counts.totalHeads,
      totalEvents: counts.totalEvents,
      totalRegistrations: counts.totalRegistrations,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'meta/clubStats');
  }
}

export async function fetchAdminDashboard(): Promise<AdminDashboardPayload> {
  try {
    const [adminsSnap, membersSnap, reqSnap, regSnap, evtSnap, inqSnap] = await Promise.all([
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'members')),
      getDocs(collection(db, 'joinRequests')),
      getDocs(collection(db, 'registrations')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'inquiries')),
    ]);

    const admins: AdminUserRecord[] = adminsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: String(data.uid || d.id),
        name: String(data.name || ''),
        email: String(data.email || ''),
        designation: (data.designation as AdminUserRecord['designation']) || 'Student Coordinator',
        department: String(data.department || ''),
      };
    });

    const members = membersSnap.docs.map((d) => mapMemberDoc(d.id, d.data()));
    const joinRequests: JoinRequestRecord[] = reqSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: typeof data.uid === 'string' ? data.uid : undefined,
        name: String(data.name || ''),
        usn: String(data.usn || ''),
        email: String(data.email || ''),
        semester: String(data.semester || ''),
        domain: String(data.domain || ''),
        statement: String(data.statement || ''),
        status: (data.status as JoinRequestRecord['status']) || 'pending',
        submittedAt: String(data.submittedAt || ''),
        reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : undefined,
      };
    });
    const registrations = regSnap.docs.map((d) => mapRegistrationDoc(d.id, d.data()));
    const events = evtSnap.docs.map((d) => mapEventDoc(d.id, d.data()));
    const inquiries: ContactInquiryItem[] = inqSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: typeof data.uid === 'string' ? data.uid : undefined,
        referenceId: String(data.referenceId || ''),
        name: String(data.name || ''),
        email: String(data.email || ''),
        usn: String(data.usn || ''),
        topic: String(data.topic || ''),
        message: String(data.message || ''),
        status: (data.status as ContactInquiryItem['status']) || 'open',
        createdAt: timestampToIso(data.createdAt),
      };
    });

    const semesterBreakdown: Record<string, number> = {};
    const domainBreakdown: Record<string, number> = {};
    for (const m of members) {
      semesterBreakdown[m.semester] = (semesterBreakdown[m.semester] || 0) + 1;
      domainBreakdown[m.domain] = (domainBreakdown[m.domain] || 0) + 1;
    }

    const headsCount = members.filter(
      (m) => m.clubRole === 'Club Head' || m.clubRole === 'Domain Lead'
    ).length;

    return {
      summary: {
        totalMembers: members.length,
        headsCount,
        pendingRequestsCount: joinRequests.filter((r) => r.status === 'pending').length,
        totalRegistrations: registrations.length,
        openInquiriesCount: inquiries.filter((i) => i.status === 'open').length,
        semesterBreakdown,
        domainBreakdown,
      },
      admins,
      members,
      joinRequests,
      registrations,
      events,
      inquiries,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin-dashboard');
  }
}

export async function approveOrRejectJoinRequest(
  req: JoinRequestRecord,
  decision: 'approved' | 'rejected',
  reviewerName: string,
  currentStats: { totalMembers: number; totalHeads: number; totalEvents: number; totalRegistrations: number }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'joinRequests', req.id), {
      status: decision,
      reviewedBy: reviewerName,
    });

    if (decision === 'approved') {
      const memberId = `mem-${Date.now()}`;
      await setDoc(
        doc(db, 'members', memberId),
        omitUndefined({
          uid: req.uid,
          name: req.name,
          usn: sanitizeUsn(req.usn),
          email: req.email.trim().toLowerCase(),
          semester: req.semester,
          domain: req.domain,
          clubRole: 'Member',
          joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          attendanceRate: 100,
          githubHandle: '',
          bio: req.statement.slice(0, 280),
          createdAt: serverTimestamp(),
        })
      );

      await syncClubStatsFromCounts({
        ...currentStats,
        totalMembers: currentStats.totalMembers + 1,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `joinRequests/${req.id}`);
  }
}

export async function addMemberDirectly(
  input: {
    name: string;
    usn: string;
    email: string;
    semester: string;
    domain: string;
    clubRole: ClubMemberRecord['clubRole'];
  },
  currentStats: { totalMembers: number; totalHeads: number; totalEvents: number; totalRegistrations: number }
): Promise<void> {
  const memberId = `mem-${Date.now()}`;
  const cleanUsn = sanitizeUsn(input.usn);
  if (cleanUsn.length < 4) {
    throw new Error('USN must contain at least 4 alphanumeric characters.');
  }

  try {
    await setDoc(doc(db, 'members', memberId), {
      name: input.name.trim(),
      usn: cleanUsn,
      email: input.email.trim().toLowerCase(),
      semester: input.semester,
      domain: input.domain,
      clubRole: input.clubRole,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      attendanceRate: 100,
      githubHandle: '',
      bio: 'Added directly via Department Admin Console.',
      createdAt: serverTimestamp(),
    });

    const isHead = input.clubRole === 'Club Head' || input.clubRole === 'Domain Lead';
    if (isHead) {
      await setDoc(doc(db, 'clubHeads', memberId), {
        name: input.name.trim(),
        semester: input.semester,
        domain: input.domain,
        clubRole: input.clubRole,
        updatedAt: serverTimestamp(),
      });
    }

    await syncClubStatsFromCounts({
      ...currentStats,
      totalMembers: currentStats.totalMembers + 1,
      totalHeads: isHead ? currentStats.totalHeads + 1 : currentStats.totalHeads,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `members/${memberId}`);
  }
}

export async function updateMemberRoleInFirestore(
  member: ClubMemberRecord,
  newRole: ClubMemberRecord['clubRole'],
  currentStats: { totalMembers: number; totalHeads: number; totalEvents: number; totalRegistrations: number }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'members', member.id), { clubRole: newRole });

    const wasHead = member.clubRole === 'Club Head' || member.clubRole === 'Domain Lead';
    const isNowHead = newRole === 'Club Head' || newRole === 'Domain Lead';

    if (isNowHead) {
      await setDoc(doc(db, 'clubHeads', member.id), {
        name: member.name,
        semester: member.semester,
        domain: member.domain,
        clubRole: newRole,
        updatedAt: serverTimestamp(),
      });
    } else if (wasHead) {
      await deleteDoc(doc(db, 'clubHeads', member.id));
    }

    if (wasHead !== isNowHead) {
      await syncClubStatsFromCounts({
        ...currentStats,
        totalHeads: Math.max(0, currentStats.totalHeads + (isNowHead ? 1 : -1)),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `members/${member.id}`);
  }
}

export async function removeMemberFromFirestore(
  member: ClubMemberRecord,
  currentStats: { totalMembers: number; totalHeads: number; totalEvents: number; totalRegistrations: number }
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'members', member.id));
    const wasHead = member.clubRole === 'Club Head' || member.clubRole === 'Domain Lead';
    if (wasHead) {
      await deleteDoc(doc(db, 'clubHeads', member.id));
    }
    await syncClubStatsFromCounts({
      ...currentStats,
      totalMembers: Math.max(0, currentStats.totalMembers - 1),
      totalHeads: wasHead ? Math.max(0, currentStats.totalHeads - 1) : currentStats.totalHeads,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `members/${member.id}`);
  }
}

export async function authorizeAdminEmail(input: {
  name: string;
  email: string;
  designation: AdminUserRecord['designation'];
  department: string;
}): Promise<void> {
  const cleanEmail = input.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid Google email address.');
  }
  try {
    await setDoc(doc(db, 'admins', cleanEmail), {
      uid: cleanEmail,
      name: input.name.trim(),
      email: cleanEmail,
      designation: input.designation,
      department: input.department.trim() || 'Computer Science & Engineering, RIT Hassan',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `admins/${cleanEmail}`);
  }
}

export async function toggleCheckinInFirestore(reg: EventRegistrationItem): Promise<void> {
  try {
    await updateDoc(doc(db, 'registrations', reg.id), {
      checkedIn: !reg.checkedIn,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `registrations/${reg.id}`);
  }
}

export async function createEventInFirestore(
  input: {
    title: string;
    category: ClubEvent['category'];
    date: string;
    venue: string;
    seatsTotal: number;
    summary: string;
    coordinator: string;
  },
  currentStats: { totalMembers: number; totalHeads: number; totalEvents: number; totalRegistrations: number }
): Promise<void> {
  const evtId = `evt-${Date.now()}`;
  const seats = Math.max(10, Math.min(5000, Number(input.seatsTotal) || 60));
  try {
    await setDoc(doc(db, 'events', evtId), {
      title: input.title.trim(),
      category: input.category,
      date: input.date.trim(),
      time: '02:00 PM – 04:30 PM',
      venue: input.venue.trim(),
      seatsTotal: seats,
      seatsRemaining: seats,
      coordinator: input.coordinator.trim() || 'CSE Coordinator',
      summary:
        input.summary.trim().length >= 10
          ? input.summary.trim()
          : 'Technical workshop & hands-on session organized by GDG on Campus – RIT Hassan.',
      agenda: [
        'Session briefing & technical walkthrough',
        'Guided lab implementation & live Q&A',
      ],
      featured: false,
      createdAt: serverTimestamp(),
    });

    await syncClubStatsFromCounts({
      ...currentStats,
      totalEvents: currentStats.totalEvents + 1,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `events/${evtId}`);
  }
}

export async function toggleInquiryStatusInFirestore(inq: ContactInquiryItem): Promise<void> {
  try {
    await updateDoc(doc(db, 'inquiries', inq.id), {
      status: inq.status === 'open' ? 'reviewed' : 'open',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `inquiries/${inq.id}`);
  }
}

export async function submitJoinRequestToFirestore(
  uid: string,
  input: {
    name: string;
    usn: string;
    email: string;
    semester: string;
    domain: string;
    statement: string;
  }
): Promise<JoinRequestRecord> {
  const reqId = `req-${Date.now()}`;
  const cleanUsn = sanitizeUsn(input.usn);
  if (cleanUsn.length < 4) {
    throw new Error('USN must contain at least 4 alphanumeric characters.');
  }
  const submittedAt = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  try {
    await setDoc(doc(db, 'joinRequests', reqId), {
      uid,
      name: input.name.trim(),
      usn: cleanUsn,
      email: input.email.trim().toLowerCase(),
      semester: input.semester,
      domain: input.domain,
      statement: input.statement.trim(),
      status: 'pending',
      submittedAt,
      createdAt: serverTimestamp(),
    });
    return {
      id: reqId,
      uid,
      name: input.name.trim(),
      usn: cleanUsn,
      email: input.email.trim().toLowerCase(),
      semester: input.semester,
      domain: input.domain,
      statement: input.statement.trim(),
      status: 'pending',
      submittedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `joinRequests/${reqId}`);
  }
}

export async function registerForEventInFirestore(
  uid: string,
  event: ClubEvent,
  input: {
    studentName: string;
    usn: string;
    email: string;
    semester: string;
    track?: string;
  }
): Promise<EventRegistrationItem> {
  const regId = `reg-${Date.now()}`;
  const passCode = `RIT-${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanUsn = sanitizeUsn(input.usn);
  if (cleanUsn.length < 4) {
    throw new Error('Please enter a valid USN or student ID (4+ alphanumeric characters).');
  }

  try {
    const evtRef = doc(db, 'events', event.id);
    const evtSnap = await getDoc(evtRef);
    if (!evtSnap.exists()) {
      throw new Error(
        'The Firestore event catalog is not initialized yet. An Admin (Principal/HOD/Coordinator) must sign in once to seed initial events.'
      );
    }
    const currentRemaining = Number(evtSnap.data().seatsRemaining ?? 0);
    if (currentRemaining <= 0) {
      throw new Error('Sorry, no seats remain for this event.');
    }

    await setDoc(
      doc(db, 'registrations', regId),
      omitUndefined({
        uid,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventVenue: event.venue,
        studentName: input.studentName.trim(),
        usn: cleanUsn,
        email: input.email.trim().toLowerCase(),
        semester: input.semester,
        track: input.track,
        passCode,
        checkedIn: false,
        createdAt: serverTimestamp(),
      })
    );

    await updateDoc(evtRef, {
      seatsRemaining: currentRemaining - 1,
    });

    const statsRef = doc(db, 'meta', 'clubStats');
    const statsSnap = await getDoc(statsRef);
    if (statsSnap.exists()) {
      const currentTotal = Number(statsSnap.data().totalRegistrations ?? 0);
      await updateDoc(statsRef, {
        totalRegistrations: currentTotal + 1,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      id: regId,
      uid,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventVenue: event.venue,
      studentName: input.studentName.trim(),
      usn: cleanUsn,
      email: input.email.trim().toLowerCase(),
      semester: input.semester,
      track: input.track,
      passCode,
      checkedIn: false,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Firestore event catalog')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `registrations/${regId}`);
  }
}

export async function cancelRegistrationInFirestore(
  reg: EventRegistrationItem
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'registrations', reg.id));

    const evtRef = doc(db, 'events', reg.eventId);
    const evtSnap = await getDoc(evtRef);
    if (evtSnap.exists()) {
      const total = Number(evtSnap.data().seatsTotal ?? 100);
      const remaining = Number(evtSnap.data().seatsRemaining ?? 0);
      if (remaining < total) {
        await updateDoc(evtRef, { seatsRemaining: remaining + 1 });
      }
    }

    const statsRef = doc(db, 'meta', 'clubStats');
    const statsSnap = await getDoc(statsRef);
    if (statsSnap.exists()) {
      const currentTotal = Number(statsSnap.data().totalRegistrations ?? 0);
      if (currentTotal > 0) {
        await updateDoc(statsRef, {
          totalRegistrations: currentTotal - 1,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `registrations/${reg.id}`);
  }
}

export async function publishProjectToFirestore(
  uid: string,
  project: StudentProject
): Promise<void> {
  const projId = project.id || `proj-${Date.now()}`;
  try {
    await setDoc(
      doc(db, 'projects', projId),
      omitUndefined({
        uid,
        title: project.title.trim(),
        domain: project.domain,
        semester: project.semester.trim() || 'CSE Dept',
        contributors: project.contributors.trim(),
        stack: project.stack.length > 0 ? project.stack : ['TypeScript'],
        summary: project.summary.trim(),
        architectureNote: project.architectureNote,
        impactMetric: project.impactMetric,
        repoSlug: project.repoSlug,
        featured: false,
        createdAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projId}`);
  }
}

export async function submitInquiryToFirestore(
  uid: string,
  input: {
    name: string;
    email: string;
    usn?: string;
    topic: string;
    message: string;
  }
): Promise<ContactInquiryItem> {
  const inqId = `inq-${Date.now()}`;
  const referenceId = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const safeUsn = (input.usn?.trim() || '').slice(0, 20);
  try {
    await setDoc(
      doc(db, 'inquiries', inqId),
      omitUndefined({
        uid,
        referenceId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        usn: safeUsn,
        topic: input.topic,
        message: input.message.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
      })
    );
    return {
      id: inqId,
      uid,
      referenceId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      usn: safeUsn,
      topic: input.topic,
      message: input.message.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `inquiries/${inqId}`);
  }
}

export async function fetchMemberPortalPayload(
  member: ClubMemberRecord,
  uid: string
): Promise<MemberPortalPayload> {
  try {
    const [regsSnap, headsSnap, statsSnap] = await Promise.all([
      getDocs(query(collection(db, 'registrations'), where('uid', '==', uid))),
      getDocs(collection(db, 'clubHeads')),
      getDoc(doc(db, 'meta', 'clubStats')),
    ]);

    const registrations = regsSnap.docs.map((d) => mapRegistrationDoc(d.id, d.data()));
    const heads: ClubMemberRecord[] = headsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name || ''),
        usn: '',
        email: '',
        semester: String(data.semester || ''),
        domain: String(data.domain || ''),
        clubRole: (data.clubRole as ClubMemberRecord['clubRole']) || 'Domain Lead',
        joinedAt: '',
        attendanceRate: 100,
        githubHandle: '',
        bio: '',
      };
    });

    const totalClubStudents = statsSnap.exists()
      ? Number(statsSnap.data().totalMembers ?? 10)
      : 10;

    return {
      member,
      registrations,
      heads,
      totalClubStudents,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `members/${member.id}`);
  }
}

export async function updateMyMemberProfile(
  memberId: string,
  updates: {
    domain: string;
    semester: string;
    githubHandle: string;
    bio: string;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'members', memberId), {
      domain: updates.domain,
      semester: updates.semester,
      githubHandle: updates.githubHandle.trim(),
      bio: updates.bio.trim(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `members/${memberId}`);
  }
}
