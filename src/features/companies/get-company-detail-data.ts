import { normalizeCompanyName } from "@/features/companies/company-links";
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import type {
  CompanySummary,
  HealthScoreBreakdown,
  RecentEvent,
} from "@/features/demo/pulseops-demo-data";
import { getUsersData } from "@/features/users/get-users-data";

const healthPartDefinitions = [
  {
    key: "recentActivityPoints",
    label: "Recent activity",
    max: 40,
    note: "How fresh the account's latest product signal is.",
  },
  {
    key: "frequencyPoints",
    label: "Frequency",
    max: 25,
    note: "Whether usage is regular enough to look intentional.",
  },
  {
    key: "funnelPoints",
    label: "Funnel progress",
    max: 20,
    note: "How far users moved through the activation journey.",
  },
  {
    key: "keyEventPoints",
    label: "Key events",
    max: 15,
    note: "Whether the account used the product actions that matter most.",
  },
] as const;

export type CompanyDetailData = {
  activationNarrative: string;
  company: CompanySummary;
  eventSummary: ReturnType<typeof summarizeEventStatuses>;
  healthParts: ReturnType<typeof buildHealthParts>;
  lastCalculationLabel: string;
  projectName: string;
  recentEvents: RecentEvent[];
  recoveryPriority: ReturnType<typeof getRecoveryPriority>;
  recommendedAction: string;
  source: "postgres" | "demo";
  sourceNote: string;
  trackedUsers: Awaited<ReturnType<typeof getUsersData>>["users"];
};

export async function getCompanyDetailData(
  companyId: string,
): Promise<CompanyDetailData | null> {
  const [dashboardData, usersData] = await Promise.all([
    getDashboardData(),
    getUsersData(),
  ]);
  const company = dashboardData.companies.find((item) => item.id === companyId);

  if (!company) {
    return null;
  }

  const recentEvents = dashboardData.recentEvents.filter((event) =>
    isSameCompany(event.company, company.name),
  );
  const trackedUsers = usersData.users.filter((user) =>
    isSameCompany(user.company, company.name),
  );

  return {
    activationNarrative: getActivationNarrative(company),
    company,
    eventSummary: summarizeEventStatuses(recentEvents),
    healthParts: buildHealthParts(company.healthBreakdown),
    lastCalculationLabel: dashboardData.lastCalculationLabel,
    projectName: dashboardData.projectName,
    recentEvents,
    recoveryPriority: getRecoveryPriority(company),
    recommendedAction: getRecommendedAction(company),
    source: dashboardData.source,
    sourceNote: dashboardData.sourceNote,
    trackedUsers,
  };
}

export function buildHealthParts(breakdown: HealthScoreBreakdown) {
  return healthPartDefinitions.map((part) => {
    const points = breakdown[part.key];
    const width = Math.round((Math.min(points, part.max) / part.max) * 100);

    return {
      ...part,
      points,
      width: Math.max(0, width),
    };
  });
}

export function summarizeEventStatuses(events: RecentEvent[]) {
  return {
    accepted: events.filter((event) => event.status === "accepted").length,
    ignored: events.filter((event) => event.status === "ignored").length,
    rejected: events.filter((event) => event.status === "rejected").length,
    total: events.length,
  };
}

export function getRecoveryPriority(company: CompanySummary) {
  if (company.status === "silent") {
    return {
      label: "Critical",
      note: "No reliable activity rhythm remains.",
      tone: "danger" as const,
    };
  }

  if (company.status === "at_risk" || company.score < 50) {
    return {
      label: "High",
      note: "The account still has signal, but the pattern is weak.",
      tone: "warning" as const,
    };
  }

  if (company.status === "watch") {
    return {
      label: "Monitor",
      note: "The account is usable, but one signal needs attention.",
      tone: "neutral" as const,
    };
  }

  return {
    label: "Maintain",
    note: "The account rhythm looks stable.",
    tone: "good" as const,
  };
}

export function getRecommendedAction(company: CompanySummary) {
  if (company.status === "silent") {
    return "Check whether this customer still sends events, then contact the owner with the last known activation step.";
  }

  if (company.status === "at_risk") {
    return `Start with ${company.activationStep}: the score suggests the account is losing momentum before or around that action.`;
  }

  if (company.status === "watch") {
    return "Keep the account visible for the next calculation cycle and look for a repeated drop in key-event usage.";
  }

  return "Use this account as a reference rhythm: regular activity, stable score, and no urgent recovery action.";
}

function getActivationNarrative(company: CompanySummary) {
  if (company.status === "healthy") {
    return "This account is activated and still showing a reliable product rhythm.";
  }

  if (company.status === "watch") {
    return "This account is active, but one part of the rhythm deserves a closer look.";
  }

  if (company.status === "at_risk") {
    return "This account still has product signal, but activation or recurring usage is weakening.";
  }

  return "This account has gone quiet enough that the next step is recovery, not optimization.";
}

function isSameCompany(left: string, right: string) {
  return normalizeCompanyName(left) === normalizeCompanyName(right);
}
