import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createContactList,
  extractGroupContacts,
  getClientStatuses,
  getContactLists,
  saveGroupContactsToList,
} from "@/lib/backend";
import type { ClientStatus, ContactList, GroupContact } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { Loader2, Save, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Groups() {
  const { actor, isFetching: actorLoading } = useActor(createActor);

  const [groupId, setGroupId] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState<GroupContact[]>(
    [],
  );

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new");
  const [newListName, setNewListName] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [clients, setClients] = useState<ClientStatus[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);

  async function loadClients() {
    if (!actor) return;
    try {
      const data = await getClientStatuses(actor);
      setClients(data);
    } catch {
      // silently fail
    }
  }

  async function loadContactLists() {
    if (!actor || listsLoaded) return;
    try {
      const data = await getContactLists(actor);
      setContactLists(data);
      setListsLoaded(true);
    } catch {
      // silently fail
    }
  }

  async function handleExtract() {
    if (!actor || !groupId.trim() || !selectedClient) {
      toast.error("Please enter a group link/ID and select a client");
      return;
    }
    setIsExtracting(true);
    try {
      const contacts = await extractGroupContacts(
        actor,
        groupId.trim(),
        selectedClient,
      );
      setExtractedContacts(contacts);
      toast.success(`Found ${contacts.length} contacts`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSave() {
    if (!actor || extractedContacts.length === 0) return;
    setIsSaving(true);
    try {
      let listId: number;
      if (saveMode === "new") {
        if (!newListName.trim()) {
          toast.error("Please enter a list name");
          setIsSaving(false);
          return;
        }
        listId = await createContactList(
          actor,
          newListName.trim(),
          "Extracted from group",
        );
      } else {
        if (!selectedListId) {
          toast.error("Please select a list");
          setIsSaving(false);
          return;
        }
        listId = Number(selectedListId);
      }
      const inputs = extractedContacts.map((c) => ({
        name: c.name,
        phone: c.phone,
      }));
      const count = await saveGroupContactsToList(actor, listId, inputs);
      toast.success(`Saved ${count} contacts to list`);
      setSaveDialogOpen(false);
      setExtractedContacts([]);
      setGroupId("");
      setSelectedClient("");
      setNewListName("");
      setSelectedListId("");
      setSaveMode("new");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save contacts",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function openSaveDialog() {
    setSaveDialogOpen(true);
    await loadContactLists();
  }

  return (
    <div className="space-y-6" data-ocid="groups.page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <UsersRound className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Group Contact Extractor
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Extract contacts from any WhatsApp group using your connected clients.
          Save them to contact lists for campaigns.
        </p>
      </div>

      {/* Extraction Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Extract Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="group-id">Group Link or Group ID</Label>
              <Input
                id="group-id"
                placeholder="Enter group link or ID..."
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                disabled={isExtracting}
                data-ocid="groups.group_id.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-select">Select WhatsApp Client</Label>
              <Select
                value={selectedClient}
                onValueChange={(v) => {
                  setSelectedClient(v);
                  loadClients();
                }}
                disabled={isExtracting}
              >
                <SelectTrigger
                  id="client-select"
                  data-ocid="groups.client_select"
                >
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 && (
                    <SelectItem value="__load__" onClick={loadClients}>
                      Load clients...
                    </SelectItem>
                  )}
                  {["client1", "client2", "client3", "client4"].map(
                    (id, idx) => {
                      const client = clients.find((c) => c.clientId === id);
                      return (
                        <SelectItem
                          key={id}
                          value={id}
                          data-ocid={`groups.client_option.${idx + 1}`}
                        >
                          {client
                            ? `${client.name} (${id})`
                            : `Profile ${idx + 1} (${id})`}
                        </SelectItem>
                      );
                    },
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleExtract}
            disabled={
              isExtracting || actorLoading || !groupId.trim() || !selectedClient
            }
            className="w-full bg-primary hover:bg-primary/90"
            data-ocid="groups.extract_button"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Extract Contacts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {extractedContacts.length > 0 && (
        <Card className="shadow-card" data-ocid="groups.results.card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Extraction Results
            </CardTitle>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 border-green-200"
            >
              Found {extractedContacts.length} contacts
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Is Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedContacts.map((contact, idx) => (
                    <TableRow
                      key={contact.phone}
                      data-ocid={`groups.contact.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contact.phone}
                      </TableCell>
                      <TableCell>
                        {contact.isAdmin ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              onClick={openSaveDialog}
              variant="outline"
              className="w-full"
              data-ocid="groups.save_to_list_button"
            >
              <Save className="mr-2 h-4 w-4" />
              Save to Contact List
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="groups.save_dialog">
          <DialogHeader>
            <DialogTitle>Save Contacts to List</DialogTitle>
            <DialogDescription>
              Choose to create a new list or add to an existing one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <RadioGroup
              value={saveMode}
              onValueChange={(v) => setSaveMode(v as "new" | "existing")}
              className="flex flex-col gap-3"
              data-ocid="groups.save_mode.radio"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="save-new" />
                <Label htmlFor="save-new" className="cursor-pointer">
                  Create new list
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="save-existing" />
                <Label htmlFor="save-existing" className="cursor-pointer">
                  Add to existing list
                </Label>
              </div>
            </RadioGroup>

            {saveMode === "new" && (
              <div className="space-y-2">
                <Label htmlFor="new-list-name">New List Name</Label>
                <Input
                  id="new-list-name"
                  placeholder="e.g. Group Extracted Contacts"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  data-ocid="groups.new_list_name.input"
                />
              </div>
            )}

            {saveMode === "existing" && (
              <div className="space-y-2">
                <Label htmlFor="existing-list">Select List</Label>
                <Select
                  value={selectedListId}
                  onValueChange={setSelectedListId}
                >
                  <SelectTrigger
                    id="existing-list"
                    data-ocid="groups.existing_list_select"
                  >
                    <SelectValue placeholder="Choose a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.map((list) => (
                      <SelectItem key={list.id} value={String(list.id)}>
                        {list.name}
                      </SelectItem>
                    ))}
                    {contactLists.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        No lists available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSaveDialogOpen(false)}
              data-ocid="groups.save_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
              data-ocid="groups.save_confirm_button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Save ${extractedContacts.length} Contacts`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
