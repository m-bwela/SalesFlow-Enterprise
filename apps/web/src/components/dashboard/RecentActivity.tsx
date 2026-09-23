import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

const activities = [
    {
        action: "ASR assignment",
        description: "An ASR was assigned to Mombasa Distributor.",
        time: "Just now",
    },
    {
        action: "Route Approval",
        description: "A route plan was approved.",
        time: "12 min ago",
    },
    {
        action: "User activity",
        description: "A new user signed into SalesFlow.",
        time: "28 min ago"
    },
    {
        action: "System Configuration",
        description: "A system setting was updated.",
        time: "1 hr ago",
    },
];

export function RecentActivity() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Recent Activity
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {activities.map((activity) => (
                    <div key={`${activity.action}-${activity.time}`} className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium">
                                {activity.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {activity.description}
                            </p>
                        </div>

                        <Badge variant="secondary">
                            {activity.time}
                        </Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}