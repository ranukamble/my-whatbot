import { createActor } from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createContactList,
  deleteContactList,
  getContactLists,
  getContactsInList,
} from "@/lib/backend";
import type { ContactList } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye, ListX, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function useContactBackend() {
  const { actor, isFetching } = useActor(createActor);
  return { actor, isFetching };
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString();
}

function ContactCountBadge({ listId }: { listId: number }) {
  const { actor } = useContactBackend();
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", listId],
    queryFn: async () => {
      if (!actor) return [];
      return getContactsInList(actor, listId);
    },
    enabled: !!actor,
  });

  if (isLoading) {
    return <Skeleton className="h-5 w-10" />;
  }

  const count = contacts?.length ?? 0;
  return (
    <Badge variant="secondary" className="font-mono">
      {count}
    </Badge>
  );
}

export default function Contacts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor, isFetching } = useContactBackend();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const {
    data: lists,
    isLoading: listsLoading,
    isError: listsError,
  } = useQuery<ContactList[]>({
    queryKey: ["contactLists"],
    queryFn: async () => {
      if (!actor) return [];
      return getContactLists(actor);
    },
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: async (vars: { name: string; description: string }) => {
      if (!actor) throw new Error("Backend not available");
      return createContactList(actor, vars.name, vars.description);
    },
    onSuccess: () => {
      toast.success("Contact list created successfully");
      setCreateOpen(false);
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["contactLists"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create contact list");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Backend not available");
      return deleteContactList(actor, id);
    },
    onSuccess: () => {
      toast.success("Contact list deleted");
      setDeleteOpen(false);
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["contactLists"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete contact list");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("List name is required");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
    });
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId !== null) {
      deleteMutation.mutate(deleteId);
    }
  };

  const isLoading = listsLoading || isFetching;

  return (
    <div className="space-y-6" data-ocid="contacts.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Contacts
          </h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90"
              data-ocid="contacts.create_list.open_modal_button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contact List
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Contact List</DialogTitle>
                <DialogDescription>
                  Create a new list to organize your contacts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="list-name">
                    List Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="list-name"
                    placeholder="e.g. Marketing Leads"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-ocid="contacts.create_list.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list-description">Description</Label>
                  <Textarea
                    id="list-description"
                    placeholder="Optional description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    data-ocid="contacts.create_list.textarea"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-ocid="contacts.create_list.submit_button"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-card">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : listsError ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Failed to load contact lists.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["contactLists"] })
              }
              data-ocid="contacts.retry_button"
            >
              Retry
            </Button>
          </div>
        ) : lists && lists.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Contact Count</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.map((list, index) => (
                <TableRow
                  key={list.id}
                  data-ocid={`contacts.list.item.${index + 1}`}
                >
                  <TableCell className="font-medium">{list.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {list.description || "—"}
                  </TableCell>
                  <TableCell>
                    <ContactCountBadge listId={list.id} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(list.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate({
                            to: "/contacts/$listId",
                            params: { listId: String(list.id) },
                          })
                        }
                        data-ocid={`contacts.list.view_button.${index + 1}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(list.id)}
                        data-ocid={`contacts.list.delete_button.${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ListX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              No contact lists yet
            </h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Create your first contact list to start organizing your contacts.
            </p>
            <Button
              className="mt-4 bg-primary hover:bg-primary/90"
              onClick={() => setCreateOpen(true)}
              data-ocid="contacts.empty_state.create_button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contact List
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact list? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteId(null)}
              data-ocid="contacts.delete_list.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="contacts.delete_list.confirm_button"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
