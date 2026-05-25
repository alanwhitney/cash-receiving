"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, User, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { createContact, updateContact, deleteContact } from "@/app/actions/contacts";
import { toast } from "@/components/ui/use-toast";
import type { Contact } from "@/types/database";

export function ContactsTab({
  vendorId,
  contacts,
}: {
  vendorId: string;
  contacts: Contact[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact_, setDeleteContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createContact(vendorId, new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setAddOpen(false);
      toast({ title: "Contact added" });
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editContact) return;
    setLoading(true);
    const result = await updateContact(
      editContact.id,
      vendorId,
      new FormData(e.currentTarget)
    );
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setEditContact(null);
      toast({ title: "Contact updated" });
    }
  }

  async function handleDelete() {
    if (!deleteContact_) return;
    setLoading(true);
    const result = await deleteContact(deleteContact_.id, vendorId);
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setDeleteContact(null);
      toast({ title: "Contact deleted" });
    }
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <User className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="font-medium">No contacts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium">{contact.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {contact.email && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditContact(contact)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteContact(contact)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <ContactFormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editContact} onOpenChange={(o) => !o && setEditContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editContact && (
            <form onSubmit={handleEdit} className="space-y-4">
              <ContactFormFields defaults={editContact} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditContact(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteContact_} onOpenChange={(o) => !o && setDeleteContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <strong>{deleteContact_?.name}</strong> from this vendor?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteContact(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactFormFields({ defaults }: { defaults?: Contact }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaults?.name}
          required
          autoFocus
          placeholder="Jane Smith"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
          placeholder="jane@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaults?.phone ?? ""}
          placeholder="555-123-4567"
        />
      </div>
    </>
  );
}
