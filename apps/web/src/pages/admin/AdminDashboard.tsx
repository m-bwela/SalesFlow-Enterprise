import { BarChart3, ShoppingCart, Store, Users } from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import { PageContainer } from "../../components/layout/PageContainer";

import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardFilters } from "@/components/dashboard/DashboardFilter";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesTrend } from "@/components/dashboard/SalesTrend";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SystemHealth } from "@/components/dashboard/SystemHealth";

export function AdminDashboard() {
    return (
        <AppShell>
            <PageContainer>
                <div className="space-y-6">
                    <DashboardHeader 
                        title="Admin Dashboard"
                        description="System-wide sales and operational overview"
                    />

                    <DashboardFilters />

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard 
                            title="Users"
                            value="124"
                            description="Total registered users"
                            icon={Users}
                        />

                        <KpiCard 
                            title="Online Users"
                            value="18"
                            description="Currently active"
                            icon={Users}
                        />

                        <KpiCard 
                            title="Outlets"
                            value="2,482"
                            description="Registered outlets"
                            icon={Store}
                        />

                        <KpiCard 
                            title="Sales"
                            value="KES 7.8M"
                            description="Selected period"
                            icon={ShoppingCart}
                        />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-3">
                        <div className="xl:col-span-2">
                            <SalesTrend />
                        </div>

                        <KpiCard 
                            title="Orders"
                            value="3,439"
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
