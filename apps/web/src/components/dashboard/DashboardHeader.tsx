import { RefreshCw, Download } from "lucide-react";
import { Button } from "../ui/button";

interface DashboardHeaderProps {
    title: string;
    description: string;
}

export function DashboardHeader({
    title,
    description,
}: DashboardHeaderProps) {

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight"> 
                    {title}
                </h1>

                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>

            <div className="flex gap-2">
                <Button variant="outline">
                    <Download />
                    Export
                </Button>

                <Button variant="outline">
                    <RefreshCw />
                    Refresh
                </Button>
            </div>
        </div>
    );
}