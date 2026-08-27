"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ActivityPoint = {
  day: string;
  events: number;
  accounts: number;
};

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const coolingPoint = findLargestCoolingPoint(data);

  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart
          data={data}
          margin={{ bottom: 0, left: -16, right: 16, top: 16 }}
        >
          <defs>
            <linearGradient id="events-signal" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="accounts-signal" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--healthy)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--healthy)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border-soft)"
            strokeDasharray="1 10"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="day"
            minTickGap={24}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
          />
          {coolingPoint ? (
            <ReferenceLine
              label={{
                fill: "var(--critical-ink)",
                fontSize: 11,
                position: "insideTopRight",
                value: "cooling signal",
              }}
              stroke="var(--critical)"
              strokeDasharray="3 5"
              x={coolingPoint.day}
            />
          ) : null}
          <Tooltip
            contentStyle={{
              background: "var(--surface-night)",
              border: "1px solid var(--border-inverse)",
              borderRadius: "var(--radius-sm)",
              color: "var(--paper)",
            }}
            cursor={{
              stroke: "var(--signal)",
              strokeDasharray: "3 5",
            }}
          />
          <Area
            activeDot={{
              r: 4,
              stroke: "var(--surface-night)",
              strokeWidth: 1,
            }}
            dataKey="events"
            dot={{ fill: "var(--signal)", r: 2, strokeWidth: 0 }}
            fill="url(#events-signal)"
            name="Events"
            stroke="var(--signal)"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            dataKey="accounts"
            dot={false}
            fill="url(#accounts-signal)"
            name="Active accounts"
            stroke="var(--healthy)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function findLargestCoolingPoint(data: ActivityPoint[]) {
  let largestDrop = 0;
  let coolingPoint: ActivityPoint | null = null;

  for (let index = 1; index < data.length; index += 1) {
    const previous = data[index - 1];
    const current = data[index];
    const drop = previous.events - current.events;

    if (drop > largestDrop) {
      largestDrop = drop;
      coolingPoint = current;
    }
  }

  return largestDrop > 0 ? coolingPoint : null;
}
