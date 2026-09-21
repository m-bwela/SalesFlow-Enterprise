import { ComponentType } from "react";
import {
    Activity,
    BarChart3,
    Boxes,
    Building2,
    ClipboardCheck,
    FileBarChart,
    Gauge,
    History,
    LayoutDashboard,
    Package,
    QrCode,
    Search,
    Settings,
    ShieldCheck,
    Store,
    Users,
    UserCog,
    UserRoundCheck,
    Warehouse,
    Workflow,
    BarChart2,
} from "lucide-react";
import type { RoleCode } from "../types/auth";

export interface NavigationItem {
    title: string;
    url: string;
    icon: ComponentType<{ className?: string }>;
}

export interface NavigationGroup {
    title: string;
    items: NavigationItem[];
}

export interface RoleNavigation {
    role: RoleCode;
    groups: NavigationGroup[];
}

export const adminNavigation: NavigationGroup[] = [
    {
        title: "Overview",
        items: [
            {
                title: "Dashboard",
                url: "/admin",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "People & Access",
        items: [
            {
                title: "User Management",
                url: "/admin/users",
                icon: Users,
            },
            {
                title: "Online Users",
                url: "/admin/online-users",
                icon: UserRoundCheck,
            },
            {
                title: "User Activity",
                url: "/admin/user-activity",
                icon: Activity,
            },
            {
                title: "Role Management",
                url: "/admin/roles",
                icon: ShieldCheck,
            },
            {
                title: "ASR Management",
                url: "/admin/asr-management",
                icon: UserCog,
            },
            {
                title: "User Impersonation",
                url: "/admin/impersonation",
                icon: UserRoundCheck,
            },
        ],
    },
    
    {
        title: "Organization",
        items: [
            {
                title: "Organization Structure",
                url: "/admin/organization",
                icon: Building2,
            },
            {
                title: "Regions",
                url: "/admin/regions",
                icon: Building2,
            },
            {
                title: "Territories",
                url: "/admin/territories",
                icon: Building2,
            },
            {
                title: "Distributors",
                url: "/admin/distributors",
                icon: Store,
            },
            {
                title: "Warehouses",
                url: "/admin/warehouses",
                icon: Warehouse,
            },
        ],
    },

    {
        title: "Master Data",
        items: [
            {
                title: "Products",
                url: "/admin/products",
                icon: Package,
            },
            {
                title: "Outlets",
                url: "/admin/outlets",
                icon: Store,
            },
            {
                title: "Routes",
                url: "/admin/routes",
                icon: Workflow,
            },
            {
                title: "Assests",
                url: "/admin/assets",
                icon: Boxes,
            },
        ],
    },

    {
        title: "Sales & Performance",
        items: [
            {
                title: "Sales Dashboard",
                url: "/admin/sales",
                icon: BarChart3,
            },
            {
                title: "Performance Monitoring",
                url: "/admin/performance",
                icon: Gauge,
            },
            {
                title: "Analytics",
                url: "/admin/analytics",
                icon: BarChart3,
            },
        ],
    },

    {
        title: "Operations",
        items: [
            {
                title: "Route Approvals",
                url: "/admin/route-approvals",
                icon:ClipboardCheck,
            },
            {
                title: "Asset Inventory",
                url: "/admin/assest-inventory",
                icon: Boxes,
            },
            {
                title: "Shift Configuration",
                url: "/admin/shifts",
                icon: Workflow,
            },
        ],
    },

    {
        title: "Reports",
        items: [
            {
                title: "Reports",
                url: "/admin/reports",
                icon: FileBarChart,
            },
        ],
    },

    {
        title: "Monitoring",
        items: [
            {
                title: "Activity Monitoring",
                url: "/admin/activity",
                icon: Activity,
            },
            {
                title: "System Health",
                url: "/admin/system-health",
                icon: Gauge,
            },
        ],
    },

    {
        title: "Audit & Security",
        items: [
            {
                title: "Audit Logs",
                url: "/admin/audit",
                icon: History,
            },
        ],
    },

    {
        title: "Tools",
        items: [
            {
                title: "Search",
                url: "/admin/search",
                icon: Search,
            },
            {
                title: "QR Code Generation",
                url: "/admin/qr-codes",
                icon: QrCode,
            },
            {
                title: "System Support",
                url: "/admin/support",
                icon: ShieldCheck,
            },
        ],
    },

    {
        title: "System",
        items: [
            {
                title: "System Configuration",
                url: "/admin/configuration",
                icon: Settings,
            },
        ],
    },
];