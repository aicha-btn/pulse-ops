import { loadEnvConfig } from "@next/env";
import { pathToFileURL } from "url";

import { closeDatabaseConnection, getDatabase } from "../src/db/client";
import {
  activationFunnelSteps,
  activationFunnels,
  apiKeys,
  projects,
  workspaces,
  type JsonObject,
} from "../src/db/schema";
import {
  API_KEY_PREFIX,
  generateApiKey,
  getApiKeyLastFour,
  hashApiKey,
} from "../src/features/ingestion/api-key";
import { storeTrackEvent } from "../src/features/ingestion/store-track-event";
import type { NormalizedTrackEvent } from "../src/features/ingestion/track-payload";

loadEnvConfig(process.cwd());

const workspaceSlug = "pulseops-demo";
const projectSlug = "northstar-demo";

type Plan = "starter" | "growth" | "scale";
type ActivityProfile =
  | "healthy"
  | "steady"
  | "cooling"
  | "watch"
  | "at_risk"
  | "silent";

type UserSeed = {
  externalId: string;
  email: string;
  name: string;
  role: "founder" | "ops" | "pm" | "engineer" | "success";
};

type CompanySeed = {
  externalId: string;
  name: string;
  plan: Plan;
  industry: string;
  seats: number;
  startsDaysAgo: number;
  stoppedDaysAgo: number;
  activationDepth: 1 | 2 | 3 | 4;
  profile: ActivityProfile;
  users: UserSeed[];
};

const funnelSteps = [
  "signed_up",
  "project_created",
  "api_key_created",
  "first_event_sent",
] as const;

const ongoingEvents = [
  "dashboard_viewed",
  "account_filtered",
  "health_score_opened",
  "report_shared",
  "teammate_invited",
  "alert_rule_created",
  "export_downloaded",
  "integration_checked",
] as const;

const preActivationEvents = [
  "docs_viewed",
  "api_key_copied",
  "integration_error_seen",
] as const;

const companies: CompanySeed[] = [
  {
    externalId: "company_northstar_labs",
    name: "Northstar Labs",
    plan: "scale",
    industry: "Analytics infrastructure",
    seats: 42,
    startsDaysAgo: 88,
    stoppedDaysAgo: 0,
    activationDepth: 4,
    profile: "healthy",
    users: [
      {
        externalId: "user_northstar_founder",
        email: "founder@northstar.example",
        name: "Mara Chen",
        role: "founder",
      },
      {
        externalId: "user_northstar_ops",
        email: "ops@northstar.example",
        name: "Noah Silva",
        role: "ops",
      },
      {
        externalId: "user_northstar_engineer",
        email: "eng@northstar.example",
        name: "Iris Laurent",
        role: "engineer",
      },
    ],
  },
  {
    externalId: "company_copperline_crm",
    name: "Copperline CRM",
    plan: "growth",
    industry: "Sales operations",
    seats: 21,
    startsDaysAgo: 82,
    stoppedDaysAgo: 3,
    activationDepth: 4,
    profile: "cooling",
    users: [
      {
        externalId: "user_copperline_pm",
        email: "pm@copperline.example",
        name: "Elia Martin",
        role: "pm",
      },
      {
        externalId: "user_copperline_ops",
        email: "ops@copperline.example",
        name: "Samira Cole",
        role: "ops",
      },
    ],
  },
  {
    externalId: "company_rivetcloud",
    name: "RivetCloud",
    plan: "starter",
    industry: "Developer tools",
    seats: 8,
    startsDaysAgo: 74,
    stoppedDaysAgo: 17,
    activationDepth: 2,
    profile: "silent",
    users: [
      {
        externalId: "user_rivetcloud_founder",
        email: "founder@rivetcloud.example",
        name: "Jon Bell",
        role: "founder",
      },
    ],
  },
  {
    externalId: "company_vaultnest",
    name: "VaultNest",
    plan: "growth",
    industry: "Security operations",
    seats: 16,
    startsDaysAgo: 63,
    stoppedDaysAgo: 9,
    activationDepth: 3,
    profile: "at_risk",
    users: [
      {
        externalId: "user_vaultnest_founder",
        email: "founder@vaultnest.example",
        name: "Ari Novak",
        role: "founder",
      },
      {
        externalId: "user_vaultnest_engineer",
        email: "eng@vaultnest.example",
        name: "Lina Rao",
        role: "engineer",
      },
    ],
  },
  {
    externalId: "company_brightbeam",
    name: "Brightbeam",
    plan: "scale",
    industry: "Customer education",
    seats: 38,
    startsDaysAgo: 90,
    stoppedDaysAgo: 0,
    activationDepth: 4,
    profile: "steady",
    users: [
      {
        externalId: "user_brightbeam_ops",
        email: "ops@brightbeam.example",
        name: "Amina Reed",
        role: "ops",
      },
      {
        externalId: "user_brightbeam_success",
        email: "success@brightbeam.example",
        name: "Theo Banks",
        role: "success",
      },
      {
        externalId: "user_brightbeam_pm",
        email: "pm@brightbeam.example",
        name: "Nadia Park",
        role: "pm",
      },
    ],
  },
  {
    externalId: "company_meridian_ops",
    name: "Meridian Ops",
    plan: "growth",
    industry: "Internal tooling",
    seats: 24,
    startsDaysAgo: 69,
    stoppedDaysAgo: 1,
    activationDepth: 4,
    profile: "watch",
    users: [
      {
        externalId: "user_meridian_ops",
        email: "ops@meridian.example",
        name: "Celia Moss",
        role: "ops",
      },
      {
        externalId: "user_meridian_engineer",
        email: "eng@meridian.example",
        name: "Owen Fields",
        role: "engineer",
      },
    ],
  },
  {
    externalId: "company_arc_harbor",
    name: "Arc Harbor",
    plan: "starter",
    industry: "Logistics SaaS",
    seats: 11,
    startsDaysAgo: 50,
    stoppedDaysAgo: 0,
    activationDepth: 4,
    profile: "healthy",
    users: [
      {
        externalId: "user_archarbor_founder",
        email: "founder@archarbor.example",
        name: "Priya Stone",
        role: "founder",
      },
      {
        externalId: "user_archarbor_pm",
        email: "pm@archarbor.example",
        name: "Milo Grant",
        role: "pm",
      },
    ],
  },
  {
    externalId: "company_forgebase",
    name: "Forgebase",
    plan: "starter",
    industry: "Productivity",
    seats: 6,
    startsDaysAgo: 43,
    stoppedDaysAgo: 24,
    activationDepth: 1,
    profile: "silent",
    users: [
      {
        externalId: "user_forgebase_founder",
        email: "founder@forgebase.example",
        name: "Luis Ren",
        role: "founder",
      },
    ],
  },
];

async function main() {
  const db = getDatabase();
  const apiKey = process.env.SEED_DEMO_API_KEY || generateApiKey();

  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    throw new Error(`SEED_DEMO_API_KEY must start with ${API_KEY_PREFIX}.`);
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: "PulseOps Demo",
      slug: workspaceSlug,
    })
    .onConflictDoUpdate({
      target: workspaces.slug,
      set: {
        name: "PulseOps Demo",
        updatedAt: new Date(),
      },
    })
    .returning({
      id: workspaces.id,
    });

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId: workspace.id,
      name: "Northstar Analytics",
      slug: projectSlug,
      inactivityThresholdDays: 14,
    })
    .onConflictDoUpdate({
      target: [projects.workspaceId, projects.slug],
      set: {
        name: "Northstar Analytics",
        inactivityThresholdDays: 14,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: projects.id,
    });

  const apiKeyHash = hashApiKey(apiKey);

  await db
    .insert(apiKeys)
    .values({
      projectId: project.id,
      name: "Local demo ingestion key",
      keyPrefix: API_KEY_PREFIX,
      keyHash: apiKeyHash,
      lastFour: getApiKeyLastFour(apiKey),
      status: "active",
    })
    .onConflictDoUpdate({
      target: apiKeys.keyHash,
      set: {
        name: "Local demo ingestion key",
        status: "active",
        revokedAt: null,
      },
    });

  const [funnel] = await db
    .insert(activationFunnels)
    .values({
      projectId: project.id,
      name: "Activation",
      activationWindowDays: 14,
      isPrimary: true,
    })
    .onConflictDoUpdate({
      target: activationFunnels.projectId,
      set: {
        name: "Activation",
        activationWindowDays: 14,
        isPrimary: true,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: activationFunnels.id,
    });

  for (const [index, eventName] of funnelSteps.entries()) {
    await db
      .insert(activationFunnelSteps)
      .values({
        funnelId: funnel.id,
        orderIndex: index,
        eventName,
        label: eventName,
      })
      .onConflictDoUpdate({
        target: [
          activationFunnelSteps.funnelId,
          activationFunnelSteps.orderIndex,
        ],
        set: {
          eventName,
          label: eventName,
        },
      });
  }

  const seedResult = await seedRealisticEvents(apiKey);

  console.log("PulseOps demo seed complete.");
  console.log(`Workspace: ${workspaceSlug}`);
  console.log(`Project: ${projectSlug}`);
  console.log(`Companies: ${companies.length}`);
  console.log(`Events requested: ${seedResult.requested}`);
  console.log(`Events stored: ${seedResult.stored}`);
  console.log(`Duplicates ignored: ${seedResult.duplicateIgnored}`);
  console.log(`Demo API key: ${apiKey}`);
  console.log(
    "Add it to .env.local as NEXT_PUBLIC_INGESTION_TEST_KEY for the landing tester.",
  );
  console.log("Then run npm run jobs:aggregate to refresh rollup metrics.");
}

async function seedRealisticEvents(apiKey: string) {
  const anchorDate = getSeedAnchorDate();
  const events = companies
    .flatMap((company) => buildCompanyEvents(company, anchorDate))
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());

  let stored = 0;
  let duplicateIgnored = 0;

  for (const event of events) {
    const result = await storeTrackEvent(apiKey, event);

    if (!result.ok) {
      throw new Error(result.message);
    }

    if (result.status === "stored") {
      stored += 1;
    } else {
      duplicateIgnored += 1;
    }
  }

  return {
    requested: events.length,
    stored,
    duplicateIgnored,
  };
}

export function previewSeedDataset(anchorDate = getSeedAnchorDate()) {
  const events = companies.flatMap((company) =>
    buildCompanyEvents(company, anchorDate),
  );
  const userIds = new Set(
    companies.flatMap((company) => company.users.map((user) => user.externalId)),
  );

  return {
    companies: companies.length,
    users: userIds.size,
    events: events.length,
  };
}

function buildCompanyEvents(
  company: CompanySeed,
  anchorDate: Date,
): NormalizedTrackEvent[] {
  return [
    ...buildActivationEvents(company, anchorDate),
    ...buildUsageEvents(company, anchorDate),
  ];
}

function buildActivationEvents(company: CompanySeed, anchorDate: Date) {
  return funnelSteps
    .slice(0, company.activationDepth)
    .map((eventName, index): NormalizedTrackEvent => {
      const daysAgo = Math.max(company.stoppedDaysAgo, company.startsDaysAgo - index * 2);
      const occurredAt = dateDaysAgo(anchorDate, daysAgo, 9 + index, index * 11);
      const user = company.users[0];

      return {
        eventId: buildEventId(company, occurredAt, eventName, index),
        eventName,
        occurredAt,
        receivedAt: receivedShortlyAfter(occurredAt, index),
        user: buildUser(user),
        company: buildCompany(company),
        properties: {
          source: "seed_activation",
          step_number: index + 1,
          activation_depth: company.activationDepth,
        },
      };
    });
}

function buildUsageEvents(company: CompanySeed, anchorDate: Date) {
  const events: NormalizedTrackEvent[] = [];

  for (
    let daysAgo = company.startsDaysAgo;
    daysAgo >= company.stoppedDaysAgo;
    daysAgo -= 1
  ) {
    if (!shouldCreateActivity(company, daysAgo)) {
      continue;
    }

    const volume = dailyEventVolume(company, daysAgo);

    for (let index = 0; index < volume; index += 1) {
      const eventName = chooseUsageEvent(company, daysAgo, index);
      const occurredAt = dateDaysAgo(
        anchorDate,
        daysAgo,
        10 + (stableNumber(`${company.externalId}:${daysAgo}:${index}:hour`) % 8),
        stableNumber(`${company.externalId}:${daysAgo}:${index}:minute`) % 60,
      );
      const user = chooseUser(company, daysAgo, index);

      events.push({
        eventId: buildEventId(company, occurredAt, eventName, index),
        eventName,
        occurredAt,
        receivedAt: receivedShortlyAfter(occurredAt, index),
        user: buildUser(user),
        company: buildCompany(company),
        properties: {
          source: "seed_usage",
          profile: company.profile,
          day_offset: daysAgo,
          sequence: index,
        },
      });
    }
  }

  return events;
}

function shouldCreateActivity(company: CompanySeed, daysAgo: number) {
  const chanceByProfile: Record<ActivityProfile, number> = {
    healthy: 66,
    steady: 56,
    cooling: daysAgo <= 21 ? 26 : 56,
    watch: daysAgo <= 14 ? 20 : 42,
    at_risk: 30,
    silent: 20,
  };

  return (
    stableNumber(`${company.externalId}:${daysAgo}:active`) % 100 <
    chanceByProfile[company.profile]
  );
}

function dailyEventVolume(company: CompanySeed, daysAgo: number) {
  const baseByProfile: Record<ActivityProfile, number> = {
    healthy: 3,
    steady: 3,
    cooling: daysAgo <= 21 ? 1 : 2,
    watch: daysAgo <= 14 ? 1 : 2,
    at_risk: 1,
    silent: 1,
  };
  const variance = stableNumber(`${company.externalId}:${daysAgo}:volume`) % 3;

  return baseByProfile[company.profile] + variance;
}

function chooseUsageEvent(
  company: CompanySeed,
  daysAgo: number,
  index: number,
) {
  const pool =
    company.activationDepth === funnelSteps.length
      ? ongoingEvents
      : preActivationEvents;

  return pool[
    stableNumber(`${company.externalId}:${daysAgo}:${index}:event`) % pool.length
  ];
}

function chooseUser(company: CompanySeed, daysAgo: number, index: number) {
  return company.users[
    stableNumber(`${company.externalId}:${daysAgo}:${index}:user`) %
      company.users.length
  ];
}

function buildCompany(company: CompanySeed) {
  return {
    externalId: company.externalId,
    name: company.name,
    traits: {
      plan: company.plan,
      industry: company.industry,
      seats: company.seats,
      profile: company.profile,
    } satisfies JsonObject,
  };
}

function buildUser(user: UserSeed) {
  return {
    externalId: user.externalId,
    email: user.email,
    name: user.name,
    traits: {
      role: user.role,
    } satisfies JsonObject,
  };
}

function buildEventId(
  company: CompanySeed,
  occurredAt: Date,
  eventName: string,
  index: number,
) {
  return [
    "evt_seed",
    company.externalId.replace("company_", ""),
    toDateKey(occurredAt).replaceAll("-", ""),
    eventName,
    String(index).padStart(2, "0"),
  ].join("_");
}

function getSeedAnchorDate() {
  const configuredDate = process.env.SEED_ANCHOR_DATE;
  const date = configuredDate ? new Date(configuredDate) : new Date();

  if (Number.isNaN(date.getTime())) {
    throw new Error("SEED_ANCHOR_DATE must be a valid date if provided.");
  }

  date.setUTCHours(14, 0, 0, 0);
  return date;
}

function dateDaysAgo(anchorDate: Date, daysAgo: number, hour: number, minute: number) {
  const date = new Date(anchorDate);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

function receivedShortlyAfter(occurredAt: Date, index: number) {
  return new Date(occurredAt.getTime() + 20_000 + index * 1_000);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function stableNumber(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
}
