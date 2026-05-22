import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { usePolling } from "@/hooks/usePolling";
import {
  type CampaignStatus,
  MessageType,
  createCampaign,
  deleteCampaign,
  getCampaigns,
  getClientStatuses,
  getContactLists,
  pauseCampaign,
  startCampaign,
} from "@/lib/backend";
import type { Campaign, ClientStatus, ContactList } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const CLIENT_OPTIONS = ["client1", "client2", "client3", "client4"];

const STATUS_CONFIG: Record<
  CampaignStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pending", variant: "secondary" },
  running: { label: "Running", variant: "default" },
  paused: { label: "Paused", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
};

function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export default function Campaigns() {
  const { actor, isFetching: actorLoading } = useActor(createActor);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [listId, setListId] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<MessageType>(MessageType.text);
  const [message, setMessage] = useState("");
  const [delaySecs, setDelaySecs] = useState(5);
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");

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

  const { data: contactLists = [] } = useQuery<ContactList[]>({
    queryKey: ["contactLists"],
    queryFn: async () => {
      if (!actor) return [];
      return getContactLists(actor);
    },
    enabled: !!actor && !actorLoading,
  });

  const { data: clientStatuses = [] } = useQuery<ClientStatus[]>({
    queryKey: ["clientStatuses"],
    queryFn: async () => {
      if (!actor) return [];
      return getClientStatuses(actor);
    },
    enabled: !!actor && !actorLoading,
  });

  const anyRunning = useMemo(
    () => campaigns.some((c) => c.status === "running"),
    [campaigns],
  );

  usePolling(
    async () => {
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    5000,
    anyRunning,
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend not ready");
      const req = {
        name,
        listId: BigInt(listId),
        clientIds: selectedClients,
        messageType,
        message,
        delaySecs: BigInt(delaySecs),
        scheduledAt:
          schedule === "later" && scheduledAt
            ? BigInt(new Date(scheduledAt).getTime())
            : undefined,
      };
      return createCampaign(actor, req);
    },
    onSuccess: () => {
      toast.success("Campaign created successfully");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      resetForm();
      setOpen(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create campaign",
      );
    },
  });

  const startMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Backend not ready");
      return startCampaign(actor, id);
    },
    onSuccess: () => {
      toast.success("Campaign started");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to start campaign",
      );
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Backend not ready");
      return pauseCampaign(actor, id);
    },
    onSuccess: () => {
      toast.success("Campaign paused");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to pause campaign",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Backend not ready");
      return deleteCampaign(actor, id);
    },
    onSuccess: () => {
      toast.success("Campaign deleted");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete campaign",
      );
    },
  });

  function resetForm() {
    setName("");
    setListId("");
    setSelectedClients([]);
    setMessageType(MessageType.text);
    setMessage("");
    setDelaySecs(5);
    setSchedule("now");
    setScheduledAt("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (
      !name.trim() ||
      !listId ||
      selectedClients.length === 0 ||
      !message.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (schedule === "later" && !scheduledAt) {
      toast.error("Please select a schedule time");
      return;
    }
    createMutation.mutate();
  }

  function toggleClient(clientId: string) {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((c) => c !== clientId)
        : [...prev, clientId],
    );
  }

  const listNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const cl of contactLists) {
      map.set(cl.id, cl.name);
    }
    return map;
  }, [contactLists]);

  return (
    <div className="space-y-6" data-ocid="campaigns.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Campaigns
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="campaigns.open_modal_button"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                Create Campaign
              </DialogTitle>
              <DialogDescription>
                Set up a new WhatsApp messaging campaign.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 mt-2">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="campaign-name"
                  data-ocid="campaigns.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Sale Blast"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-list">
                  Contact List <span className="text-destructive">*</span>
                </Label>
                <Select value={listId} onValueChange={setListId}>
                  <SelectTrigger id="contact-list" data-ocid="campaigns.select">
                    <SelectValue placeholder="Select a contact list" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.map((cl) => (
                      <SelectItem key={cl.id} value={String(cl.id)}>
                        {cl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  WhatsApp Client(s) <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-4">
                  {CLIENT_OPTIONS.map((cid) => {
                    const cs = clientStatuses.find((c) => c.clientId === cid);
                    return (
                      <div
                        key={cid}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          id={`campaign-client-${cid}`}
                          data-ocid={`campaigns.checkbox.${cid}`}
                          checked={selectedClients.includes(cid)}
                          onCheckedChange={() => toggleClient(cid)}
                        />
                        <Label
                          htmlFor={`campaign-client-${cid}`}
                          className="text-sm text-foreground cursor-pointer"
                        >
                          {cs?.name ?? cid}
                        </Label>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            cs?.connected
                              ? "bg-green-500"
                              : "bg-muted-foreground/40"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message-type">Message Type</Label>
                <Select
                  value={messageType}
                  onValueChange={(v) => setMessageType(v as MessageType)}
                >
                  <SelectTrigger id="message-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="imageText">Image + Text</SelectItem>
                    <SelectItem value="videoText">Video + Text</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message-template">
                  Message Template <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message-template"
                  data-ocid="campaigns.textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi {name}, your number is {phone}. Check out our offer!"
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{name}"} and {"{phone}"} as placeholders. They will be
                  replaced with each contact&apos;s details.
                </p>
              </div>

              <div className="space-y-3">
                <Label>
                  Delay Between Messages:{" "}
                  <span className="text-foreground font-medium">
                    {delaySecs}s
                  </span>
                </Label>
                <Slider
                  data-ocid="campaigns.slider"
                  value={[delaySecs]}
                  onValueChange={(v) => setDelaySecs(v[0])}
                  min={1}
                  max={30}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1s</span>
                  <span>30s</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Schedule</Label>
                <RadioGroup
                  value={schedule}
                  onValueChange={(v) => setSchedule(v as "now" | "later")}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="now" id="schedule-now" />
                    <Label
                      htmlFor="schedule-now"
                      className="cursor-pointer font-normal"
                    >
                      Send Now
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="later" id="schedule-later" />
                    <Label
                      htmlFor="schedule-later"
                      className="cursor-pointer font-normal"
                    >
                      Schedule for Later
                    </Label>
                  </div>
                </RadioGroup>
                {schedule === "later" && (
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required={schedule === "later"}
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                  data-ocid="campaigns.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-ocid="campaigns.submit_button"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Campaign
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {campaignsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center" data-ocid="campaigns.empty_state">
              <Megaphone className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No campaigns yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first campaign to start sending messages.
              </p>
              <Button
                onClick={() => setOpen(true)}
                data-ocid="campaigns.empty_state.button"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact List</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign, idx) => {
                    const statusCfg = STATUS_CONFIG[campaign.status];
                    const progressPct =
                      campaign.totalCount > 0
                        ? Math.round(
                            (campaign.sentCount / campaign.totalCount) * 100,
                          )
                        : 0;
                    return (
                      <TableRow
                        key={campaign.id}
                        data-ocid={`campaigns.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>
                          {listNameMap.get(campaign.listId) ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusCfg.variant}
                            className={
                              campaign.status === "running"
                                ? "animate-pulse"
                                : ""
                            }
                          >
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-40 space-y-1">
                            <Progress value={progressPct} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {campaign.sentCount}/{campaign.totalCount} sent
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(campaign.startedAt ?? campaign.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(campaign.status === "pending" ||
                              campaign.status === "paused") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  startMutation.mutate(campaign.id)
                                }
                                disabled={startMutation.isPending}
                                data-ocid={`campaigns.start_button.${idx + 1}`}
                              >
                                <Play className="h-3.5 w-3.5 mr-1" />
                                Start
                              </Button>
                            )}
                            {campaign.status === "running" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  pauseMutation.mutate(campaign.id)
                                }
                                disabled={pauseMutation.isPending}
                                data-ocid={`campaigns.pause_button.${idx + 1}`}
                              >
                                <Pause className="h-3.5 w-3.5 mr-1" />
                                Pause
                              </Button>
                            )}
                            {campaign.status !== "running" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  deleteMutation.mutate(campaign.id)
                                }
                                disabled={deleteMutation.isPending}
                                data-ocid={`campaigns.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
