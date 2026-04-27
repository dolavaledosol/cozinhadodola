import { ReactNode } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface AdminListColumn<T> {
  /** Stable identifier for the column (also used as sort key) */
  key: string;
  /** Header label shown in desktop table and (optionally) as label on mobile cards */
  header: ReactNode;
  /** How to render the cell content */
  render: (row: T) => ReactNode;
  /** Whether this column is sortable. If true, parent must implement sort. */
  sortable?: boolean;
  /** Hide on mobile inside the desktop table (already hidden by default in card view) */
  hiddenOnMobile?: boolean;
  /** Extra className for the desktop <td>/<th> */
  className?: string;
  /** Where this field appears in the mobile card layout. Default: "meta". */
  mobileSlot?: "code" | "title" | "meta" | "badge" | "hidden";
  /** Optional override for label shown in mobile meta rows (defaults to `header`) */
  mobileLabel?: ReactNode;
}

interface AdminListViewProps<T> {
  data: T[];
  columns: AdminListColumn<T>[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;

  // Sorting (controlled by parent)
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />;
}

/**
 * Standardized admin listing: renders a `<table>` on md+ screens
 * and stacked cards on mobile, from the same column definition.
 *
 * Mobile card layout:
 *   [code]                              [badge]
 *   [title]
 *   [meta label]: [meta value]
 *   ...
 */
export function AdminListView<T>({
  data,
  columns,
  rowKey,
  emptyMessage = "Nenhum registro encontrado",
  onRowClick,
  sortKey,
  sortDir = "asc",
  onSortChange,
}: AdminListViewProps<T>) {
  const codeCol = columns.find((c) => c.mobileSlot === "code");
  const titleCol = columns.find((c) => c.mobileSlot === "title");
  const badgeCols = columns.filter((c) => c.mobileSlot === "badge");
  const metaCols = columns.filter(
    (c) => !c.mobileSlot || c.mobileSlot === "meta",
  );

  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-sm text-muted-foreground bg-card">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && onSortChange && "cursor-pointer select-none",
                    col.className,
                  )}
                  onClick={
                    col.sortable && onSortChange
                      ? () => onSortChange(col.key)
                      : undefined
                  }
                >
                  {col.header}
                  {col.sortable && onSortChange && (
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={rowKey(row)}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {data.map((row) => (
          <div
            key={rowKey(row)}
            className={cn(
              "border border-border/60 rounded-xl bg-card p-3 space-y-2 shadow-sm",
              onRowClick && "cursor-pointer active:scale-[0.99] active:bg-muted/40 transition-all",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                {codeCol && (
                  <div className="text-[11px] font-mono text-primary/80 tracking-wide">
                    {codeCol.render(row)}
                  </div>
                )}
                {titleCol && (
                  <div className="font-semibold text-sm leading-snug break-words text-foreground">
                    {titleCol.render(row)}
                  </div>
                )}
              </div>
              {badgeCols.length > 0 && (
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {badgeCols.map((col) => (
                    <div key={col.key}>{col.render(row)}</div>
                  ))}
                </div>
              )}
            </div>
            {metaCols.length > 0 && (
              <div className="grid grid-cols-1 gap-0.5 text-xs pt-1 border-t border-border/40">
                {metaCols.map((col) => {
                  const value = col.render(row);
                  if (value === null || value === undefined || value === "") return null;
                  return (
                    <div key={col.key} className="flex items-baseline gap-2 py-0.5">
                      <span className="text-muted-foreground shrink-0 text-[11px] uppercase tracking-wide">
                        {col.mobileLabel ?? col.header}
                      </span>
                      <span className="text-foreground min-w-0 break-words ml-auto text-right font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default AdminListView;
