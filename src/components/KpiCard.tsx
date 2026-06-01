import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  spark: { label: string; value: number }[];
  caption: string;
  positiveIsGood?: boolean;
}

export function KpiCard({ label, value, delta, icon: Icon, spark, caption, positiveIsGood = true }: KpiCardProps) {
  const good = positiveIsGood ? delta >= 0 : delta <= 0;
  const sign = delta >= 0;
  const id = `spark-${label.replace(/\s/g, "")}`;
  const latestPoint = spark.at(-1);
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/15">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </div>
          <div className="font-mono text-[28px] font-semibold tabular-nums leading-none tracking-tight text-foreground">
            {value}
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
              good
                ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                : "bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]",
            )}
          >
            {sign ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatPercent(Math.abs(delta), { signed: false })}
            <span className="text-muted-foreground/70 font-normal ml-1">vs last period</span>
          </div>
        </div>
        <div className="h-[72px] w-32 -mr-1 -mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 6, right: 2, bottom: 4, left: 2 }}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={good ? "hsl(var(--success))" : "hsl(var(--danger))"} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={good ? "hsl(var(--success))" : "hsl(var(--danger))"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                  fontSize: 11,
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(tooltipValue) => [tooltipValue, label]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={good ? "hsl(var(--success))" : "hsl(var(--danger))"}
                strokeWidth={2}
                fill={`url(#${id})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
        <span>{caption}</span>
        {latestPoint && <span className="font-mono tabular-nums">{latestPoint.label}: {latestPoint.value}</span>}
      </div>
    </div>
  );
}
