import { Sidebar as ShadcnSidebar, SidebarContent, SidebarHeader, SidebarRail } from "../ui/sidebar";

export function Sidebar() {
    return (
        <ShadcnSidebar>
            <SidebarHeader>
                <div className="px-2 py-2">
                    <div className="text-lg font-semibold">
                        SalesFlow
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Enterprise
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <div className="px-3 py-4 text-sm text-muted-foreground">
                    Navigation
                </div>
            </SidebarContent>

            <SidebarRail />
        </ShadcnSidebar>
    )
}