export type EventContentCategory = 'Hackathon' | 'Workshop' | 'Study Jam' | 'Tech Talk';
export type EventCategory = 'All' | EventContentCategory;
export type ProjectContentDomain = 'AI & ML' | 'Web & Cloud' | 'Systems & IoT' | 'Campus Tools';
export type ProjectDomain = 'All' | ProjectContentDomain;

export interface ClubEvent {
  id: string;
  title: string;
  category: EventContentCategory;
  date: string;
  time: string;
  venue: string;
  seatsTotal: number;
  seatsRemaining: number;
  coordinator: string;
  summary: string;
  agenda: string[];
  featured?: boolean;
  image?: string;
}

export interface StudentProject {
  id: string;
  title: string;
  domain: ProjectContentDomain;
  semester: string;
  contributors: string;
  stack: string[];
  summary: string;
  architectureNote: string;
  impactMetric: string;
  repoSlug: string;
  featured?: boolean;
  image?: string;
}

export interface LeadershipMember {
  name: string;
  role: string;
  affiliation: string;
}

export interface StudyTrack {
  id: string;
  title: string;
  lead: string;
  schedule: string;
  focus: string;
  modules: string[];
}

export interface MentorshipSlot {
  id: string;
  topic: string;
  day: string;
  time: string;
  mentor: string;
}

export interface ResourceVaultItem {
  id: string;
  category: string;
  format: string;
  updated: string;
  title: string;
  description: string;
  outline: string[];
}

export const CAMPUS_IMAGE = '/src/assets/images/campus_rit_quad_1794977424872.jpg';
export const HERO_IMAGE = '/src/assets/images/hero_cse_lab_1794977423458.jpg';

export const LEADERSHIP_TEAM: LeadershipMember[] = [
  { name: 'Dr. Mahesh Rao', role: 'Principal', affiliation: 'Rajeev Institute of Technology, Hassan' },
  { name: 'Dr. Kavitha R', role: 'CSE HOD', affiliation: 'Department of Computer Science & Engineering' },
  { name: 'Prof. Nisha H V', role: 'Faculty Advisor', affiliation: 'GDG on Campus – RIT Hassan' },
  { name: 'Yashawantha H M', role: 'Student Coordinator', affiliation: 'CSE Department & GDG on Campus' },
];

export const CLUB_EVENTS: ClubEvent[] = [
  {
    id: 'codestorm-2026-nov',
    title: 'CODESTORM 2026 – November Edition',
    category: 'Hackathon',
    date: 'Nov 22, 2026',
    time: '09:00 AM – 06:00 PM',
    venue: 'RIT Main Auditorium & CSE Labs',
    seatsTotal: 160,
    seatsRemaining: 157,
    coordinator: 'Yashawantha H M',
    summary: 'Flagship web engineering and problem-solving challenge organized by GDG on Campus – RIT Hassan and the Department of Computer Science & Engineering.',
    agenda: ['09:00 AM — Opening briefing & problem track release', '10:00 AM — Design & full-stack prototyping sprint', '02:30 PM — Faculty & industry mentor checkpoints', '04:30 PM — Live product demos & jury evaluation'],
    featured: true,
    image: '/src/assets/images/event_codestorm_hackathon_1794977423813.jpg',
  },
  {
    id: 'cloud-study-jam-k8s', title: 'Google Cloud Study Jam: Containers & Gemini APIs', category: 'Study Jam', date: 'Nov 28, 2026', time: '02:00 PM – 05:00 PM', venue: 'CSE Seminar Hall, Academic Block B', seatsTotal: 80, seatsRemaining: 79, coordinator: 'Ananya K S',
    summary: 'Hands-on lab covering Cloud Run deployments, server-side Gemini API integration, and production environment configuration for student builders.',
    agenda: ['Containerizing Express & React full-stack apps', 'Securing API keys with server-side proxy routes', 'Deploying live student demos to Cloud Run'],
  },
  {
    id: 'systems-linux-primer', title: 'Systems Engineering & Linux Internals Workshop', category: 'Workshop', date: 'Dec 05, 2026', time: '10:30 AM – 01:30 PM', venue: 'CSE Systems Lab 204', seatsTotal: 60, seatsRemaining: 60, coordinator: 'Karthik Gowda R',
    summary: 'Practical walkthrough of process scheduling, virtual memory, shell scripting, and socket programming aligned with VTU CSE core coursework.',
    agenda: ['Inspecting Linux syscalls with strace', 'Writing a concurrent TCP server in C/C++', 'Profiling memory and CPU bottlenecks'],
  },
  {
    id: 'dsa-winter-bootcamp', title: 'Algorithms & Graph Theory Problem Sprint', category: 'Workshop', date: 'Dec 12, 2026', time: '09:30 AM – 12:30 PM', venue: 'CSE Programming Lab 102', seatsTotal: 90, seatsRemaining: 90, coordinator: 'Spoorthi M N',
    summary: 'Structured problem-solving session focused on dynamic programming, shortest paths, and technical interview patterns for 5th and 7th semester cohorts.',
    agenda: ['State modeling for 2D dynamic programming', 'Dijkstra, Bellman-Ford, and Union-Find trade-offs', 'Live timed 90-minute coding round'],
  },
  {
    id: 'alumni-tech-talk-systems', title: 'Engineering Reliable Distributed Backends at Scale', category: 'Tech Talk', date: 'Dec 19, 2026', time: '03:00 PM – 04:30 PM', venue: 'RIT Conference Hall', seatsTotal: 140, seatsRemaining: 140, coordinator: 'Yashawantha H M',
    summary: 'Interactive fireside session with RIT Hassan CSE alumni engineers on observability, database indexing, and transitioning from campus projects to production.',
    agenda: ['How real-world APIs handle traffic spikes', 'Reading query plans and avoiding N+1 queries', 'Open Q&A on internships and open-source portfolios'],
  },
  {
    id: 'open-source-sankranti', title: 'Winter Open-Source Pull Request Sprint', category: 'Study Jam', date: 'Jan 09, 2027', time: '10:00 AM – 04:00 PM', venue: 'CSE Innovation Hub', seatsTotal: 75, seatsRemaining: 75, coordinator: 'Darshan Shetty B',
    summary: 'Guided Git workflow workshop helping first- and second-year CSE students ship their first verified pull requests to campus tools and OSS repositories.',
    agenda: ['Interactive rebasing, branch hygiene, and commit standards', 'Triaging good-first-issues across club repositories', 'Peer code reviews with senior maintainers'],
  },
];

export const STUDENT_PROJECTS: StudentProject[] = [
  {
    id: 'krishisense-hassan', title: 'KrishiSense Hassan Crop & Soil Advisor', domain: 'AI & ML', semester: '7th Sem CSE', contributors: 'Pranav H, Meghana V, Yashawantha H M', stack: ['TypeScript', 'Python', 'TensorFlow Lite', 'React'],
    summary: 'Edge-ready leaf pathology classifier and localized irrigation planner tailored for Hassan district smallholder farmers.',
    architectureNote: 'Quantized inference model paired with a lightweight REST gateway and offline-capable Progressive Web App cache.', impactMetric: '93.4% validation accuracy across 14 regional crop classes', repoSlug: 'rit-cse-guild/krishisense-hassan', featured: true,
    image: '/src/assets/images/project_ai_systems_1794977424001.jpg',
  },
  {
    id: 'libvault-vtu-archive', title: 'LibVault CSE Question & Lab Archive', domain: 'Campus Tools', semester: '5th Sem CSE', contributors: 'Nischitha S, Rohith Kumar P', stack: ['React', 'Express', 'PostgreSQL', 'Tailwind CSS'],
    summary: 'Searchable repository of VTU CSE previous-year papers, verified lab manuals, and viva notes organized by semester and subject.', architectureNote: 'Indexed full-text search over structured PDF metadata with instant offline bookmarking.', impactMetric: '1,240+ monthly student lookups during internal assessments', repoSlug: 'rit-cse-guild/libvault-cse',
  },
  {
    id: 'codejudge-sandbox', title: 'CodeJudge Campus Evaluation Sandbox', domain: 'Systems & IoT', semester: '6th Sem CSE', contributors: 'Abhishek Gowda, Tejaswini R', stack: ['Node.js', 'Docker', 'C++', 'WebSockets'],
    summary: 'Isolated container-based grading runner supporting C, C++, Python, and Java submissions during coding contests.', architectureNote: 'Ephemeral Linux containers with CPU limits and deterministic test-case diffing.', impactMetric: 'Sub-450ms median execution turnaround across 120 concurrent users', repoSlug: 'rit-cse-guild/codejudge-sandbox',
  },
  {
    id: 'bustrack-rit', title: 'BusTrack RIT Hassan Transit Board', domain: 'Web & Cloud', semester: '5th Sem CSE', contributors: 'Suhas M, Kavya D S', stack: ['React', 'TypeScript', 'Leaflet', 'REST API'],
    summary: 'Live route schedule and stop-ETA board covering college shuttle routes across Hassan.', architectureNote: 'Polling telemetry service with fallback static schedules when mobile signal drops.', impactMetric: 'Covers 11 daily campus routes with zero-login timetable access', repoSlug: 'rit-cse-guild/bustrack-rit',
  },
  {
    id: 'gdg-event-checkin', title: 'CampusPass QR Check-In Desk', domain: 'Web & Cloud', semester: '3rd & 5th Sem CSE', contributors: 'Chethan B, Yashawantha H M', stack: ['React', 'Vite', 'QR Scanner', 'Firebase'],
    summary: 'Offline-tolerant attendee verification and digital certificate system for GDG and CSE events.', architectureNote: 'Signed registration tokens verified in browser with CSV attendance export.', impactMetric: 'Checks in 150+ participants in under 12 minutes', repoSlug: 'rit-cse-guild/campus-pass',
  },
];

export const STUDY_TRACKS: StudyTrack[] = [
  { id: 'web-cloud', title: 'Web & Cloud', lead: 'Ananya K S', schedule: 'Wed · 4:30 PM', focus: 'Build and deploy accessible full-stack applications.', modules: ['React and accessible component systems', 'REST APIs, authentication, and Firestore', 'Cloud Run, CI/CD, and observability'] },
  { id: 'ai-ml', title: 'AI & ML', lead: 'Pranav H', schedule: 'Thu · 4:30 PM', focus: 'Move from datasets to practical machine learning systems.', modules: ['Python data workflows', 'Model training and evaluation', 'Edge and cloud inference'] },
  { id: 'systems-iot', title: 'Systems & IoT', lead: 'Karthik Gowda R', schedule: 'Fri · 3:30 PM', focus: 'Understand low-level systems and connected hardware.', modules: ['Linux internals and shell tooling', 'C/C++ networking and performance', 'ESP32 and MQTT telemetry'] },
];

export const MENTORSHIP_SLOTS: MentorshipSlot[] = [
  { id: 'slot-review-1', topic: 'Git & pull request review', day: 'Monday', time: '4:00 PM', mentor: 'Darshan Shetty B' },
  { id: 'slot-review-2', topic: 'React / Firebase debugging', day: 'Wednesday', time: '4:30 PM', mentor: 'Ananya K S' },
  { id: 'slot-review-3', topic: 'DSA & contest strategy', day: 'Saturday', time: '10:00 AM', mentor: 'Spoorthi M N' },
];

export const RESOURCE_VAULT: ResourceVaultItem[] = [
  { id: 'vtu-lab', category: 'VTU CSE', format: 'Checklist', updated: 'Nov 2026', title: 'Lab Record Submission Guide', description: 'A structured checklist for preparing clean, reproducible VTU CSE lab records.', outline: ['Problem statement and objectives', 'Algorithm, flowchart, and test cases', 'Output snapshots and viva preparation'] },
  { id: 'codestorm-kit', category: 'CODESTORM', format: 'Build Kit', updated: 'Nov 2026', title: 'Hackathon Delivery Checklist', description: 'Copy this checklist before demo and jury evaluation.', outline: ['Document the user problem', 'Prepare a working demo and architecture slide', 'Assign pitch, code, and backup roles'] },
  { id: 'git-basics', category: 'Open Source', format: 'Workflow', updated: 'Nov 2026', title: 'First Pull Request Guide', description: 'A repeatable Git workflow for club and open-source contributions.', outline: ['Create a focused branch', 'Use a conventional commit message', 'Open a clear PR with tests and screenshots'] },
];
