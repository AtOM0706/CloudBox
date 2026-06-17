import { useEffect, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "../api/client";
import { useUpdateItem } from "../api/hooks";
import Modal from "./Modal";

export default function RenameDialog({
  open,
  onOpenChange,
  kind,
  id,
  currentName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: "file" | "folder";
  id: number;
  currentName: string;
}) {
  const [name, setName] = useState(currentName);
  const update = useUpdateItem();

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate(
      { kind, id, body: { name: name.trim() } },
      {
        onSuccess: () => {
          toast.success("Renamed");
          onOpenChange(false);
        },
        onError: (err) => toast.error(errorMessage(err)),
      }
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Rename">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={update.isPending}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
