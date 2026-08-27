export type CompanyHealthStatus = "healthy" | "watch" | "at_risk" | "silent";

export type HealthInput = {
  calculatedAt: Date;
  inactivityThresholdDays: number;
  keyEvents: number;
  lastSeenAt: Date | null;
  recentEvents: number;
  reachedSteps: number;
  totalSteps: number;
};

export type HealthScoreResult = {
  frequencyPoints: number;
  funnelPoints: number;
  keyEventPoints: number;
  reasons: string[];
  recentActivityPoints: number;
  score: number;
  status: CompanyHealthStatus;
};

export function calculateHealth(input: HealthInput): HealthScoreResult {
  const inactiveDays = input.lastSeenAt
    ? Math.floor(
        (input.calculatedAt.getTime() - input.lastSeenAt.getTime()) /
          86_400_000,
      )
    : Number.POSITIVE_INFINITY;

  const recentActivityPoints = calculateRecentActivityPoints(
    inactiveDays,
    input.inactivityThresholdDays,
  );
  const frequencyPoints = calculateFrequencyPoints(input.recentEvents);
  const funnelPoints = calculateFunnelPoints(
    input.reachedSteps,
    input.totalSteps,
  );
  const keyEventPoints = calculateKeyEventPoints(input.keyEvents);
  const score = Math.min(
    100,
    recentActivityPoints + frequencyPoints + funnelPoints + keyEventPoints,
  );
  const status = inferStatus(score, inactiveDays, input.inactivityThresholdDays);

  return {
    score,
    status,
    recentActivityPoints,
    frequencyPoints,
    funnelPoints,
    keyEventPoints,
    reasons: buildReasons(input, inactiveDays),
  };
}

export function calculateRecentActivityPoints(
  inactiveDays: number,
  inactivityThresholdDays: number,
) {
  if (inactiveDays <= 1) {
    return 40;
  }

  if (inactiveDays <= 3) {
    return 34;
  }

  if (inactiveDays <= 7) {
    return 26;
  }

  if (inactiveDays <= inactivityThresholdDays) {
    return 14;
  }

  return 0;
}

export function calculateFrequencyPoints(recentEvents: number) {
  if (recentEvents >= 20) {
    return 25;
  }

  if (recentEvents >= 8) {
    return 18;
  }

  if (recentEvents >= 3) {
    return 10;
  }

  if (recentEvents > 0) {
    return 5;
  }

  return 0;
}

export function calculateFunnelPoints(reachedSteps: number, totalSteps: number) {
  if (totalSteps <= 0) {
    return 0;
  }

  return Math.round((Math.min(reachedSteps, totalSteps) / totalSteps) * 20);
}

export function calculateKeyEventPoints(keyEvents: number) {
  if (keyEvents >= 2) {
    return 15;
  }

  if (keyEvents === 1) {
    return 10;
  }

  return 0;
}

export function inferStatus(
  score: number,
  inactiveDays: number,
  inactivityThresholdDays: number,
): CompanyHealthStatus {
  if (inactiveDays > inactivityThresholdDays) {
    return "silent";
  }

  if (score >= 75) {
    return "healthy";
  }

  if (score >= 55) {
    return "watch";
  }

  if (score >= 35) {
    return "at_risk";
  }

  return "silent";
}

function buildReasons(input: HealthInput, inactiveDays: number) {
  const reasons: string[] = [];

  if (!input.lastSeenAt) {
    reasons.push("No activity has been captured for this account yet.");
  } else if (inactiveDays > input.inactivityThresholdDays) {
    reasons.push(`No activity for ${inactiveDays} days.`);
  } else if (inactiveDays > 7) {
    reasons.push("Activity is older than one week.");
  } else if (inactiveDays <= 1) {
    reasons.push("Recent activity is still in rhythm.");
  }

  if (input.recentEvents < 3) {
    reasons.push("Fewer than 3 events in the last 14 days.");
  }

  if (input.totalSteps > 0 && input.reachedSteps < input.totalSteps) {
    reasons.push(
      `Reached ${input.reachedSteps}/${input.totalSteps} activation steps.`,
    );
  }

  if (input.keyEvents === 0) {
    reasons.push("No key activation event in the last 14 days.");
  }

  return reasons.length > 0 ? reasons : ["Account activity is stable."];
}
