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

export const rsmNavigation: NavigationGroup[] = [
    {
        title: "Overview",
        items: [
            {
                title: "Dashboard",
                url: "/rsm",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "Organization",
        items: [
            {
                title: "Territories",
                url: "/rsm/territories",
                icon: Building2,
            },
            {
                title: "Distributors",
                url: "/rsm/distributors",
                icon: Store,
            },
        ],
    },

    {
        title: "Team",
        items: [
            {
                title: "TSM Performance",
                url: "/rsm/team",
                icon: Users,
            },
            {
                title: "ASR Performance",
                url: "/rsm/asrs",
                icon: UserRoundCheck,
            },
            {
                title: "MTSR Performance",
                url: "/rsm/mtsrs",
                icon: UserRoundCheck,
            },
        ],
    },

    {
        title: "Sales & Performance",
        items: [
            {
                title: "Sales",
                url: "/rsm/sales",
                icon: BarChart3,
            },
            {
                title: "Targets",
                url: "/rsm/targets",
                icon: Gauge,
            },
            {
                title: "Outlets",
                url: "/rsm/outlets",
                icon: Store,
            },
        ],
    },

    {
        title: "Reports",
        items: [
            {
                title: "Reports",
                url: "/rsm/reports",
                icon: FileBarChart,
            },
        ],
    },
];

export const tsmNavigation: NavigationGroup[] = [
    {
        title: "Overview",
        items: [
            {
                title: "Dashboard",
                url: "/tsm",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "Team",
        items: [
            {
                title: "Team Members",
                url: "/tsm/team",
                icon: Users,
            },
            {
                title: "ASR Performance",
                url: "/tsm/asrs",
                icon: UserRoundCheck,
            },
        ],
    },
    {
        title: "Territory",
        items: [
            {
                title: "Outlets",
                url: "/tsm/outlets",
                icon: Store,
            },
            {
                title: "Routes",
                url: "/tsm/routes",
                icon: Workflow,
            },
        ],
    },

    {
        title: "Sales & Performance",
        items: [
            {
                title: "Sales",
                url: "/tsm/sales",
                icon: BarChart3,
            },
            {
                title: "Targets",
                url: "/tsm/targets",
                icon: Gauge,
            },
        ],
    },

    {
        title: "Reports",
        items: [
            {
                title: "Reports",
                url: "/tsm/reports",
                icon: FileBarChart,
            },
        ],
    },
];

export const mtsrNavigation: NavigationGroup[] = [
    {
        title: "Overview",
        items: [
            {
                title: "Dashboard",
                url: "/mtsr",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "My Work",
        items: [
            {
                title: "My Outlets",
                url: "/mtsr/outlets",
                icon: Store,
            },
            {
                title: "Routes",
                url: "/mtsr/routes",
                icon: Workflow,
            },
        ],
    },

    {
        title: "Sales",
        items: [
            {
                title: "Today's Sales",
                url: "/mtsr/sales",
                icon: BarChart3,
            },
            {
                title: "Targets",
                url: "/mtsr/targets",
                icon: Gauge,
            },
            {
                title: "Performance",
                url: "/mtsr/performance",
                icon: BarChart3,
            },
        ],
    },

    {
        title: "Reports",
        items: [
            {
                title: "Reports",
                url: "/mtsr/reports",
                icon: FileBarChart,
            },
        ],
    },
];

export const asrNavigation: NavigationGroup[] = [
    {
        title: "Overview",
        items: [
            {
                title: "Dashboard",
                url: "/asr",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "My Work",
        items: [
            {
                title: "My Outlets",
                url: "/asr/outlets",
                icon: Store,
            },
            {
                title: "Routes",
                url: "/asr/routes",
                icon: Workflow,
            },
            {
                title: "Today's Sales",
                url: "/asr/sales",
                icon: BarChart3,
            },
        ],
    },

    {
        title: "Stock",
        items: [
            {
                title: "My Stock",
                url: "/asr/stock",
                icon: Boxes,
            },
            {
                title: "Stock Returns",
                url: "/asr/stock-returns",
                icon: Warehouse,
            },
        ],
    },

    {
        title: "Performance",
        items: [
            {
                title: "Targets",
                url: "/asr/targets",
                icon: Gauge,
            },
            {
                title: "Performance",
                url: "/asr/performance",
                icon: BarChart3,
            },
        ],
    },
    {
        title: "Reports",
        items: [
            {
                title: "Reports",
                url: "/asr/reports",
                icon: FileBarChart,
            },
        ],
    },
];

export function getNavigationForRole(role: RoleCode): NavigationGroup[] {
    switch (role) {
        case "ADMIN":
            return adminNavigation;

        case "RSM":
            return rsmNavigation;

        case "GT_TSM":
        case "MT_TSM":
            return tsmNavigation;

        case "MTSR":
            return mtsrNavigation;

        case "ASR":
            return asrNavigation;
    
        default:
            return [];
    }
}