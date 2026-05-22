import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePolling } from "@/hooks/usePolling";
import { getClientStatuses, getDashboardStats } from "@/lib/backend";
import type { ClientStatus, DashboardStats } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function formatLastSeen(timestamp?: number): string {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface StatCardProps {
  label: string;
  value: string | number;
  emoji: string;
  variant: "green" | "blue" | "orange" | "purple";
}

const statVariantMap = {
  green: {
    card: "stat-card-green",
    text: "text-[oklch(0.4_0.15_150)]",
  },
  blue: {
    card: "stat-card-blue",
    text: "text-[oklch(0.35_0.2_270)]",
  },
  orange: {
    card: "stat-card-orange",
    text: "text-[oklch(0.45_0.18_40)]",
  },
  purple: {
    card: "stat-card-purple",
    text: "text-[oklch(0.4_0.24_305)]",
  },
};

function StatCard({ label, value, emoji, variant }: StatCardProps) {
  const v = statVariantMap[variant];
  return (
    <Card
      className={`${v.card} ${v.text} rounded-xl shadow-card`}
      data-ocid={`dashboard.stat_card.${variant}`}
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        <span className="text-3xl mb-2">{emoji}</span>
        <span className="text-3xl font-bold font-display">{value}</span>
        <span className="text-sm font-medium mt-1 opacity-80">{label}</span>
      </CardContent>
    </Card>
  );
}

interface ClientCardProps {
  client: ClientStatus;
}

function ClientCard({ client }: ClientCardProps) {
  return (
    <Card
      className="shadow-card hover:shadow-elevated transition-smooth"
      data-ocid={`dashboard.client_card.${client.clientId}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            P
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {client.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              ID: {client.clientId}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${client.connected ? "bg-[oklch(0.65_0.18_150)]" : "bg-muted"}`}
            />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                client.connected
                  ? "bg-[oklch(0.92_0.15_150/0.2)] text-[oklch(0.4_0.15_150)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {client.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Last seen: {formatLastSeen(client.lastSeenAt)}
        </p>
        {client.phone && (
          <p className="mt-1 text-xs text-muted-foreground">{client.phone}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ClientSkeletonCard() {
  return (
    <Card className="shadow-card animate-pulse">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
        <div className="mt-4 h-6 bg-muted rounded w-20" />
        <div className="mt-3 h-3 bg-muted rounded w-32" />
      </CardContent>
    </Card>
  );
}

function EmptyClientCard({ index }: { index: number }) {
  const clientId = `client${index}`;
  const name = `Profile ${index}`;
  return (
    <Card
      className="shadow-card"
      data-ocid={`dashboard.client_card.${clientId}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            P
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              ID: {clientId}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
            Disconnected
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Last seen: Never</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    data: stats,
    refetch: refetchStats,
    isLoading: statsLoading,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return getDashboardStats(actor);
    },
    enabled: !!actor && !actorFetching,
  });

  const {
    data: clients,
    refetch: refetchClients,
    isLoading: clientsLoading,
  } = useQuery<ClientStatus[]>({
    queryKey: ["client-statuses"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return getClientStatuses(actor);
    },
    enabled: !!actor && !actorFetching,
  });

  usePolling(
    useCallback(async () => {
      await refetchClients();
    }, [refetchClients]),
    5000,
    true,
  );

  const refreshAll = async () => {
    try {
      await Promise.all([refetchStats(), refetchClients()]);
      toast.success("Data refreshed successfully");
    } catch {
      toast.error("Failed to refresh data");
    }
  };

  const formattedTime = liveTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const defaultStats: DashboardStats = {
    totalContactLists: 0,
    totalCampaigns: 0,
    runningCampaigns: 0,
    connectedClients: 0,
    totalClients: 4,
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      {/* Hero Banner */}
      <div className="gradient-hero rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl md:text-4xl shrink-0">🚀</span>
                <h1 className="text-2xl md:text-3xl font-bold font-display">
                  WhatsApp Automation Dashboard
                </h1>
              </div>
              <p className="text-white/80 text-sm md:text-base max-w-xl">
                Manage your campaigns, contacts, and WhatsApp clients seamlessly
                with real-time insights
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent shrink-0 ml-4"
              data-ocid="dashboard.refresh_button"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh Data
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/90">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.75_0.18_150)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[oklch(0.65_0.18_150)]" />
            </span>
            <span>Live Data • Last updated: {formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
        <StatCard
          label="CONTACT LISTS"
          value={statsLoading ? "—" : displayStats.totalContactLists}
          emoji="👥"
          variant="green"
        />
        <StatCard
          label="TOTAL CAMPAIGNS"
          value={statsLoading ? "—" : displayStats.totalCampaigns}
          emoji="📊"
          variant="blue"
        />
        <StatCard
          label="RUNNING CAMPAIGNS"
          value={statsLoading ? "—" : displayStats.runningCampaigns}
          emoji="🚀"
          variant="orange"
        />
        <StatCard
          label="ACTIVE CLIENTS"
          value={
            statsLoading
              ? "—"
              : `${displayStats.connectedClients}/${displayStats.totalClients}`
          }
          emoji="📱"
          variant="purple"
        />
      </div>

      {/* WhatsApp Clients Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
            <span>📱</span>
            WhatsApp Clients
          </h2>
          <span className="inline-flex items-center rounded-full bg-[oklch(0.92_0.15_150/0.2)] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.4_0.15_150)]">
            Live
          </span>
        </div>
        <div
          className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}
        >
          {clientsLoading ? (
            <>
              <ClientSkeletonCard />
              <ClientSkeletonCard />
              <ClientSkeletonCard />
              <ClientSkeletonCard />
            </>
          ) : clients && clients.length > 0 ? (
            clients.map((client) => (
              <ClientCard key={client.clientId} client={client} />
            ))
          ) : (
            <>
              <EmptyClientCard index={1} />
              <EmptyClientCard index={2} />
              <EmptyClientCard index={3} />
              <EmptyClientCard index={4} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
