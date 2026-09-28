import type { LucideIcon } from "lucide-react";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

export interface Metric {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export interface AdminSection {
  title: string;
  items: string[];
}

export interface AdminOverviewPageProps {
  title: string;
  description: string;
  metrics: Metric[];
  highlights?: string[];
  sections?: AdminSection[];
  nextActions?: string[];
}

export function AdminOverviewPage({
  title,
  description,
  metrics,
  highlights = [],
  sections,
  nextActions,
}: AdminOverviewPageProps) {
  const contentSections =
    sections && sections.length > 0
      ? sections
      : [{ title: "Operational snapshot", items: highlights }];

  const actions =
    nextActions && nextActions.length > 0
      ? nextActions
      : [
          "Confirm the latest sales and coverage data sync.",
          "Review route performance and approval queue.",
          "Validate user access and role assignments.",
          "Review stock and asset levels before the next cycle.",
        ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title={title} description={description} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <KpiCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                description={metric.description}
                icon={metric.icon}
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              {contentSections.map((section) => (
                <div key={section.title} className="rounded-xl border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">{section.title}</h2>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <p className="text-sm text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Next actions</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {actions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
