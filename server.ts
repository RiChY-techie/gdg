import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'club-db.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || 'rit-hassan-cse-gdg-2026-session-key';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  designation: 'Principal' | 'HOD' | 'Faculty Advisor' | 'Student Coordinator';
  department: string;
  passwordHash: string;
}

interface ClubMember {
  id: string;
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
  passwordHash: string;
}

interface JoinRequest {
  id: string;
  name: string;
  usn: string;
  email: string;
  semester: string;
  domain: string;
  statement: string;
  passwordHash: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
}

interface ClubEventRecord {
  id: string;
  title: string;
  category: 'Hackathon' | 'Workshop' | 'Study Jam' | 'Tech Talk';
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

interface EventRegistrationRecord {
  id: string;
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

interface StudentProjectRecord {
  id: string;
  title: string;
  domain: 'AI & ML' | 'Web & Cloud' | 'Systems & IoT' | 'Campus Tools';
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

interface ContactInquiryRecord {
  id: string;
  referenceId: string;
  name: string;
  email: string;
  usn: string;
  topic: string;
  message: string;
  status: 'open' | 'reviewed';
  createdAt: string;
}

interface ClubDatabase {
  admins: AdminUser[];
  members: ClubMember[];
  joinRequests: JoinRequest[];
  events: ClubEventRecord[];
  registrations: EventRegistrationRecord[];
  projects: StudentProjectRecord[];
  inquiries: ContactInquiryRecord[];
}

interface SessionPayload {
  sub: string;
  role: 'admin' | 'member';
  email: string;
  name: string;
  designation?: string;
  exp: number;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function signToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function createInitialSeed(): ClubDatabase {
  const memberDefaultHash = hashPassword('Member@2026');

  return {
    admins: [
      {
        id: 'adm-principal',
        name: 'Dr. Mahesh Rao',
        email: 'principal@rithassan.ac.in',
        designation: 'Principal',
        department: 'Rajeev Institute of Technology, Hassan',
        passwordHash: hashPassword('RIT@Principal2026'),
      },
      {
        id: 'adm-hod',
        name: 'Dr. Kavitha R',
        email: 'hod.cse@rithassan.ac.in',
        designation: 'HOD',
        department: 'Dept. of Computer Science & Engineering',
        passwordHash: hashPassword('CSE@Hod2026'),
      },
      {
        id: 'adm-coord',
        name: 'Yashawantha H M',
        email: 'coordinator@rithassan.ac.in',
        designation: 'Student Coordinator',
        department: 'GDG on Campus – RIT Hassan',
        passwordHash: hashPassword('GDG@Coord2026'),
      },
    ],
    members: [
      {
        id: 'mem-1',
        name: 'Yashawantha H M',
        usn: '4RA23CS098',
        email: 'yashawantha.cs@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'Web & Cloud',
        clubRole: 'Club Head',
        joinedAt: '2024-08-14',
        attendanceRate: 96,
        githubHandle: 'Yashawantha26',
        bio: 'Student Coordinator for GDG on Campus – RIT Hassan and CODESTORM 2026 lead organizer.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-2',
        name: 'Ananya K S',
        usn: '4RA23CS012',
        email: 'ananya.cs@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'Web & Cloud',
        clubRole: 'Domain Lead',
        joinedAt: '2024-08-20',
        attendanceRate: 94,
        githubHandle: 'ananya-ks-dev',
        bio: 'Cloud & DevOps track lead running Docker and Google Cloud Study Jams.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-3',
        name: 'Karthik Gowda R',
        usn: '4RA23CS041',
        email: 'karthik.cs@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'Systems & IoT',
        clubRole: 'Domain Lead',
        joinedAt: '2024-09-02',
        attendanceRate: 92,
        githubHandle: 'karthik-sys',
        bio: 'Linux internals mentor and open-source campus infrastructure maintainer.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-4',
        name: 'Spoorthi M N',
        usn: '4RA24CS084',
        email: 'spoorthi.cs@rithassan.ac.in',
        semester: '5th Semester',
        domain: 'Algorithms & CP',
        clubRole: 'Domain Lead',
        joinedAt: '2025-01-18',
        attendanceRate: 91,
        githubHandle: 'spoorthi-cp',
        bio: 'Competitive programming cell lead organizing Saturday DSA practice clinics.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-5',
        name: 'Chethan B',
        usn: '4RA24CS024',
        email: 'chethan.cs@rithassan.ac.in',
        semester: '5th Semester',
        domain: 'Web & Cloud',
        clubRole: 'Member',
        joinedAt: '2025-02-10',
        attendanceRate: 89,
        githubHandle: 'chethanb-rit',
        bio: 'Full-stack TypeScript contributor building CampusPass QR check-in tooling.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-6',
        name: 'Pranav H',
        usn: '4RA23CS067',
        email: 'pranav.cs@rithassan.ac.in',
        semester: '7th Semester',
        domain: 'AI & ML',
        clubRole: 'Member',
        joinedAt: '2024-09-12',
        attendanceRate: 90,
        githubHandle: 'pranav-ml',
        bio: 'Working on edge TensorFlow Lite crop diagnostics for Hassan district.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-7',
        name: 'Meghana V',
        usn: '4RA24CS051',
        email: 'meghana.cs@rithassan.ac.in',
        semester: '5th Semester',
        domain: 'AI & ML',
        clubRole: 'Member',
        joinedAt: '2025-02-22',
        attendanceRate: 88,
        githubHandle: 'meghana-v',
        bio: 'Applied machine learning member focused on computer vision and datasets.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-8',
        name: 'Suhas M',
        usn: '4RA25CS077',
        email: 'suhas.cs@rithassan.ac.in',
        semester: '3rd Semester',
        domain: 'Web & Cloud',
        clubRole: 'Member',
        joinedAt: '2026-08-19',
        attendanceRate: 86,
        githubHandle: 'suhas-m-dev',
        bio: 'Frontend developer contributing to BusTrack RIT Hassan Transit Board.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-9',
        name: 'Rakshitha B',
        usn: '4RA25CS063',
        email: 'rakshitha.cs@rithassan.ac.in',
        semester: '3rd Semester',
        domain: 'Systems & IoT',
        clubRole: 'Member',
        joinedAt: '2026-08-25',
        attendanceRate: 87,
        githubHandle: 'rakshitha-iot',
        bio: 'Embedded systems & MQTT telemetry builder for Vidyut Smart Lab.',
        passwordHash: memberDefaultHash,
      },
      {
        id: 'mem-10',
        name: 'Adarsh K',
        usn: '4RA26CS004',
        email: 'adarsh.cs@rithassan.ac.in',
        semester: '1st Semester',
        domain: 'Algorithms & CP',
        clubRole: 'Member',
        joinedAt: '2026-09-14',
        attendanceRate: 85,
        githubHandle: 'adarsh-k',
        bio: 'First-year CSE member learning C programming and Git workflows.',
        passwordHash: memberDefaultHash,
      },
    ],
    joinRequests: [
      {
        id: 'req-1',
        name: 'Divya S',
        usn: '4RA25CS029',
        email: 'divya.cs@rithassan.ac.in',
        semester: '3rd Semester',
        domain: 'Web & Cloud',
        statement:
          'Built our section timetable viewer in React and want to contribute to CODESTORM web tooling.',
        passwordHash: memberDefaultHash,
        status: 'pending',
        submittedAt: '2026-11-15',
      },
      {
        id: 'req-2',
        name: 'Nikhil Gowda',
        usn: '4RA25CS055',
        email: 'nikhil.cs@rithassan.ac.in',
        semester: '3rd Semester',
        domain: 'AI & ML',
        statement:
          'Interested in joining the Applied ML cohort and participating in the Google Cloud Study Jam.',
        passwordHash: memberDefaultHash,
        status: 'pending',
        submittedAt: '2026-11-16',
      },
      {
        id: 'req-3',
        name: 'Harshini K',
        usn: '4RA26CS019',
        email: 'harshini.cs@rithassan.ac.in',
        semester: '1st Semester',
        domain: 'Algorithms & CP',
        statement:
          'Looking forward to Saturday DSA clinics and learning Git with senior mentors.',
        passwordHash: memberDefaultHash,
        status: 'pending',
        submittedAt: '2026-11-17',
      },
    ],
    events: [
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
        summary:
          'Flagship web engineering and problem-solving challenge organized by GDG on Campus – RIT Hassan and the Department of Computer Science & Engineering.',
        agenda: [
          '09:00 AM — Opening briefing & problem track release',
          '10:00 AM — Design & full-stack prototyping sprint',
          '02:30 PM — Faculty & industry mentor checkpoints',
          '04:30 PM — Live product demos & jury evaluation',
        ],
        featured: true,
        image: '/src/assets/images/event_codestorm_hackathon_1794977423813.jpg',
      },
      {
        id: 'cloud-study-jam-k8s',
        title: 'Google Cloud Study Jam: Containers & Gemini APIs',
        category: 'Study Jam',
        date: 'Nov 28, 2026',
        time: '02:00 PM – 05:00 PM',
        venue: 'CSE Seminar Hall, Academic Block B',
        seatsTotal: 80,
        seatsRemaining: 79,
        coordinator: 'Ananya K S',
        summary:
          'Hands-on lab covering Cloud Run deployments, server-side Gemini API integration, and production environment configuration for student builders.',
        agenda: [
          'Containerizing Express & React full-stack apps',
          'Securing API keys with server-side proxy routes',
          'Deploying live student demos to Cloud Run',
        ],
      },
      {
        id: 'systems-linux-primer',
        title: 'Systems Engineering & Linux Internals Workshop',
        category: 'Workshop',
        date: 'Dec 05, 2026',
        time: '10:30 AM – 01:30 PM',
        venue: 'CSE Systems Lab 204',
        seatsTotal: 60,
        seatsRemaining: 60,
        coordinator: 'Karthik Gowda R',
        summary:
          'Practical walkthrough of process scheduling, virtual memory, shell scripting, and socket programming aligned with VTU CSE core coursework.',
        agenda: [
          'Inspecting Linux syscalls with strace',
          'Writing a concurrent TCP server in C/C++',
          'Profiling memory and CPU bottlenecks',
        ],
      },
      {
        id: 'dsa-winter-bootcamp',
        title: 'Algorithms & Graph Theory Problem Sprint',
        category: 'Workshop',
        date: 'Dec 12, 2026',
        time: '09:30 AM – 12:30 PM',
        venue: 'CSE Programming Lab 102',
        seatsTotal: 90,
        seatsRemaining: 90,
        coordinator: 'Spoorthi M N',
        summary:
          'Structured problem-solving session focused on dynamic programming, shortest paths, and technical interview patterns for 5th and 7th semester cohorts.',
        agenda: [
          'State modeling for 2D dynamic programming',
          'Dijkstra, Bellman-Ford, and Union-Find trade-offs',
          'Live timed 90-minute coding round',
        ],
      },
      {
        id: 'alumni-tech-talk-systems',
        title: 'Engineering Reliable Distributed Backends at Scale',
        category: 'Tech Talk',
        date: 'Dec 19, 2026',
        time: '03:00 PM – 04:30 PM',
        venue: 'RIT Conference Hall',
        seatsTotal: 140,
        seatsRemaining: 140,
        coordinator: 'Yashawantha H M',
        summary:
          'Interactive fireside session with RIT Hassan CSE alumni engineers on observability, database indexing, and transitioning from campus projects to production.',
        agenda: [
          'How real-world APIs handle traffic spikes',
          'Reading query plans and avoiding N+1 queries',
          'Open Q&A on internships and open-source portfolios',
        ],
      },
      {
        id: 'open-source-sankranti',
        title: 'Winter Open-Source Pull Request Sprint',
        category: 'Study Jam',
        date: 'Jan 09, 2027',
        time: '10:00 AM – 04:00 PM',
        venue: 'CSE Innovation Hub',
        seatsTotal: 75,
        seatsRemaining: 75,
        coordinator: 'Darshan Shetty B',
        summary:
          'Guided Git workflow workshop helping first- and second-year CSE students ship their first verified pull requests to campus tools and OSS repositories.',
        agenda: [
          'Interactive rebasing, branch hygiene, and commit standards',
          'Triaging good-first-issues across club repositories',
          'Peer code reviews with senior maintainers',
        ],
      },
    ],
    registrations: [
      {
        id: 'reg-seed-1',
        eventId: 'codestorm-2026-nov',
        eventTitle: 'CODESTORM 2026 – November Edition',
        eventDate: 'Nov 22, 2026',
        eventVenue: 'RIT Main Auditorium & CSE Labs',
        studentName: 'Chethan B',
        usn: '4RA24CS024',
        email: 'chethan.cs@rithassan.ac.in',
        semester: '5th Semester',
        track: 'Web & Cloud',
        passCode: 'RIT-CS24A',
        checkedIn: true,
        createdAt: '2026-11-12',
      },
      {
        id: 'reg-seed-2',
        eventId: 'codestorm-2026-nov',
        eventTitle: 'CODESTORM 2026 – November Edition',
        eventDate: 'Nov 22, 2026',
        eventVenue: 'RIT Main Auditorium & CSE Labs',
        studentName: 'Suhas M',
        usn: '4RA25CS077',
        email: 'suhas.cs@rithassan.ac.in',
        semester: '3rd Semester',
        track: 'Campus Tools',
        passCode: 'RIT-CS77B',
        checkedIn: false,
        createdAt: '2026-11-14',
      },
      {
        id: 'reg-seed-3',
        eventId: 'codestorm-2026-nov',
        eventTitle: 'CODESTORM 2026 – November Edition',
        eventDate: 'Nov 22, 2026',
        eventVenue: 'RIT Main Auditorium & CSE Labs',
        studentName: 'Meghana V',
        usn: '4RA24CS051',
        email: 'meghana.cs@rithassan.ac.in',
        semester: '5th Semester',
        track: 'AI & ML',
        passCode: 'RIT-CS51M',
        checkedIn: false,
        createdAt: '2026-11-15',
      },
      {
        id: 'reg-seed-4',
        eventId: 'cloud-study-jam-k8s',
        eventTitle: 'Google Cloud Study Jam: Containers & Gemini APIs',
        eventDate: 'Nov 28, 2026',
        eventVenue: 'CSE Seminar Hall, Academic Block B',
        studentName: 'Adarsh K',
        usn: '4RA26CS004',
        email: 'adarsh.cs@rithassan.ac.in',
        semester: '1st Semester',
        track: 'Cloud',
        passCode: 'RIT-CL04K',
        checkedIn: false,
        createdAt: '2026-11-16',
      },
    ],
    projects: [
      {
        id: 'krishisense-hassan',
        title: 'KrishiSense Hassan Crop & Soil Advisor',
        domain: 'AI & ML',
        semester: '7th Sem CSE',
        contributors: 'Pranav H, Meghana V, Yashawantha H M',
        stack: ['TypeScript', 'Python', 'TensorFlow Lite', 'React'],
        summary:
          'Edge-ready leaf pathology classifier and localized irrigation planner tailored for Hassan district smallholder farmers with bilingual Kannada and English guidance.',
        architectureNote:
          'Quantized MobileNetV3 inference model paired with a lightweight Express REST gateway and offline-capable Progressive Web App cache.',
        impactMetric: '93.4% validation accuracy across 14 regional crop classes',
        repoSlug: 'rit-cse-guild/krishisense-hassan',
        featured: true,
        image: '/src/assets/images/project_ai_systems_1794977424001.jpg',
      },
      {
        id: 'libvault-vtu-archive',
        title: 'LibVault CSE Question & Lab Archive',
        domain: 'Campus Tools',
        semester: '5th Sem CSE',
        contributors: 'Nischitha S, Rohith Kumar P',
        stack: ['React', 'Express', 'PostgreSQL', 'Tailwind CSS'],
        summary:
          'Searchable repository of VTU CSE previous-year question papers, verified lab manuals, and viva notes organized cleanly by semester and subject code.',
        architectureNote:
          'Indexed full-text search over structured PDF metadata with semester filters and instant offline bookmarking.',
        impactMetric: '1,240+ monthly student lookups during internal assessments',
        repoSlug: 'rit-cse-guild/libvault-cse',
      },
      {
        id: 'codejudge-sandbox',
        title: 'CodeJudge Campus Evaluation Sandbox',
        domain: 'Systems & IoT',
        semester: '6th Sem CSE',
        contributors: 'Abhishek Gowda, Tejaswini R',
        stack: ['Node.js', 'Docker', 'C++', 'WebSockets'],
        summary:
          'Isolated container-based grading runner supporting C, C++, Python, and Java submissions during intra-college coding contests on local campus LAN.',
        architectureNote:
          'Uses ephemeral Linux namespaces with strict CPU/memory cgroups and deterministic test-case diffing.',
        impactMetric: 'Sub-450ms median execution turnaround across 120 concurrent users',
        repoSlug: 'rit-cse-guild/codejudge-sandbox',
      },
      {
        id: 'bustrack-rit',
        title: 'BusTrack RIT Hassan Transit Board',
        domain: 'Web & Cloud',
        semester: '5th Sem CSE',
        contributors: 'Suhas M, Kavya D S',
        stack: ['React', 'TypeScript', 'Leaflet', 'REST API'],
        summary:
          'Live route schedule and stop-ETA board covering college shuttle routes across Hassan city, Salagame Road, and Channarayapatna corridors.',
        architectureNote:
          'Lightweight polling telemetry service with fallback static timetable schedules when mobile signal drops.',
        impactMetric: 'Covers 11 daily campus routes with zero-login timetable access',
        repoSlug: 'rit-cse-guild/bustrack-rit',
      },
      {
        id: 'vidyut-lab-telemetry',
        title: 'Vidyut Smart Lab Energy Monitor',
        domain: 'Systems & IoT',
        semester: '7th Sem CSE',
        contributors: 'Harshith K, Rakshitha B',
        stack: ['ESP32', 'MQTT', 'Time-Series DB', 'React'],
        summary:
          'Non-invasive current-sensor telemetry unit deployed in CSE hardware labs to detect idle workstation power draw after evening hours.',
        architectureNote:
          'ESP32 nodes stream 5-second power readings over local MQTT broker to a compact web dashboard with threshold alerts.',
        impactMetric: 'Identified 18% reducible overnight standby load across 2 labs',
        repoSlug: 'rit-cse-guild/vidyut-monitor',
      },
      {
        id: 'gdg-event-checkin',
        title: 'CampusPass QR Check-In Desk',
        domain: 'Web & Cloud',
        semester: '3rd & 5th Sem CSE',
        contributors: 'Chethan B, Yashawantha H M',
        stack: ['React', 'Vite', 'QR Scanner', 'Express'],
        summary:
          'Rapid offline-tolerant attendee verification and digital certificate issuer built specifically for GDG on Campus – RIT Hassan workshops and CODESTORM.',
        architectureNote:
          'Signed JSON registration tokens verified in-browser via WebCrypto with instant CSV attendance export.',
        impactMetric: 'Checks in 150+ participants in under 12 minutes at event doors',
        repoSlug: 'rit-cse-guild/campus-pass',
      },
    ],
    inquiries: [
      {
        id: 'inq-seed-1',
        referenceId: 'CSE-4102',
        name: 'Rohan Desai',
        email: 'rohan.desai@rithassan.ac.in',
        usn: '4RA24CS071',
        topic: 'Workshop or Tech Talk Proposal',
        message: 'Would like to co-host an introductory Docker & GitHub Actions clinic for 3rd semester students.',
        status: 'open',
        createdAt: '2026-11-16',
      },
    ],
  };
}

function loadDb(): ClubDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as ClubDatabase;
  } catch {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

function saveDb(db: ClubDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function sanitizeMember(member: ClubMember) {
  const { passwordHash: _ignored, ...safe } = member;
  return safe;
}

function sanitizeJoinRequest(req: JoinRequest) {
  const { passwordHash: _ignored, ...safe } = req;
  return safe;
}

interface AuthedRequest extends Request {
  session?: SessionPayload;
}

function parseAuth(req: AuthedRequest): SessionPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return verifyToken(token);
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const session = parseAuth(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.session = session;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const session = parseAuth(req);
  if (!session || session.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access (Principal / HOD / Club Head) required.' });
    return;
  }
  req.session = session;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Ensure DB is initialized on boot
  loadDb();

  // --- Public Endpoints ---
  app.get('/api/overview', (_req, res) => {
    const db = loadDb();
    const heads = db.members
      .filter((m) => m.clubRole === 'Club Head' || m.clubRole === 'Domain Lead')
      .map(sanitizeMember);

    res.json({
      events: db.events,
      projects: db.projects,
      stats: {
        totalMembers: db.members.length,
        totalHeads: heads.length,
        totalEvents: db.events.length,
        totalProjects: db.projects.length,
        totalRegistrations: db.registrations.length,
      },
      heads,
    });
  });

  // Participant Event Registration (public or authenticated)
  app.post('/api/registrations', (req, res) => {
    const { eventId, studentName, usn, email, semester, track } = req.body ?? {};
    if (
      typeof eventId !== 'string' ||
      typeof studentName !== 'string' ||
      typeof usn !== 'string' ||
      typeof email !== 'string'
    ) {
      res.status(400).json({ error: 'Missing required participant fields.' });
      return;
    }

    const cleanName = studentName.trim();
    const cleanUsn = usn.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanUsn.length < 4 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid name, USN, and email address.' });
      return;
    }

    const db = loadDb();
    const ev = db.events.find((e) => e.id === eventId);
    if (!ev) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const duplicate = db.registrations.find(
      (r) => r.eventId === eventId && (r.usn === cleanUsn || r.email.toLowerCase() === cleanEmail)
    );
    if (duplicate) {
      res.status(200).json({ registration: duplicate, alreadyRegistered: true });
      return;
    }

    if (ev.seatsRemaining <= 0) {
      res.status(409).json({ error: 'This event is currently at full capacity.' });
      return;
    }

    const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
    const registration: EventRegistrationRecord = {
      id: `reg-${Date.now()}`,
      eventId: ev.id,
      eventTitle: ev.title,
      eventDate: ev.date,
      eventVenue: ev.venue,
      studentName: cleanName,
      usn: cleanUsn,
      email: cleanEmail,
      semester: typeof semester === 'string' && semester.trim() ? semester.trim() : '5th Semester',
      track: typeof track === 'string' && track.trim() ? track.trim() : 'General',
      passCode: `RIT-${randomCode}`,
      checkedIn: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    ev.seatsRemaining = Math.max(0, ev.seatsRemaining - 1);
    db.registrations.unshift(registration);
    saveDb(db);

    res.status(201).json({ registration, event: ev });
  });

  app.delete('/api/registrations/:id', (req, res) => {
    const db = loadDb();
    const idx = db.registrations.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Registration not found.' });
      return;
    }
    const [removed] = db.registrations.splice(idx, 1);
    const ev = db.events.find((e) => e.id === removed.eventId);
    if (ev && ev.seatsRemaining < ev.seatsTotal) {
      ev.seatsRemaining += 1;
    }
    saveDb(db);
    res.json({ ok: true });
  });

  // Submit Student Project
  app.post('/api/projects', (req, res) => {
    const { title, domain, semester, contributors, stack, summary, repoSlug } = req.body ?? {};
    if (typeof title !== 'string' || typeof contributors !== 'string' || typeof summary !== 'string') {
      res.status(400).json({ error: 'Project title, contributors, and summary are required.' });
      return;
    }
    const cleanTitle = title.trim();
    if (!cleanTitle || !contributors.trim() || !summary.trim()) {
      res.status(400).json({ error: 'Project fields cannot be empty.' });
      return;
    }

    const validDomains = ['AI & ML', 'Web & Cloud', 'Systems & IoT', 'Campus Tools'];
    const safeDomain = validDomains.includes(domain) ? domain : 'Web & Cloud';

    const db = loadDb();
    const newProject: StudentProjectRecord = {
      id: `proj-${Date.now()}`,
      title: cleanTitle,
      domain: safeDomain,
      semester: typeof semester === 'string' && semester.trim() ? semester.trim() : 'CSE Dept',
      contributors: contributors.trim(),
      stack: Array.isArray(stack) ? stack.map((s) => String(s).trim()).filter(Boolean) : [],
      summary: summary.trim(),
      architectureNote: 'Student-submitted build persisted in RIT CSE Guild registry.',
      impactMetric: 'Open for campus peer review',
      repoSlug:
        typeof repoSlug === 'string' && repoSlug.trim()
          ? repoSlug.trim()
          : `rit-cse-guild/${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    };

    db.projects.unshift(newProject);
    saveDb(db);
    res.status(201).json({ project: newProject });
  });

  // Public Club Join Request
  app.post('/api/join-requests', (req, res) => {
    const { name, usn, email, semester, domain, statement, password } = req.body ?? {};
    if (
      typeof name !== 'string' ||
      typeof usn !== 'string' ||
      typeof email !== 'string' ||
      typeof statement !== 'string' ||
      typeof password !== 'string'
    ) {
      res.status(400).json({ error: 'All membership application fields are required.' });
      return;
    }

    const cleanName = name.trim();
    const cleanUsn = usn.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanUsn.length < 4 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Provide a valid full name, USN, and email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Choose a member portal password of at least 6 characters.' });
      return;
    }

    const db = loadDb();
    if (db.members.some((m) => m.email.toLowerCase() === cleanEmail || m.usn === cleanUsn)) {
      res.status(409).json({ error: 'A club member with this USN or email already exists.' });
      return;
    }
    if (
      db.joinRequests.some(
        (r) =>
          r.status === 'pending' &&
          (r.email.toLowerCase() === cleanEmail || r.usn === cleanUsn)
      )
    ) {
      res.status(409).json({ error: 'Your membership request is already pending admin review.' });
      return;
    }

    const joinRequest: JoinRequest = {
      id: `req-${Date.now()}`,
      name: cleanName,
      usn: cleanUsn,
      email: cleanEmail,
      semester: typeof semester === 'string' && semester.trim() ? semester.trim() : '3rd Semester',
      domain: typeof domain === 'string' && domain.trim() ? domain.trim() : 'Web & Cloud',
      statement: statement.trim(),
      passwordHash: hashPassword(password),
      status: 'pending',
      submittedAt: new Date().toISOString().slice(0, 10),
    };

    db.joinRequests.unshift(joinRequest);
    saveDb(db);
    res.status(201).json({ request: sanitizeJoinRequest(joinRequest) });
  });

  // Public Contact Form Submission
  app.post('/api/inquiries', (req, res) => {
    const { name, email, usn, topic, message } = req.body ?? {};
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      res.status(400).json({ error: 'Name, email, and message are required.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || message.trim().length < 10) {
      res.status(400).json({ error: 'Please complete all fields accurately.' });
      return;
    }

    const db = loadDb();
    const inquiry: ContactInquiryRecord = {
      id: `inq-${Date.now()}`,
      referenceId: `CSE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      email: cleanEmail,
      usn: typeof usn === 'string' ? usn.trim().toUpperCase() : '',
      topic: typeof topic === 'string' && topic.trim() ? topic.trim() : 'General Inquiry',
      message: message.trim(),
      status: 'open',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.inquiries.unshift(inquiry);
    saveDb(db);
    res.status(201).json({ inquiry });
  });

  // --- Separate Role Authentication ---
  app.post('/api/auth/login', (req, res) => {
    const { role, identifier, password } = req.body ?? {};
    if ((role !== 'admin' && role !== 'member') || typeof identifier !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Provide role, identifier, and password.' });
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    const db = loadDb();

    if (role === 'admin') {
      const admin = db.admins.find((a) => a.email.toLowerCase() === cleanId);
      if (!admin || !verifyPassword(password, admin.passwordHash)) {
        res.status(401).json({ error: 'Invalid administrator email or passcode.' });
        return;
      }
      const token = signToken({
        sub: admin.id,
        role: 'admin',
        email: admin.email,
        name: admin.name,
        designation: admin.designation,
        exp: Date.now() + 1000 * 60 * 60 * 12,
      });
      res.json({
        token,
        user: {
          id: admin.id,
          role: 'admin',
          name: admin.name,
          email: admin.email,
          designation: admin.designation,
          department: admin.department,
        },
      });
      return;
    }

    // Member login accepts either email or USN
    const member = db.members.find(
      (m) => m.email.toLowerCase() === cleanId || m.usn.toLowerCase() === cleanId
    );
    if (!member) {
      const pending = db.joinRequests.find(
        (r) =>
          r.status === 'pending' &&
          (r.email.toLowerCase() === cleanId || r.usn.toLowerCase() === cleanId)
      );
      if (pending) {
        res.status(403).json({
          error: 'Your club membership request is pending approval by the HOD / Club Coordinator.',
        });
        return;
      }
      res.status(401).json({ error: 'Member account not found. Check your USN or email.' });
      return;
    }

    if (!verifyPassword(password, member.passwordHash)) {
      res.status(401).json({ error: 'Incorrect member password.' });
      return;
    }

    const token = signToken({
      sub: member.id,
      role: 'member',
      email: member.email,
      name: member.name,
      designation: member.clubRole,
      exp: Date.now() + 1000 * 60 * 60 * 12,
    });
    res.json({
      token,
      user: {
        ...sanitizeMember(member),
        role: 'member',
      },
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const session = req.session!;
    if (session.role === 'admin') {
      const admin = db.admins.find((a) => a.id === session.sub);
      if (!admin) {
        res.status(401).json({ error: 'Session expired.' });
        return;
      }
      res.json({
        user: {
          id: admin.id,
          role: 'admin',
          name: admin.name,
          email: admin.email,
          designation: admin.designation,
          department: admin.department,
        },
      });
      return;
    }

    const member = db.members.find((m) => m.id === session.sub);
    if (!member) {
      res.status(401).json({ error: 'Member account no longer active.' });
      return;
    }
    res.json({
      user: {
        ...sanitizeMember(member),
        role: 'member',
      },
    });
  });

  // --- Member Portal Endpoints ---
  app.get('/api/members/me', requireAuth, (req: AuthedRequest, res) => {
    const session = req.session!;
    if (session.role !== 'member') {
      res.status(403).json({ error: 'Member account required.' });
      return;
    }
    const db = loadDb();
    const member = db.members.find((m) => m.id === session.sub);
    if (!member) {
      res.status(404).json({ error: 'Member profile not found.' });
      return;
    }

    const myRegistrations = db.registrations.filter(
      (r) =>
        r.email.toLowerCase() === member.email.toLowerCase() ||
        r.usn.toUpperCase() === member.usn.toUpperCase()
    );
    const heads = db.members
      .filter((m) => m.clubRole === 'Club Head' || m.clubRole === 'Domain Lead')
      .map(sanitizeMember);

    res.json({
      member: sanitizeMember(member),
      registrations: myRegistrations,
      heads,
      totalClubStudents: db.members.length,
    });
  });

  app.patch('/api/members/me', requireAuth, (req: AuthedRequest, res) => {
    const session = req.session!;
    if (session.role !== 'member') {
      res.status(403).json({ error: 'Member account required.' });
      return;
    }
    const db = loadDb();
    const member = db.members.find((m) => m.id === session.sub);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const { domain, githubHandle, bio, semester } = req.body ?? {};
    if (typeof domain === 'string' && domain.trim()) member.domain = domain.trim();
    if (typeof githubHandle === 'string') member.githubHandle = githubHandle.trim();
    if (typeof bio === 'string') member.bio = bio.trim().slice(0, 280);
    if (typeof semester === 'string' && semester.trim()) member.semester = semester.trim();

    saveDb(db);
    res.json({ member: sanitizeMember(member) });
  });

  // --- Admin Governance Endpoints (Principal / HOD / Club Coordinator) ---
  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    const db = loadDb();
    const semesterBreakdown: Record<string, number> = {};
    const domainBreakdown: Record<string, number> = {};

    db.members.forEach((m) => {
      semesterBreakdown[m.semester] = (semesterBreakdown[m.semester] || 0) + 1;
      domainBreakdown[m.domain] = (domainBreakdown[m.domain] || 0) + 1;
    });

    res.json({
      summary: {
        totalMembers: db.members.length,
        headsCount: db.members.filter(
          (m) => m.clubRole === 'Club Head' || m.clubRole === 'Domain Lead'
        ).length,
        pendingRequestsCount: db.joinRequests.filter((r) => r.status === 'pending').length,
        totalRegistrations: db.registrations.length,
        openInquiriesCount: db.inquiries.filter((i) => i.status === 'open').length,
        semesterBreakdown,
        domainBreakdown,
      },
      members: db.members.map(sanitizeMember),
      joinRequests: db.joinRequests.map(sanitizeJoinRequest),
      registrations: db.registrations,
      events: db.events,
      inquiries: db.inquiries,
    });
  });

  // Approve or Reject Club Join Request
  app.post('/api/admin/join-requests/:id/decision', requireAdmin, (req: AuthedRequest, res) => {
    const { decision } = req.body ?? {};
    if (decision !== 'approved' && decision !== 'rejected') {
      res.status(400).json({ error: 'Decision must be approved or rejected.' });
      return;
    }

    const db = loadDb();
    const joinReq = db.joinRequests.find((r) => r.id === req.params.id);
    if (!joinReq) {
      res.status(404).json({ error: 'Join request not found.' });
      return;
    }

    joinReq.status = decision;
    joinReq.reviewedBy = `${req.session!.name} (${req.session!.designation})`;

    let createdMember = null;
    if (decision === 'approved') {
      const exists = db.members.some(
        (m) => m.email.toLowerCase() === joinReq.email.toLowerCase() || m.usn === joinReq.usn
      );
      if (!exists) {
        const newMember: ClubMember = {
          id: `mem-${Date.now()}`,
          name: joinReq.name,
          usn: joinReq.usn,
          email: joinReq.email,
          semester: joinReq.semester,
          domain: joinReq.domain,
          clubRole: 'Member',
          joinedAt: new Date().toISOString().slice(0, 10),
          attendanceRate: 100,
          githubHandle: '',
          bio: joinReq.statement,
          passwordHash: joinReq.passwordHash,
        };
        db.members.unshift(newMember);
        createdMember = sanitizeMember(newMember);
      }
    }

    saveDb(db);
    res.json({
      request: sanitizeJoinRequest(joinReq),
      createdMember,
    });
  });

  // Add a Member Directly by Admin
  app.post('/api/admin/members', requireAdmin, (req, res) => {
    const { name, usn, email, semester, domain, clubRole, password } = req.body ?? {};
    if (typeof name !== 'string' || typeof usn !== 'string' || typeof email !== 'string') {
      res.status(400).json({ error: 'Name, USN, and email are required.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsn = usn.trim().toUpperCase();
    const db = loadDb();
    if (db.members.some((m) => m.email.toLowerCase() === cleanEmail || m.usn === cleanUsn)) {
      res.status(409).json({ error: 'Member with this USN or email already exists.' });
      return;
    }

    const validRoles = ['Club Head', 'Domain Lead', 'Member'];
    const safeRole = validRoles.includes(clubRole) ? clubRole : 'Member';

    const member: ClubMember = {
      id: `mem-${Date.now()}`,
      name: name.trim(),
      usn: cleanUsn,
      email: cleanEmail,
      semester: typeof semester === 'string' && semester.trim() ? semester.trim() : '3rd Semester',
      domain: typeof domain === 'string' && domain.trim() ? domain.trim() : 'Web & Cloud',
      clubRole: safeRole,
      joinedAt: new Date().toISOString().slice(0, 10),
      attendanceRate: 100,
      githubHandle: '',
      bio: 'Added directly by CSE Department / GDG administration.',
      passwordHash: hashPassword(typeof password === 'string' && password.length >= 6 ? password : 'Member@2026'),
    };
    db.members.unshift(member);
    saveDb(db);
    res.status(201).json({ member: sanitizeMember(member) });
  });

  // Update Member Role (Promote to Head / Lead / Demote)
  app.patch('/api/admin/members/:id', requireAdmin, (req, res) => {
    const { clubRole, domain, semester } = req.body ?? {};
    const db = loadDb();
    const member = db.members.find((m) => m.id === req.params.id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    if (clubRole === 'Club Head' || clubRole === 'Domain Lead' || clubRole === 'Member') {
      member.clubRole = clubRole;
    }
    if (typeof domain === 'string' && domain.trim()) member.domain = domain.trim();
    if (typeof semester === 'string' && semester.trim()) member.semester = semester.trim();

    saveDb(db);
    res.json({ member: sanitizeMember(member) });
  });

  // Remove Member from Club
  app.delete('/api/admin/members/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.members.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    db.members.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true });
  });

  // Toggle Participant Event Check-In
  app.patch('/api/admin/registrations/:id/checkin', requireAdmin, (req, res) => {
    const db = loadDb();
    const reg = db.registrations.find((r) => r.id === req.params.id);
    if (!reg) {
      res.status(404).json({ error: 'Registration not found.' });
      return;
    }
    reg.checkedIn = !reg.checkedIn;
    saveDb(db);
    res.json({ registration: reg });
  });

  // Create New Club Event from Admin Console
  app.post('/api/admin/events', requireAdmin, (req, res) => {
    const { title, category, date, time, venue, seatsTotal, coordinator, summary } = req.body ?? {};
    if (typeof title !== 'string' || typeof date !== 'string' || typeof venue !== 'string') {
      res.status(400).json({ error: 'Event title, date, and venue are required.' });
      return;
    }
    const validCategories = ['Hackathon', 'Workshop', 'Study Jam', 'Tech Talk'];
    const safeCat = validCategories.includes(category) ? category : 'Workshop';
    const seats = Math.max(10, Number(seatsTotal) || 60);

    const db = loadDb();
    const newEvent: ClubEventRecord = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      category: safeCat,
      date: date.trim(),
      time: typeof time === 'string' && time.trim() ? time.trim() : '02:00 PM – 04:00 PM',
      venue: venue.trim(),
      seatsTotal: seats,
      seatsRemaining: seats,
      coordinator:
        typeof coordinator === 'string' && coordinator.trim()
          ? coordinator.trim()
          : 'Yashawantha H M',
      summary:
        typeof summary === 'string' && summary.trim()
          ? summary.trim()
          : 'Department technical session organized by RIT CSE Guild & GDG on Campus.',
      agenda: [
        'Session introduction and objectives',
        'Hands-on guided technical walkthrough',
        'Q&A and team review',
      ],
    };

    db.events.push(newEvent);
    saveDb(db);
    res.status(201).json({ event: newEvent });
  });

  // Mark Contact Inquiry Reviewed
  app.patch('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const inq = db.inquiries.find((i) => i.id === req.params.id);
    if (!inq) {
      res.status(404).json({ error: 'Inquiry not found.' });
      return;
    }
    inq.status = inq.status === 'open' ? 'reviewed' : 'open';
    saveDb(db);
    res.json({ inquiry: inq });
  });

  // Vite dev middleware vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RIT CSE Guild server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
