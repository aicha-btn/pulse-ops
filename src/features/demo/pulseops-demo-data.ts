export type HealthStatus = "healthy" | "watch" | "at_risk" | "silent";

export type HealthScoreBreakdown = {
  recentActivityPoints: number;
  frequencyPoints: number;
  funnelPoints: number;
  keyEventPoints: number;
};

export type CompanySummary = {
  id: string;
  name: string;
  plan: "starter" | "growth" | "scale";
  score: number;
  status: HealthStatus;
  lastActivity: string;
  activeUsers: number;
  trend: "up" | "flat" | "down";
  activationStep: string;
  reason: string;
  healthBreakdown: HealthScoreBreakdown;
  healthScoreSource: "calculated" | "estimated";
};

export type RecentEvent = {
  id: string;
  event: string;
  company: string;
  user: string;
  occurredAt: string;
  status: "accepted" | "ignored" | "rejected";
};

export type TrackedUserStatus = "active" | "new" | "cooling" | "silent";

export type TrackedUserSummary = {
  id: string;
  name: string;
  email: string;
  externalId: string;
  company: string;
  role: string;
  status: TrackedUserStatus;
  lastActivity: string;
  firstSeen: string;
  events14d: number;
  totalEvents: number;
};

export const overviewMetrics = [
  {
    label: "Activation",
    value: "39%",
    delta: "-8 pts",
    tone: "risk",
    note: "Drop-off before first_event_sent.",
  },
  {
    label: "Silent accounts",
    value: "7",
    delta: "+3",
    tone: "risk",
    note: "No activity for at least 14 days.",
  },
  {
    label: "Healthy accounts",
    value: "21",
    delta: "+5",
    tone: "good",
    note: "Regular key feature usage.",
  },
  {
    label: "Events received",
    value: "84.2k",
    delta: "90 days",
    tone: "neutral",
    note: "Deterministic demo dataset.",
  },
];

export const activitySeries = [
  { day: "Jun 01", events: 740, accounts: 18 },
  { day: "Jun 08", events: 980, accounts: 24 },
  { day: "Jun 15", events: 1240, accounts: 29 },
  { day: "Jun 22", events: 1180, accounts: 31 },
  { day: "Jun 29", events: 1360, accounts: 33 },
  { day: "Jul 06", events: 1520, accounts: 34 },
  { day: "Jul 13", events: 1320, accounts: 32 },
  { day: "Jul 20", events: 1100, accounts: 29 },
  { day: "Jul 27", events: 980, accounts: 27 },
  { day: "Aug 03", events: 910, accounts: 25 },
  { day: "Aug 10", events: 860, accounts: 23 },
  { day: "Aug 17", events: 790, accounts: 22 },
];

export const activationFunnel = [
  { step: "signed_up", users: 300, rate: 100 },
  { step: "project_created", users: 234, rate: 78 },
  { step: "api_key_created", users: 159, rate: 53 },
  { step: "first_event_sent", users: 117, rate: 39 },
];

export const companies: CompanySummary[] = [
  {
    id: "northstar-labs",
    name: "Northstar Labs",
    plan: "scale",
    score: 84,
    status: "healthy",
    lastActivity: "2 hours ago",
    activeUsers: 18,
    trend: "up",
    activationStep: "first_event_sent",
    reason: "Regular usage and teammate_invited used twice this week.",
    healthBreakdown: {
      recentActivityPoints: 40,
      frequencyPoints: 24,
      funnelPoints: 15,
      keyEventPoints: 5,
    },
    healthScoreSource: "calculated",
  },
  {
    id: "copperline-crm",
    name: "Copperline CRM",
    plan: "growth",
    score: 61,
    status: "watch",
    lastActivity: "3 days ago",
    activeUsers: 9,
    trend: "down",
    activationStep: "api_key_created",
    reason: "Activity dropped after first report sharing attempt.",
    healthBreakdown: {
      recentActivityPoints: 34,
      frequencyPoints: 18,
      funnelPoints: 9,
      keyEventPoints: 0,
    },
    healthScoreSource: "calculated",
  },
  {
    id: "rivetcloud",
    name: "RivetCloud",
    plan: "starter",
    score: 34,
    status: "silent",
    lastActivity: "16 days ago",
    activeUsers: 3,
    trend: "down",
    activationStep: "project_created",
    reason: "No key event since onboarding started.",
    healthBreakdown: {
      recentActivityPoints: 0,
      frequencyPoints: 5,
      funnelPoints: 14,
      keyEventPoints: 15,
    },
    healthScoreSource: "calculated",
  },
  {
    id: "vaultnest",
    name: "VaultNest",
    plan: "growth",
    score: 47,
    status: "at_risk",
    lastActivity: "9 days ago",
    activeUsers: 5,
    trend: "down",
    activationStep: "api_key_created",
    reason: "Integration is configured but first_event_sent never arrived.",
    healthBreakdown: {
      recentActivityPoints: 14,
      frequencyPoints: 10,
      funnelPoints: 15,
      keyEventPoints: 8,
    },
    healthScoreSource: "calculated",
  },
  {
    id: "brightbeam",
    name: "Brightbeam",
    plan: "scale",
    score: 78,
    status: "healthy",
    lastActivity: "6 hours ago",
    activeUsers: 14,
    trend: "flat",
    activationStep: "first_event_sent",
    reason: "Stable rhythm, but report_shared is less frequent.",
    healthBreakdown: {
      recentActivityPoints: 40,
      frequencyPoints: 18,
      funnelPoints: 20,
      keyEventPoints: 0,
    },
    healthScoreSource: "calculated",
  },
];

export const recentEvents: RecentEvent[] = [
  {
    id: "evt_7A31",
    event: "first_event_sent",
    company: "Northstar Labs",
    user: "founder@northstar.example",
    occurredAt: "14:31",
    status: "accepted",
  },
  {
    id: "evt_7A30",
    event: "dashboard_viewed",
    company: "Brightbeam",
    user: "ops@brightbeam.example",
    occurredAt: "14:24",
    status: "accepted",
  },
  {
    id: "evt_7A2F",
    event: "api_key_created",
    company: "VaultNest",
    user: "founder@vaultnest.example",
    occurredAt: "13:58",
    status: "accepted",
  },
  {
    id: "evt_7A2E",
    event: "first_event_sent",
    company: "Northstar Labs",
    user: "founder@northstar.example",
    occurredAt: "13:58",
    status: "ignored",
  },
  {
    id: "evt_7A2D",
    event: "missing_event_id",
    company: "Copperline CRM",
    user: "pm@copperline.example",
    occurredAt: "13:41",
    status: "rejected",
  },
];

export const trackedUsers: TrackedUserSummary[] = [
  {
    id: "user-northstar-founder",
    name: "Mara Chen",
    email: "founder@northstar.example",
    externalId: "user_northstar_founder",
    company: "Northstar Labs",
    role: "founder",
    status: "active",
    lastActivity: "2 hours ago",
    firstSeen: "Jun 02",
    events14d: 42,
    totalEvents: 218,
  },
  {
    id: "user-brightbeam-ops",
    name: "Amina Reed",
    email: "ops@brightbeam.example",
    externalId: "user_brightbeam_ops",
    company: "Brightbeam",
    role: "ops",
    status: "active",
    lastActivity: "6 hours ago",
    firstSeen: "Jun 01",
    events14d: 31,
    totalEvents: 184,
  },
  {
    id: "user-copperline-pm",
    name: "Elia Martin",
    email: "pm@copperline.example",
    externalId: "user_copperline_pm",
    company: "Copperline CRM",
    role: "pm",
    status: "cooling",
    lastActivity: "3 days ago",
    firstSeen: "Jun 07",
    events14d: 9,
    totalEvents: 96,
  },
  {
    id: "user-meridian-engineer",
    name: "Owen Fields",
    email: "eng@meridian.example",
    externalId: "user_meridian_engineer",
    company: "Meridian Ops",
    role: "engineer",
    status: "new",
    lastActivity: "1 day ago",
    firstSeen: "Aug 18",
    events14d: 12,
    totalEvents: 12,
  },
  {
    id: "user-vaultnest-founder",
    name: "Ari Novak",
    email: "founder@vaultnest.example",
    externalId: "user_vaultnest_founder",
    company: "VaultNest",
    role: "founder",
    status: "cooling",
    lastActivity: "9 days ago",
    firstSeen: "Jun 22",
    events14d: 2,
    totalEvents: 41,
  },
  {
    id: "user-rivetcloud-founder",
    name: "Jon Bell",
    email: "founder@rivetcloud.example",
    externalId: "user_rivetcloud_founder",
    company: "RivetCloud",
    role: "founder",
    status: "silent",
    lastActivity: "17 days ago",
    firstSeen: "Jun 12",
    events14d: 0,
    totalEvents: 17,
  },
  {
    id: "user-forgebase-founder",
    name: "Luis Ren",
    email: "founder@forgebase.example",
    externalId: "user_forgebase_founder",
    company: "Forgebase",
    role: "founder",
    status: "silent",
    lastActivity: "24 days ago",
    firstSeen: "Jul 12",
    events14d: 0,
    totalEvents: 8,
  },
];

export const integrationCurl = `curl -X POST http://localhost:3000/api/ingest/track \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer po_live_demo_1234567890" \\
  -d '{
    "event_id": "evt_demo_001",
    "event": "first_event_sent",
    "occurred_at": "2026-08-24T12:00:00.000Z",
    "user": {
      "external_id": "user_123",
      "email": "founder@example.com"
    },
    "company": {
      "external_id": "company_456",
      "name": "Northstar Labs",
      "traits": {
        "plan": "growth"
      }
    },
    "properties": {
      "source": "integration_docs"
    }
  }'`;
