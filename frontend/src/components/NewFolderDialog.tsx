import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "../api/client";
import { useCreateFolder } from "../api/hooks";
import Modal from "./Modal";

export default function NewFolderDialog({
  open,
  onOpenChange,
  parentId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  parentId: number | null;
}) {
  const [name, setName] = useState("");
  const create = useCreateFolder();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), parentId },
      {
        onSuccess: () => {
          toast.success("Folder created");
          setName("");
          onOpenChange(false);
        },
        onError: (err) => toast.error(errorMessage(err)),
      }
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New folder">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="input"
        />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
