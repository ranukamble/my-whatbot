import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  connectClient,
  disconnectClient,
  getClientStatuses,
} from "@/lib/backend";
import type { ClientStatus } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, QrCode, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CLIENT_IDS = ["client1", "client2", "client3", "client4"];
const CLIENT_NAMES: Record<string, string> = {
  client1: "Profile 1",
  client2: "Profile 2",
  client3: "Profile 3",
  client4: "Profile 4",
};

function formatLastSeen(ts?: number): string {
  if (!ts) return "Never";
  const date = new Date(ts * 1000);
  return date.toLocaleString();
}

function ClientCard({
  client,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: {
  client: ClientStatus;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
}) {
  const isConnected = client.connected;

  return (
    <div
      className="bg-card rounded-xl border border-border p-6 shadow-card transition-smooth hover:shadow-elevated"
      data-ocid="whatsapp.client_card"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl font-bold">
          {client.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground truncate">
              {client.name}
            </h3>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {client.clientId}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isConnected ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isConnected ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            Phone: {client.phone || "-"}
          </p>
          <p className="text-xs text-muted-foreground">
            Last seen: {formatLastSeen(client.lastSeenAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => onDisconnect(client.clientId)}
            disabled={isDisconnecting}
            data-ocid="whatsapp.disconnect_button"
          >
            {isDisconnecting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            Disconnect
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onConnect(client.clientId)}
            disabled={isConnecting}
            data-ocid="whatsapp.connect_button"
          >
            {isConnecting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const { actor, isFetching: actorLoading } = useActor(createActor);
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const {
    data: clients = [],
    isLoading: clientsLoading,
    isError: clientsError,
  } = useQuery<ClientStatus[]>({
    queryKey: ["client-statuses"],
    queryFn: async () => {
      if (!actor) return [];
      return getClientStatuses(actor);
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: 5000,
  });

  const connectMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!actor) throw new Error("Backend not available");
      return connectClient(actor, clientId);
    },
    onSuccess: (_, clientId) => {
      toast.success(`${CLIENT_NAMES[clientId]} connected successfully`);
      setModalOpen(false);
      setSelectedClientId(null);
      queryClient.invalidateQueries({ queryKey: ["client-statuses"] });
    },
    onError: (err) => {
      toast.error(
        `Failed to connect: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!actor) throw new Error("Backend not available");
      return disconnectClient(actor, clientId);
    },
    onSuccess: (_, clientId) => {
      toast.success(`${CLIENT_NAMES[clientId]} disconnected`);
      queryClient.invalidateQueries({ queryKey: ["client-statuses"] });
    },
    onError: (err) => {
      toast.error(
        `Failed to disconnect: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    },
  });

  const handleConnect = (clientId: string) => {
    setSelectedClientId(clientId);
    setModalOpen(true);
  };

  const handleDisconnect = (clientId: string) => {
    disconnectMutation.mutate(clientId);
  };

  const handleSimulateConnection = () => {
    if (selectedClientId) {
      connectMutation.mutate(selectedClientId);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedClientId(null);
  };

  const getClientData = (id: string): ClientStatus => {
    const found = clients.find((c) => c.clientId === id);
    if (found) return found;
    return {
      clientId: id,
      name: CLIENT_NAMES[id],
      connected: false,
      phone: undefined,
      lastSeenAt: undefined,
    };
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            WhatsApp Clients
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Manage your WhatsApp client connections. Connect up to 4 clients to
          send campaigns and extract group contacts. Each client operates
          independently.
        </p>
      </div>

      {/* Client Cards Grid */}
      {clientsLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {CLIENT_IDS.map((id) => (
            <div
              key={id}
              className="bg-card rounded-xl border border-border p-6 shadow-card animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-24 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <div className="h-8 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : clientsError ? (
        <div
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center"
          data-ocid="whatsapp.error_state"
        >
          <p className="text-destructive font-medium">
            Failed to load client statuses.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["client-statuses"] })
            }
            data-ocid="whatsapp.retry_button"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {CLIENT_IDS.map((id) => (
            <ClientCard
              key={id}
              client={getClientData(id)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnecting={
                connectMutation.isPending && selectedClientId === id
              }
              isDisconnecting={
                disconnectMutation.isPending &&
                disconnectMutation.variables === id
              }
            />
          ))}
        </div>
      )}

      {/* Connect Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="whatsapp.connect_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Connect Client —{" "}
              {selectedClientId ? CLIENT_NAMES[selectedClientId] : ""}
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with WhatsApp on your phone to link this client.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* Mock QR Code */}
            <div className="flex h-56 w-56 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="h-16 w-16" />
                <span className="text-sm font-medium">Scan with WhatsApp</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for QR scan...</span>
            </div>

            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseModal}
                data-ocid="whatsapp.cancel_button"
              >
                <X className="mr-1.5 h-4 w-4" />
                Close
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSimulateConnection}
                disabled={connectMutation.isPending}
                data-ocid="whatsapp.simulate_button"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                Simulate Connection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
