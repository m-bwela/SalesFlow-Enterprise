import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

export interface AdminTablePageProps {
  title: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, string | number | null | undefined>>;
  action?: ReactNode;
}

export function AdminTablePage({
  title,
  description,
  columns,
  rows,
  action,
}: AdminTablePageProps) {
  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <DashboardHeader title={title} description={description} />
            {action ? <div>{action}</div> : null}
          </div>

          <div className="overflow-hidden rounded-lg border bg-background">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="px-4 py-3 font-medium text-muted-foreground">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rowIndex) => (
                      <tr key={`${title}-${rowIndex}`} className="border-t">
                        {columns.map((column) => (
                          <td key={`${title}-${rowIndex}-${column}`} className="px-4 py-3 align-middle">
                            {row[column] ?? "-"}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
