"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/app/actions/departments";
import { toast } from "@/components/ui/use-toast";
import type { Department } from "@/types/database";

export function DepartmentsClient({
  departments,
}: {
  departments: Department[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createDepartment(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setAddOpen(false);
      toast({ title: "Department added" });
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editDept) return;
    setLoading(true);
    const result = await updateDepartment(
      editDept.id,
      new FormData(e.currentTarget)
    );
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setEditDept(null);
      toast({ title: "Department updated" });
    }
  }

  async function handleDelete() {
    if (!deleteDept) return;
    setLoading(true);
    const result = await deleteDepartment(deleteDept.id);
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setDeleteDept(null);
      toast({ title: "Department deleted" });
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">No departments yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Departments let you set target margins per category
            </p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Target margin:{" "}
                      <Badge variant="outline">
                        {dept.target_margin}%
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditDept(dept)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteDept(dept)}
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
            <DialogTitle>Add Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <DeptFormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editDept} onOpenChange={(o) => !o && setEditDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          {editDept && (
            <form onSubmit={handleEdit} className="space-y-4">
              <DeptFormFields defaults={editDept} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDept(null)}>
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
      <Dialog open={!!deleteDept} onOpenChange={(o) => !o && setDeleteDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete department?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Items in <strong>{deleteDept?.name}</strong> will lose their
            department assignment.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDept(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeptFormFields({ defaults }: { defaults?: Department }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Department name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaults?.name}
          required
          autoFocus
          placeholder="e.g. Produce"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="target_margin">Target Margin % *</Label>
        <Input
          id="target_margin"
          name="target_margin"
          type="number"
          step="0.1"
          min="0"
          max="100"
          defaultValue={defaults?.target_margin ?? "30"}
          required
          placeholder="30"
          inputMode="decimal"
        />
      </div>
    </>
  );
}
