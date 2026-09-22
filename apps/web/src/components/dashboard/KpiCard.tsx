import type { ComponentType } from "react";
import { Card, CardContent } from "../ui/card";

interface KpiCardProps {
    title: string;
    value: string;
    description?: string;
    icon: ComponentType<{ className?: string }>;
}

export function KpiCard({
    title,
    value,
    description,
    icon: Icon,
}: KpiCardProps) {

    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                 <div>
                    <p className="text-sm text-muted-foreground">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>

                <div className="rounded-lg bg-muted p-2">
                    <Icon className="size-5 text-muted-foreground" />
                </div>
                </div>
            </CardContent>
        </Card>
    );
}