import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "../ui/sidebar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const location = useLocation();
    const [isRouteLoading, setIsRouteLoading] = useState(false);

    useEffect(() => {
        setIsRouteLoading(false);
    }, [location.pathname]);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar onNavigateStart={() => setIsRouteLoading(true)} />

                <div className="flex min-w-0 flex-1 flex-col">
                    <Topbar />

                    <main className="flex-1 p-6">
                        {isRouteLoading ? (
                            <div className="space-y-6 animate-in fade-in-0">
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-56" />
                                    <Skeleton className="h-4 w-96" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <div key={index} className="rounded-xl border bg-card p-5 shadow-sm">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="mt-4 h-8 w-20" />
                                            <Skeleton className="mt-3 h-3 w-28" />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                                        <Skeleton className="mb-4 h-6 w-40" />
                                        <div className="space-y-3">
                                            {Array.from({ length: 3 }).map((_, index) => (
                                                <div key={index} className="flex items-center gap-3 rounded-md border bg-muted/20 p-3">
                                                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                                                    <Skeleton className="h-4 w-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                                        <Skeleton className="mb-4 h-6 w-32" />
                                        <div className="space-y-3">
                                            {Array.from({ length: 4 }).map((_, index) => (
                                                <Skeleton key={index} className="h-4 w-full" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            children
                        )}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}