"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeverityTrendDay } from "@/lib/analytics";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { DashboardWidget } from "./Panel";

const LINES = [
  { key: "critical" as const, color: "#ff4d4d", labelKey: "dashboard.severity.critical" as const },
  { key: "high" as const, color: "#ff944d", labelKey: "dashboard.severity.high" as const },
  { key: "medium" as const, color: "#ffc14d", labelKey: "dashboard.severity.medium" as const },
  { key: "low" as const, color: "#4d94ff", labelKey: "dashboard.severity.low" as const },
];

interface Props {
  data: SeverityTrendDay[];
}

export default function IncidentTrendChart({ data }: Props) {
  const { t } = useLocale();
  const { theme } = useTheme();

  const gridColor = theme === "dark" ? "#2a2a2a" : "#e5e5e5";
  const tickColor = theme === "dark" ? "#8a8a8a" : "#737373";
  const hasData = data.some((d) => d.critical + d.high + d.medium + d.low > 0);

  return (
    <DashboardWidget title={t("dashboard.trendTitle")} className="min-h-[320px]">
      {!hasData ? (
        <p className="flex h-[260px] items-center justify-center text-sm text-mute">
          {t("dashboard.noData")}
        </p>
      ) : (
        <>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: tickColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: theme === "dark" ? "#1a1a1a" : "#ffffff",
                    border: `1px solid ${gridColor}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                {LINES.map(({ key, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 px-1">
            {LINES.map(({ key, color, labelKey }) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-mute">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {t(labelKey)}
              </span>
            ))}
          </div>
        </>
      )}
    </DashboardWidget>
  );
}
