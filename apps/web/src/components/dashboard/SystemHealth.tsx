import { CheckCircle2, Database, Server, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const services = [
    {
        name: "API",
        icon: Server,
        status: "Operational",
    },
    {
        name: "Database",
        icon: Database,
        status: "Operational",
    },
    {
        name: "Background Jobs",
        icon: Workflow,
        status: "Operational"
    },
];

export function SystemHealth() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    System Health
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {services.map((service) => {
                    const Icon = service.icon;

                    return (
                        <div key={service.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Icon className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {service.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="size-4" />
                                <span>
                                    {service.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}