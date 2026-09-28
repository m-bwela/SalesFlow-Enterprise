import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";
import { PortalRedirect } from "./routes/PortalRedirect";
import { LoginForm } from "./routes/Login-Form";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import {
  AnalyticsPage,
  ASRDashboardPage,
  ASRManagementPage,
  AssetInventoryPage,
  AssetsPage,
  InventoryPage,
  ModernTradeOutletsPage,
  ModernTradePerformancePage,
  ModernTradeSalesPage,
  ModernTradeTSMPage,
  OnlineUsersPage,
  OrganizationStructurePage,
  OutletsPage,
  PerformancePage,
  ProductsPage,
  ReportsPage,
  RouteActivityPage,
  RouteEffectivenessPage,
  RoutePlansPage,
  RoutesPage,
  SalesDashboardPage,
  UserActivityPage,
  UserImpersonationPage,
  WarehousesPage,
} from "./pages/admin/AdminModulePages";
import { RegionsPage } from "./pages/admin/RegionsPage";
import { TerritoriesPage } from "./pages/admin/TerritoriesPage";
import { DistributorsPage } from "./pages/admin/DistributorsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { RolesPage } from "./pages/admin/RolesPage";

function PageShell({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

function LoginPage() {
  return <LoginForm />;
}

function RegisterPage() {
  return <PageShell title="Register" />;
}

function RSMDashboard() {
  return <PageShell title="RSM Dashboard" />;
}

function TSMDashboard() {
  return <PageShell title="TSM Dashboard" />;
}

function MTSRDashboard() {
  return <PageShell title="MTSR Dashboard" />;
}

function ASRDashboard() {
  return <PageShell title="ASR Dashboard" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/portal" element={<PortalRedirect />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="sales-dashboard" element={<SalesDashboardPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="asr-dashboard" element={<ASRDashboardPage />} />
            <Route path="tsm-dashboard" element={<ASRDashboardPage />} />
            <Route path="routes/activity" element={<RouteActivityPage />} />
            <Route path="routes/effectiveness" element={<RouteEffectivenessPage />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="route-plans" element={<RoutePlansPage />} />
            <Route path="outlets" element={<OutletsPage />} />
            <Route path="organization" element={<OrganizationStructurePage />} />
            <Route path="regions" element={<RegionsPage />} />
            <Route path="territories" element={<TerritoriesPage />} />
            <Route path="distributors" element={<DistributorsPage />} />
            <Route path="warehouses" element={<WarehousesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="asr-management" element={<ASRManagementPage />} />
            <Route path="online-users" element={<OnlineUsersPage />} />
            <Route path="user-activity" element={<UserActivityPage />} />
            <Route path="impersonation" element={<UserImpersonationPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="asset-inventory" element={<AssetInventoryPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="modern-trade/performance" element={<ModernTradePerformancePage />} />
            <Route path="modern-trade/tsm" element={<ModernTradeTSMPage />} />
            <Route path="modern-trade/outlets" element={<ModernTradeOutletsPage />} />
            <Route path="modern-trade/sales" element={<ModernTradeSalesPage />} />
          </Route>

          <Route path="/rsm" element={<RoleRoute allowedRoles={["RSM"]} />}>
            <Route index element={<RSMDashboard />} />
          </Route>

          <Route path="/tsm" element={<RoleRoute allowedRoles={["GT_TSM", "MT_TSM"]} />}>
            <Route index element={<TSMDashboard />} />
          </Route>

          <Route path="/mtsr" element={<RoleRoute allowedRoles={["MTSR"]} />}>
            <Route index element={<MTSRDashboard />} />
          </Route>

          <Route path="/asr" element={<RoleRoute allowedRoles={["ASR"]} />}>
            <Route index element={<ASRDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;