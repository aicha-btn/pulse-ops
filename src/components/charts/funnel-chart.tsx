"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FunnelStep = {
  step: string;
  users: number;
  rate: number;
};

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 22, right: 14, top: 16 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--border-soft)"
            strokeDasharray="1 10"
          />
          <XAxis
            axisLine={false}
            domain={[0, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={(value: number) => `${value}%`}
            tickLine={false}
            type="number"
          />
          <YAxis
            axisLine={false}
            dataKey="step"
            tick={{ fill: "var(--ink)", fontSize: 11 }}
            tickLine={false}
            type="category"
            width={116}
          />
          <ReferenceLine
            label={{
              fill: "var(--text-muted)",
              fontSize: 11,
              position: "insideTop",
              value: "50% threshold",
            }}
            stroke="var(--warning)"
            strokeDasharray="3 5"
            x={50}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-night)",
              border: "1px solid var(--border-inverse)",
              borderRadius: "var(--radius-sm)",
              color: "var(--paper)",
            }}
            cursor={{ fill: "rgba(34,223,197,0.06)" }}
          />
          <Bar
            background={{ fill: "rgba(23,18,26,0.045)" }}
            barSize={24}
            dataKey="rate"
            name="Conversion rate"
            radius={[0, 5, 5, 0]}
          >
            {data.map((step, index) => (
              <Cell
                fill={getStepColor(step.rate, index, data.length)}
                key={step.step}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function getStepColor(rate: number, index: number, totalSteps: number) {
  if (index === 0) {
    return "var(--signal)";
  }

  if (index === totalSteps - 1 && rate < 50) {
    return "var(--critical)";
  }

  if (rate < 60) {
    return "var(--warning)";
  }

  return "var(--signal)";
}
