import { useEffect, useState } from "react";
import { RefreshCw, Download, Clock3 } from "lucide-react";
import { Button } from "../ui/button";

interface DashboardHeaderProps {
    title: string;
    description: string;
    showActions?: boolean;
}

export function DashboardHeader({
    title,
    description,
    showActions = false,
}: DashboardHeaderProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(now);

    const formattedTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(now);

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                </h1>

                <p className="text-sm text-muted-foreground">
                    {description}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{formattedDate}</span>
                    <span className="text-foreground">{formattedTime}</span>
                </div>
            </div>

            {showActions ? (
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download />
                        Export
                    </Button>

                    <Button variant="outline">
                        <RefreshCw />
                        Refresh
                    </Button>
                </div>
            ) : null}
        </div>
    );
}