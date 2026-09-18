import type { ReactNode } from "react";
import { SidebarProvider } from "../ui/sidebar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar />

                    <main className="flex-1 p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}