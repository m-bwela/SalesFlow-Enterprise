import { useState } from "react";

import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import type { DashboardFilters as DashboardFiltersType, DashboardPeriod } from "@/types/dashboard";

interface DashboardFilterProps {
    onApply: (filters: DashboardFiltersType) => void;
}

const periods: DashboardPeriod[] = [
    "LIVE",
    "1D",
    "1W",
    "1M",
    "3M",
    "6M",
    "YTD",
    "1Y",
    "ALL",
];

export function DashboardFilters({
    onApply,
}: DashboardFilterProps) {
    const [period, setPeriod] = useState<DashboardPeriod>("1M");

    const [regionId, setRegionId] = useState<string>("All Regions");

    const [territoryId, setTerritoryId] = useState<string>("All Territories");

    const [distributorId, setDistributorId] = useState<string>("All Distributors");

    const [asrId, setAsrId] = useState<string>("All Agents");

    function applyFilters() {
        onApply({
            period,
            regionId: regionId === "all" ? undefined : regionId,
            territoryId: territoryId === "all" ? undefined : territoryId,
            distributorId: distributorId === "all" ? undefined : distributorId,
            asrId: asrId === "all" ? undefined : asrId,
        });
    }

    function resetFilters() {
        setPeriod("1M");
        setRegionId("all");
        setTerritoryId("all");
        setDistributorId("all");
        setAsrId("all");

        onApply({
            period: "1M",
        });
    }
    return (
        <div className="space-y-4">
            {/* Time period */}
            <div className="flex flex-wrap items-center gap-15 rounded-lg bg-muted p-1">
                {periods.map((value) => (
                    <Button
                        key={value}
                        type="button"
                        variant={period === value ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 ${value === "LIVE" ? "gap-2 bg-transparent text-emerald-400 hover:bg-transparent" : ""}`}
                        onClick={() => setPeriod(value)}
                    >
                        {value === "LIVE" ? (
                            <>
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{value}</span>
                            </>
                        ) : (
                            value
                        )}
                    </Button>
                ))}
            </div>

            {/* Organization filters*/}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Select
                    value={regionId}
                    onValueChange={(value) => setRegionId(value ?? "All Regions")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Region" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="All Regions">
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

                <Select
                    value={territoryId}
                    onValueChange={(value) => setTerritoryId(value ?? "all")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Territory" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="All Territories">
                            All Territories
                        </SelectItem>

                        <SelectItem value="mombasa">
                            Mombasa Territory
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={distributorId}
                    onValueChange={(value) => setDistributorId(value ?? "all")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Distributor" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="Mombasa-distributor">
                            Mombasa Distributor
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={asrId}
                    onValueChange={(value) => setAsrId(value ?? "all")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="ASR" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="All Agents">
                            All ASRs
                        </SelectItem>

                        <SelectItem value="john">
                            John
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={resetFilters}
                >
                    Reset
                </Button>

                <Button 
                    type="button"
                    size="sm"
                    onClick={applyFilters}
                >
                    Apply
                </Button>
            </div>
        </div>
    );
}