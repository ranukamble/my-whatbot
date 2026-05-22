import { createActor } from "@/backend";
import { MessageStatus } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCampaigns, getMessageHistory } from "@/lib/backend";
import type { Campaign, MessageLog } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FilterX,
  Inbox,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 50;

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateToTimestamp(
  dateStr: string,
  endOfDay = false,
): number | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.getTime();
}

function exportToCSV(logs: MessageLog[], campaigns: Campaign[]) {
  const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));
  const headers = [
    "Campaign",
    "Recipient Phone",
    "Message",
    "Status",
    "Timestamp",
  ];
  const rows = logs.map((log) => [
    campaignMap.get(log.campaignId) || `Campaign #${log.campaignId}`,
    log.phone,
    log.messagePreview,
    log.status,
    new Date(log.sentAt).toISOString(),
  ]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `message-history-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(
    `Exported ${logs.length} record${logs.length === 1 ? "" : "s"}`,
  );
}

export default function History() {
  const { actor, isFetching: actorLoading } = useActor(createActor);

  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(0);

  const { data: logs = [], isLoading: logsLoading } = useQuery<MessageLog[]>({
    queryKey: ["messageHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return getMessageHistory(actor, {});
    },
    enabled: !!actor && !actorLoading,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<
    Campaign[]
  >({
    queryKey: ["campaigns"],
    queryFn: async () => {
      if (!actor) return [];
      return getCampaigns(actor);
    },
    enabled: !!actor && !actorLoading,
  });

  const campaignMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of campaigns) {
      map.set(c.id, c.name);
    }
    return map;
  }, [campaigns]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (campaignFilter !== "all") {
      const cid = Number(campaignFilter);
      result = result.filter((l) => l.campaignId === cid);
    }

    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }

    const fromTs = dateToTimestamp(fromDate);
    const toTs = dateToTimestamp(toDate, true);
    if (fromTs !== undefined) {
      result = result.filter((l) => l.sentAt >= fromTs);
    }
    if (toTs !== undefined) {
      result = result.filter((l) => l.sentAt <= toTs);
    }

    result.sort((a, b) => b.sentAt - a.sentAt);
    return result;
  }, [logs, campaignFilter, statusFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedLogs = filteredLogs.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const handleClearFilters = useCallback(() => {
    setCampaignFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPage(0);
  }, []);

  const handleExport = useCallback(() => {
    exportToCSV(filteredLogs, campaigns);
  }, [filteredLogs, campaigns]);

  const isLoading = logsLoading || campaignsLoading || actorLoading;

  const startIdx = filteredLogs.length > 0 ? currentPage * PAGE_SIZE + 1 : 0;
  const endIdx = Math.min((currentPage + 1) * PAGE_SIZE, filteredLogs.length);

  return (
    <div className="space-y-6" data-ocid="history.page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Message History
          </h1>
        </div>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
          data-ocid="history.export_button"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="campaign-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Campaign
              </label>
              <Select
                value={campaignFilter}
                onValueChange={(v) => {
                  setCampaignFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger
                  id="campaign-filter"
                  className="w-[200px]"
                  data-ocid="history.campaign_filter"
                >
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="status-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger
                  id="status-filter"
                  className="w-[160px]"
                  data-ocid="history.status_filter"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="from-date"
                className="text-xs font-medium text-muted-foreground"
              >
                From
              </label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(0);
                }}
                className="w-[160px]"
                data-ocid="history.from_date"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="to-date"
                className="text-xs font-medium text-muted-foreground"
              >
                To
              </label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(0);
                }}
                className="w-[160px]"
                data-ocid="history.to_date"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleClearFilters}
              data-ocid="history.clear_filters_button"
            >
              <FilterX className="mr-1.5 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16"
              data-ocid="history.empty_state"
            >
              <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                No messages in history
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Run a campaign to see message logs here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log, idx) => (
                    <TableRow
                      key={log.id}
                      data-ocid={`history.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {campaignMap.get(log.campaignId) ||
                          `Campaign #${log.campaignId}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.phone}
                      </TableCell>
                      <TableCell
                        className="max-w-xs truncate"
                        title={log.messagePreview}
                      >
                        {log.messagePreview.length > 60
                          ? `${log.messagePreview.slice(0, 60)}...`
                          : log.messagePreview}
                      </TableCell>
                      <TableCell>
                        {log.status === "sent" ? (
                          <Badge
                            variant="outline"
                            className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(log.sentAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredLogs.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Showing {startIdx}-{endIdx} of {filteredLogs.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  data-ocid="history.pagination_prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  data-ocid="history.pagination_next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
