import { useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { AboutSection } from './components/AboutSection';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { ContactSection } from './components/ContactSection';
import { EventsSection } from './components/EventsSection';
import { FeaturesSection } from './components/FeaturesSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { MemberPortalModal } from './components/MemberPortalModal';
import { Navbar } from './components/Navbar';
import { AuthModalTab, PortalAuthModal } from './components/PortalAuthModal';
import { ProjectsSection } from './components/ProjectsSection';
import { RegistrationModal } from './components/RegistrationModal';
import { CLUB_EVENTS, ClubEvent, STUDENT_PROJECTS, StudentProject } from './data/clubData';
import { auth } from './firebase';
import {
  cancelRegistrationInFirestore,
  publishProjectToFirestore,
  resolveAdminSession,
  resolveMemberRecord,
  seedFirestoreIfNeeded,
  signInWithGoogle,
  signOutUser,
  subscribePublicOverview,
  subscribeUserRegistrations,
} from './services/firestoreClubService';
import { AuthUser, ClubMemberRecord, EventRegistrationItem } from './types/portal';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('rit_cse_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignore storage errors
    }
    return 'light';
  });

  // Live Firestore public collections (initialized with static catalog until seeded)
  const [events, setEvents] = useState<ClubEvent[]>(CLUB_EVENTS);
  const [projects, setProjects] = useState<StudentProject[]>(STUDENT_PROJECTS);
  const [liveStats, setLiveStats] = useState({
    totalMembers: 10,
    totalHeads: 4,
    totalEvents: CLUB_EVENTS.length,
    totalRegistrations: 4,
  });

  // Firebase Auth state + Role resolution
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Participant passes synced to Firestore for signed-in user
  const [myPasses, setMyPasses] = useState<EventRegistrationItem[]>([]);

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('admin');
  const [adminConsoleOpen, setAdminConsoleOpen] = useState(false);
  const [memberPortalOpen, setMemberPortalOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [showAllPasses, setShowAllPasses] = useState(false);

  // Subscribe to public Firestore collections (events, projects, meta/clubStats)
  useEffect(() => {
    const unsubscribe = subscribePublicOverview({
      onEvents: (list) => setEvents(list),
      onProjects: (list) => setProjects(list),
      onStats: (stats) => setLiveStats(stats),
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAuthUser(null);
        setMyPasses([]);
        return;
      }

      try {
        const adminSession = await resolveAdminSession(user);
        if (adminSession) {
          setAuthUser(adminSession);
          await seedFirestoreIfNeeded(user.uid);
          return;
        }
        const memberRecord = await resolveMemberRecord(user);
        if (memberRecord) {
          setAuthUser({
            id: memberRecord.id,
            uid: memberRecord.uid || user.uid,
            role: 'member',
            name: memberRecord.name,
            usn: memberRecord.usn,
            email: memberRecord.email,
            semester: memberRecord.semester,
            domain: memberRecord.domain,
            clubRole: memberRecord.clubRole,
            joinedAt: memberRecord.joinedAt,
            attendanceRate: memberRecord.attendanceRate,
            githubHandle: memberRecord.githubHandle,
            bio: memberRecord.bio,
          });
          return;
        }
        setAuthUser(null);
      } catch {
        setAuthUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to signed-in user's Firestore event passes
  useEffect(() => {
    if (!firebaseUser) {
      setMyPasses([]);
      return;
    }
    const unsubscribe = subscribeUserRegistrations(firebaseUser.uid, (items) => {
      setMyPasses(items);
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('rit_cse_theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const registeredEventIds = useMemo(() => myPasses.map((r) => r.eventId), [myPasses]);

  const featuredCodestorm = events[0] || CLUB_EVENTS[0];

  const handleOpenAuthTab = (tab: AuthModalTab) => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleOpenWorkspace = () => {
    if (!authUser) {
      handleOpenAuthTab('admin');
      return;
    }
    if (authUser.role === 'admin') {
      setAdminConsoleOpen(true);
    } else {
      setMemberPortalOpen(true);
    }
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setAuthModalOpen(false);
    if (user.role === 'admin') {
      setAdminConsoleOpen(true);
    } else {
      setMemberPortalOpen(true);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setAuthUser(null);
    setAdminConsoleOpen(false);
    setMemberPortalOpen(false);
  };

  const handleRegistered = (registration: EventRegistrationItem) => {
    setMyPasses((prev) => [
      ...prev.filter((item) => item.eventId !== registration.eventId),
      registration,
    ]);
  };

  const handleCancelRegistration = async (registration: EventRegistrationItem) => {
    await cancelRegistrationInFirestore(registration);
    setMyPasses((prev) => prev.filter((item) => item.id !== registration.id));
  };

  const handleAddProject = async (project: StudentProject) => {
    const user = firebaseUser ?? (await signInWithGoogle());
    await publishProjectToFirestore(user.uid, project);
  };

  const handleMemberProfileUpdated = (updated: ClubMemberRecord) => {
    setAuthUser((prev) =>
      prev && prev.role === 'member'
        ? {
            ...prev,
            domain: updated.domain,
            semester: updated.semester,
            githubHandle: updated.githubHandle,
            bio: updated.bio,
          }
        : prev
    );
  };

  const activeExistingRegistration = selectedEvent
    ? myPasses.find((r) => r.eventId === selectedEvent.id)
    : undefined;

  const navbarPrimaryLabel = authUser
    ? authUser.role === 'admin'
      ? 'Admin Console'
      : 'Member Portal'
    : 'Portal Login';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100">
      <Navbar
        primaryLabel={navbarPrimaryLabel}
        onPrimaryAction={() => {
          if (authUser) {
            handleOpenWorkspace();
          } else {
            handleOpenAuthTab('admin');
          }
        }}
      />

      <main>
        <HeroSection
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onRegisterCodestorm={() => {
            setShowAllPasses(false);
            setSelectedEvent(featuredCodestorm);
          }}
          onOpenMyPasses={() => {
            setSelectedEvent(null);
            setShowAllPasses(true);
          }}
          registeredCount={myPasses.length}
          authUser={authUser}
          onOpenAuthTab={handleOpenAuthTab}
          onOpenWorkspace={handleOpenWorkspace}
          liveStats={liveStats}
        />

        <AboutSection />

        <EventsSection
          events={events}
          registeredEventIds={registeredEventIds}
          onSelectEventForRegistration={(ev) => {
            setShowAllPasses(false);
            setSelectedEvent(ev);
          }}
        />

        <ProjectsSection projects={projects} onAddProject={handleAddProject} />

        <FeaturesSection
          onJumpToEvents={() => {
            document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <ContactSection onOpenJoinApplication={() => handleOpenAuthTab('join')} />
      </main>

      <Footer />

      {/* Participant Event Registration & Passes Modal */}
      <RegistrationModal
        event={selectedEvent}
        existingRegistration={activeExistingRegistration}
        allRegistrations={myPasses}
        showAllPasses={showAllPasses}
        authUser={authUser}
        firebaseUser={firebaseUser}
        onClose={() => {
          setSelectedEvent(null);
          setShowAllPasses(false);
        }}
        onRegistered={handleRegistered}
        onCancelRegistration={handleCancelRegistration}
      />

      {/* Separate Admin / Member Firebase Auth & Join Request Modal */}
      <PortalAuthModal
        open={authModalOpen}
        initialTab={authModalTab}
        firebaseUser={firebaseUser}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Admin Governance Dashboard (Principal / HOD / Coordinator) */}
      {authUser?.role === 'admin' && (
        <AdminDashboardModal
          open={adminConsoleOpen}
          adminUser={authUser}
          onClose={() => setAdminConsoleOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Student Member Profile & Passes Portal */}
      {authUser?.role === 'member' && firebaseUser && (
        <MemberPortalModal
          open={memberPortalOpen}
          memberUser={authUser}
          firebaseUid={firebaseUser.uid}
          onClose={() => setMemberPortalOpen(false)}
          onLogout={handleLogout}
          onProfileUpdated={handleMemberProfileUpdated}
        />
      )}
    </div>
  );
}
