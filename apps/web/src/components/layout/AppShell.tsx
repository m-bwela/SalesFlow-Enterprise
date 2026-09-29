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
                            <div className="animate-[fadeIn_0.25s_ease-out] space-y-6">
                                <div className="rounded-2xl border border-[#d9b36a]/20 bg-[#111821]/80 p-5 shadow-[0_0_0_1px_rgba(217,179,106,0.08),0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                                    <div className="space-y-3">
                                        <Skeleton className="h-8 w-56 rounded-full bg-[#d9b36a]/10" />
                                        <Skeleton className="h-4 w-96 rounded-full bg-[#d9b36a]/10" />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <div key={index} className="rounded-2xl border border-[#d9b36a]/10 bg-[#111821]/70 p-5 shadow-[0_0_0_1px_rgba(217,179,106,0.04)]">
                                            <Skeleton className="h-4 w-24 rounded-full bg-[#d9b36a]/10" />
                                            <Skeleton className="mt-4 h-8 w-20 rounded-full bg-[#d9b36a]/10" />
                                            <Skeleton className="mt-3 h-3 w-28 rounded-full bg-[#d9b36a]/10" />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                                    <div className="rounded-2xl border border-[#d9b36a]/10 bg-[#111821]/70 p-6 shadow-[0_0_0_1px_rgba(217,179,106,0.04)]">
                                        <Skeleton className="mb-4 h-6 w-40 rounded-full bg-[#d9b36a]/10" />
                                        <div className="space-y-3">
                                            {Array.from({ length: 3 }).map((_, index) => (
                                                <div key={index} className="flex items-center gap-3 rounded-xl border border-[#d9b36a]/10 bg-[#151d29]/80 p-3">
                                                    <Skeleton className="h-2.5 w-2.5 rounded-full bg-[#d9b36a]/20" />
                                                    <Skeleton className="h-4 w-full rounded-full bg-[#d9b36a]/10" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-[#d9b36a]/10 bg-[#111821]/70 p-6 shadow-[0_0_0_1px_rgba(217,179,106,0.04)]">
                                        <Skeleton className="mb-4 h-6 w-32 rounded-full bg-[#d9b36a]/10" />
                                        <div className="space-y-3">
                                            {Array.from({ length: 4 }).map((_, index) => (
                                                <Skeleton key={index} className="h-4 w-full rounded-full bg-[#d9b36a]/10" />
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