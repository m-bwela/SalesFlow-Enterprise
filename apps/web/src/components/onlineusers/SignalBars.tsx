import { cn } from "@/lib/utils";

export function SignalBars({ online }: { online: boolean }) {
  return (
    <span className="inline-flex h-4 items-end gap-0.5" role="img" aria-label={online ? "Online" : "Offline"}>
      {[6, 9, 12, 16].map((h, i) => (
        <i key={i} style={{ height: h }} className={cn("w-1 rounded-[1px]", online ? "bg-emerald-500" : "bg-muted")} />
      ))}
    </span>
  );
}