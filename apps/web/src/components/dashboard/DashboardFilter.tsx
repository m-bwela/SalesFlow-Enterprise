import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const periods = [
    "1D",
    "1W",
    "1M",
    "3M",
    "6M",
    "YTD",
    "1Y",
    "ALL",
];

export function DashboardFilters() {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
                {periods.map((period) => (
                    <Button
                        key={period}
                        variant={period === "1M" ? "default" : "ghost"}
                        size="sm"
                        className="h-8"
                    >
                        {period}
                    </Button>
                ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Region" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All Regions
                        </SelectItem>

                        <SelectItem value="central">
                            Central Region
                        </SelectItem>

                        <SelectItem value="coast">
                            Coast Region
                        </SelectItem>

                        <SelectItem value="eastern">
                            Eastern Region
                        </SelectItem>

                        <SelectItem value="nairobi">
                            Nairobi Region
                        </SelectItem>

                        <SelectItem value="north eastern">
                            North Eastern Region
                        </SelectItem>

                        <SelectItem value="nyanza">
                            Nyanza Region
                        </SelectItem>

                        <SelectItem value="rift valley">
                            Rift Valley Region
                        </SelectItem>

                        <SelectItem value="western">
                            Western Region
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Territory" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All Territories
                        </SelectItem>

                        <SelectItem value="mombasa">
                            Mombasa Territory
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="ASR" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All ASRs
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                    Reset
                </Button>

                <Button size="sm">
                    Apply
                </Button>
            </div>
        </div>
    );
}