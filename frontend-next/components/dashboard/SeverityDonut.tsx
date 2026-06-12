"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { SeveritySlice } from "@/lib/analytics";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";
import { DashboardWidget } from "./Panel";

const LABEL_KEYS: Record<SeveritySlice["key"], TranslationKey> = {
  critical: "dashboard.severity.critical",
  high: "dashboard.severity.high",
  medium: "dashboard.severity.medium",
  low: "dashboard.severity.low",
  info: "dashboard.severity.info",
};

interface Props {
  data: SeveritySlice[];
}

export default function SeverityDonut({ data }: Props) {
  const { t } = useLocale();
  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = data.filter((d) => d.count > 0);

  return (
    <DashboardWidget title={t("dashboard.severityTitle")} className="min-h-[300px]">
      {total === 0 ? (
        <p className="flex h-[240px] items-center justify-center text-sm text-mute">
          {t("dashboard.noData")}
        </p>
      ) : (
        <>
          <div className="mx-auto h-[160px] w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="key"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 px-2">
            {data.map((slice) => (
              <div key={slice.key} className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-wide text-mute">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: slice.color }}
                  />
                  {t(LABEL_KEYS[slice.key])}
                </span>
                <span className="text-sm font-semibold tabular-nums text-ink">{slice.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardWidget>
  );
}
