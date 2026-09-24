import { useEffect, useState } from "react";

import { getAdminDashboard } from "@/services/dashboard.service";
import { AdminDashboardData } from "@/services/dashboard.service";

import { BarChart3, ShoppingCart, Store, Users } from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import { PageContainer } from "../../components/layout/PageContainer";

import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardFilters as DashboardFiltersComponent } from "@/components/dashboard/DashboardFilter";
import type { DashboardFilters } from "@/types/dashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesTrend } from "@/components/dashboard/SalesTrend";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SystemHealth } from "@/components/dashboard/SystemHealth";

export function AdminDashboard() {

    const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<DashboardFilters>({period: "1M"});

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError(null);

                const data = await getAdminDashboard(filters);

                setDashboard(data);
            } catch (err) {
                console.error(err);

                setError("Unable to load dashboard data.");
            } finally {
                setLoading(false);
            }
        }

        void loadDashboard();
    }, [filters]);

    return (
        <AppShell>
            <PageContainer>
                <div className="space-y-6">
                    <DashboardHeader 
                        title="Admin Dashboard"
                        description="System-wide sales and operational overview"
                    />

                    {loading && (
                        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                            Loading dashboard...
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <DashboardFiltersComponent
                        onApply={(nextFilters: DashboardFilters) => {
                            setFilters(nextFilters);
                        }}
                    />

                    {dashboard && (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <KpiCard 
                                title="Users"
                                value={dashboard.users.toLocaleString()}
                                description="Active Users"
                                icon={Users}
                            />

                            <KpiCard 
                                title="Online Users"
                                value={dashboard.onlineUsers.toLocaleString()}
                                description="Active within the last 5 minutes"
                                icon={Users}
                            />

                            <KpiCard 
                                title="Outlets"
                                value={dashboard.outlets.toLocaleString()}
                                description="Registered outlets"
                                icon={Store}
                            />

                            <KpiCard 
                                title="Sales"
                                value={`${dashboard.sales.currency} ${dashboard.sales.amount.toLocaleString()}`}
                                description="Selected Period"
                                icon={ShoppingCart}
                            />
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-3">
                        <div className="xl:col-span-2">
                            <SalesTrend />
                        </div>

                        <KpiCard 
                            title="Orders"
                            value={dashboard?.orders.toLocaleString() ?? "0"}
                            description="Orders in selected period"
                            icon={BarChart3}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <RecentActivity />
                        <SystemHealth />
                    </div>
                </div>
            </PageContainer>
        </AppShell>
    );
}
