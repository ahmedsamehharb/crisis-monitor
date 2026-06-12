"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  Flame,
  Pause,
} from "lucide-react";
import { useEvents } from "@/components/providers/EventsProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { KpiCard } from "@/components/dashboard/Panel";
import { fetchSources } from "@/lib/api";
import {
  buildSourceChartSeries,
  computeVostKpis,
  computeSeverityTrend,
  computeSeverityDistribution,
  computeRecentActivity,
  FALLBACK_DATA_SOURCES,
} from "@/lib/analytics";

const IncidentTrendChart = dynamic(
  () => import("@/components/dashboard/IncidentTrendChart"),
  { ssr: false, loading: () => <WidgetSkeleton /> }
);
const RecentActivity = dynamic(() => import("@/components/dashboard/RecentActivity"), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const SourceBarChart = dynamic(() => import("@/components/dashboard/SourceBarChart"), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const SeverityDonut = dynamic(() => import("@/components/dashboard/SeverityDonut"), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});

function WidgetSkeleton() {
  return <div className="dashboard-widget min-h-[300px] animate-pulse" />;
}

function formatBreadcrumb(locale: string, nowIso: string) {
  const d = new Date(nowIso);
  if (Number.isNaN(d.getTime())) return "VOST";
  return d.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { events, nowIso } = useEvents();
  const { t, locale } = useLocale();
  const [configuredSources, setConfiguredSources] = useState<{ id: string; label: string }[]>(
    FALLBACK_DATA_SOURCES
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchSources(ctrl.signal)
      .then((sources) => {
        if (sources.length > 0) setConfiguredSources(sources);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const nowMs = Date.parse(nowIso) || Date.now();
  const kpis = useMemo(() => computeVostKpis(events, nowMs), [events, nowMs]);
  const trend = useMemo(() => computeSeverityTrend(events, nowMs), [events, nowMs]);
  const sourceSeries = useMemo(
    () => buildSourceChartSeries(events, configuredSources),
    [events, configuredSources]
  );
  const severity = useMemo(() => computeSeverityDistribution(events), [events]);
  const activity = useMemo(() => computeRecentActivity(events, nowMs), [events, nowMs]);

  const dateLine = formatBreadcrumb(locale, nowIso);

  return (
    <div className="h-full overflow-auto bg-bg p-6">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
          {t("dashboard.breadcrumb")} · {dateLine.toUpperCase()}
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-ink">
          {t("dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-mute">{t("dashboard.subtitle")}</p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label={t("dashboard.kpi.activeVerified")}
          value={kpis.activeVerified}
          icon={AlertTriangle}
          accent="#3fb36b"
        />
        <KpiCard
          label={t("dashboard.kpi.pending")}
          value={kpis.pending}
          icon={Eye}
          accent="#ff944d"
        />
        <KpiCard
          label={t("dashboard.kpi.onHold")}
          value={kpis.onHold}
          icon={Pause}
          accent="#4d94ff"
        />
        <KpiCard
          label={t("dashboard.kpi.newReports")}
          value={kpis.newReports24h}
          icon={FileText}
        />
        <KpiCard
          label={t("dashboard.kpi.critical")}
          value={kpis.critical}
          icon={Flame}
          accent="#ff4d4d"
        />
        <KpiCard
          label={t("dashboard.kpi.avgTime")}
          value={kpis.avgVerificationMin}
          displayValue={`${kpis.avgVerificationMin}m`}
          icon={Clock}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_340px]">
        <IncidentTrendChart data={trend} />
        <RecentActivity items={activity} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SourceBarChart data={sourceSeries} />
        <SeverityDonut data={severity} />
      </div>
    </div>
  );
}
