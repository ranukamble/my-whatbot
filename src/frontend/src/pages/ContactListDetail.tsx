import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addContact,
  deleteContact,
  getContactLists,
  getContactsInList,
  importContacts,
} from "@/lib/backend";
import type { Contact } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ListX,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function useContactBackend() {
  const { actor, isFetching } = useActor(createActor);
  return { actor, isFetching };
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString();
}

function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s+/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(cleaned)) {
    return "Phone number must contain only digits";
  }
  if (cleaned.length < 10) {
    return "Phone number must be at least 10 digits";
  }
  return null;
}

function parseCSV(text: string): Array<{ name: string; phone: string }> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const phoneIdx = headers.indexOf("phone");

  if (nameIdx === -1 || phoneIdx === -1) {
    throw new Error('CSV must have "name" and "phone" columns');
  }

  const results: Array<{ name: string; phone: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length <= Math.max(nameIdx, phoneIdx)) continue;
    const name = cols[nameIdx].trim();
    const phone = cols[phoneIdx].trim();
    if (name && phone) {
      results.push({ name, phone });
    }
  }
  return results;
}

export default function ContactListDetail() {
  const { listId } = useParams({ from: "/contacts/$listId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor, isFetching } = useContactBackend();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listIdNum = Number(listId);

  const [addOpen, setAddOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: lists } = useQuery({
    queryKey: ["contactLists"],
    queryFn: async () => {
      if (!actor) return [];
      return getContactLists(actor);
    },
    enabled: !!actor && !isFetching,
  });

  const listName =
    lists?.find((l) => l.id === listIdNum)?.name ?? `List #${listId}`;

  const {
    data: contacts,
    isLoading,
    isError,
  } = useQuery<Contact[]>({
    queryKey: ["contacts", listIdNum],
    queryFn: async () => {
      if (!actor) return [];
      return getContactsInList(actor, listIdNum);
    },
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async (vars: { name: string; phone: string }) => {
      if (!actor) throw new Error("Backend not available");
      return addContact(actor, listIdNum, vars.name, vars.phone);
    },
    onSuccess: () => {
      toast.success("Contact added successfully");
      setAddOpen(false);
      setContactName("");
      setContactPhone("");
      queryClient.invalidateQueries({ queryKey: ["contacts", listIdNum] });
      queryClient.invalidateQueries({ queryKey: ["contactLists"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add contact");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Backend not available");
      return deleteContact(actor, id);
    },
    onSuccess: () => {
      toast.success("Contact deleted");
      queryClient.invalidateQueries({ queryKey: ["contacts", listIdNum] });
      queryClient.invalidateQueries({ queryKey: ["contactLists"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete contact");
    },
  });

  const importMutation = useMutation({
    mutationFn: async (contacts: Array<{ name: string; phone: string }>) => {
      if (!actor) throw new Error("Backend not available");
      return importContacts(actor, listIdNum, contacts);
    },
    onSuccess: (count) => {
      toast.success(`${count} contacts imported successfully`);
      queryClient.invalidateQueries({ queryKey: ["contacts", listIdNum] });
      queryClient.invalidateQueries({ queryKey: ["contactLists"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to import contacts");
    },
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!search.trim()) return contacts;
    const q = search.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const allSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      for (const c of filteredContacts) {
        next.delete(c.id);
      }
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      for (const c of filteredContacts) {
        next.add(c.id);
      }
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      toast.error("Name is required");
      return;
    }
    const phoneErr = validatePhone(contactPhone);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    addMutation.mutate({
      name: contactName.trim(),
      phone: contactPhone.trim(),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("No valid contacts found in CSV");
        return;
      }
      importMutation.mutate(parsed);
    } catch (err) {
      toast.error((err as Error).message || "Failed to parse CSV");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      deleteMutation.mutate(id);
    }
    setSelectedIds(new Set());
  };

  const isLoadingData = isLoading || isFetching;

  return (
    <div className="space-y-6" data-ocid="contacts.list_detail.page">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/contacts" })}
          data-ocid="contacts.list_detail.back_button"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            {listName}
          </h1>
          <Badge variant="secondary" className="font-mono">
            {contacts?.length ?? 0} contacts
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            data-ocid="contacts.list_detail.import_csv.button"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            data-ocid="contacts.list_detail.import_csv.input"
          />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90"
                data-ocid="contacts.list_detail.add_contact.open_modal_button"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>Add Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to this list.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contact-name"
                      placeholder="e.g. John Doe"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      data-ocid="contacts.list_detail.add_contact.name_input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contact-phone"
                      placeholder="e.g. 919876543210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                      data-ocid="contacts.list_detail.add_contact.phone_input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code, e.g. 919876543210
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={addMutation.isPending}
                    data-ocid="contacts.list_detail.add_contact.submit_button"
                  >
                    {addMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
              data-ocid="contacts.list_detail.search_input"
            />
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleteMutation.isPending}
              data-ocid="contacts.list_detail.bulk_delete_button"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-lg border bg-card shadow-card">
        {isLoadingData ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Failed to load contacts.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["contacts", listIdNum],
                })
              }
              data-ocid="contacts.list_detail.retry_button"
            >
              Retry
            </Button>
          </div>
        ) : filteredContacts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all contacts"
                    data-ocid="contacts.list_detail.select_all.checkbox"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact, index) => (
                <TableRow
                  key={contact.id}
                  data-ocid={`contacts.list_detail.item.${index + 1}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelectOne(contact.id)}
                      aria-label={`Select ${contact.name}`}
                      data-ocid={`contacts.list_detail.checkbox.${index + 1}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {contact.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contact.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(contact.id)}
                      disabled={deleteMutation.isPending}
                      data-ocid={`contacts.list_detail.delete_button.${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ListX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              {search.trim() ? "No matching contacts" : "No contacts yet"}
            </h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              {search.trim()
                ? "Try adjusting your search query."
                : "Add contacts manually or import from a CSV file."}
            </p>
            {!search.trim() && (
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-ocid="contacts.list_detail.empty_state.import_button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setAddOpen(true)}
                  data-ocid="contacts.list_detail.empty_state.add_button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
