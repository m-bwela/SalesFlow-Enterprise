import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const data = [
    { period: "1", sales: 42000, orders: 180 },
    { period: "2", sales: 52000, orders: 220 },
    { period: "3", sales: 47000, orders: 205 },
    { period: "4", sales: 68000, orders: 280 },
    { period: "5", sales: 61000, orders: 265 },
    { period: "6", sales: 76000, orders: 320 },
    { period: "7", sales: 72000, orders: 300 },
    
];

export function SalesTrend() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    Sales Trend Visualization
                </div>
            </CardContent>
        </Card>
    );
}