import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar";
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { RoleCode } from "../../types/auth";

interface NavItem {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
}

function getPrimaryNavigation(role: RoleCode): NavItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
        { title: "Users", url: "/admin/users", icon: Users },
        { title: "Organization", url: "/admin/organization", icon: Building2 },
        { title: "Outlets", url: "/admin/outlets", icon: Store },
        { title: "Products", url: "/admin/products", icon: Package },
        { title: "Inventory", url: "/admin/inventory", icon: Warehouse },
        { title: "Sales", url: "/admin/sales", icon: ShoppingCart },
        { title: "Reports", url: "/admin/reports", icon: FileBarChart },
      ];

    case "RSM":
      return [
        { title: "Dashboard", url: "/rsm", icon: LayoutDashboard },
        { title: "Territories", url: "/rsm/territories", icon: Building2 },
        { title: "Team", url: "/rsm/team", icon: Users },
        { title: "Outlets", url: "/rsm/outlets", icon: Store },
        { title: "Sales", url: "/rsm/sales", icon: ShoppingCart },
        { title: "Reports", url: "/rsm/reports", icon: FileBarChart },
      ];

    case "GT_TSM":
    case "MT_TSM":
      return [
        { title: "Dashboard", url: "/tsm", icon: LayoutDashboard },
        { title: "Team", url: "/tsm/team", icon: Users },
        { title: "Outlets", url: "/tsm/outlets", icon: Store },
        { title: "Sales", url: "/tsm/sales", icon: ShoppingCart },
        { title: "Targets", url: "/tsm/targets", icon: ClipboardList },
        { title: "Reports", url: "/tsm/reports", icon: FileBarChart },
      ];

    case "MTSR":
      return [
        { title: "Dashboard", url: "/mtsr", icon: LayoutDashboard },
        { title: "My Outlets", url: "/mtsr/outlets", icon: Store },
        { title: "Sales", url: "/mtsr/sales", icon: ShoppingCart },
        { title: "Reports", url: "/mtsr/reports", icon: FileBarChart },
      ];

    case "ASR":
      return [
        { title: "Dashboard", url: "/asr", icon: LayoutDashboard },
        { title: "My Outlets", url: "/asr/outlets", icon: Store },
        { title: "Today's Sales", url: "/asr/sales", icon: ShoppingCart },
        { title: "Stock", url: "/asr/stock", icon: Boxes },
        { title: "Targets", url: "/asr/targets", icon: BarChart3 },
        { title: "Reports", url: "/asr/reports", icon: FileBarChart },
      ];

    default:
      return [];
  }
}

export function Sidebar() {
  const { auth } = useAuth();
  const role = auth?.roles[0]?.code;
  const navigation = role ? getPrimaryNavigation(role) : [];

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SF
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">SalesFlow</span>
            <span className="text-xs text-muted-foreground">Enterprise</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link to={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Tasks">
                  <Link to="/tasks">
                    <ClipboardList />
                    <span>Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link to="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {auth?.user.displayName}
          <div>&copy; {new Date().getFullYear()} SalesFlow. All rights reserved.</div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
}