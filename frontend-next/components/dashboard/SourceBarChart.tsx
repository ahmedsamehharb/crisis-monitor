"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SourceChartPoint } from "@/lib/analytics";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { DashboardWidget } from "./Panel";

interface Props {
  data: SourceChartPoint[];
}

export default function SourceBarChart({ data }: Props) {
  const { t } = useLocale();
  const { theme } = useTheme();

  const gridColor = theme === "dark" ? "#2a2a2a" : "#e5e5e5";
  const tickColor = theme === "dark" ? "#8a8a8a" : "#737373";
  const barColor = "#4d94ff";

  return (
    <DashboardWidget title={t("dashboard.sourcesTitle")} className="min-h-[300px]">
      {data.length === 0 ? (
        <p className="flex h-[240px] items-center justify-center text-sm text-mute">
          {t("dashboard.noData")}
        </p>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: tickColor, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={56}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: tickColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: theme === "dark" ? "#1a1a1a" : "#ffffff",
                  border: `1px solid ${gridColor}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, _name, item) => [
                  String(value),
                  String(item.payload?.name ?? ""),
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {data.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.count > 0 ? barColor : `${barColor}44`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardWidget>
  );
}
