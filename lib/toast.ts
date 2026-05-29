import { toast } from 'sonner';

/**
 * Thin wrapper over Sonner so every call site shares one import and we can
 * tune defaults (duration, styling) in a single place. Prefer these over
 * importing `toast` directly.
 */
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
};

interface DeleteWithUndoOptions<T> {
  /** The item being removed (passed back to `restore` if undone/failed). */
  item: T;
  /** Optimistically remove the item from local state. Runs immediately. */
  remove: () => void;
  /** Put the item back (on Undo click or on server failure). */
  restore: () => void;
  /** Perform the real server delete. Resolve on success, reject/false on failure. */
  commit: () => Promise<void | boolean>;
  /** Toast copy. */
  successMessage: string;
  errorMessage: string;
  undoLabel: string;
  /** Undo window in ms. Defaults to the spec's 6 seconds. */
  durationMs?: number;
}

/**
 * Standard "optimistic delete with a 6-second UNDO" flow (spec §14.1).
 * Removes the item immediately, shows a toast with an Undo action, and only
 * commits the server delete after the window elapses. Undo or a failed commit
 * restores the item. Centralizes a block that was previously copy-pasted
 * across every admin list.
 */
export function deleteWithUndo<T>({
  remove,
  restore,
  commit,
  successMessage,
  errorMessage,
  undoLabel,
  durationMs = 6000,
}: DeleteWithUndoOptions<T>) {
  let undone = false;
  remove();

  const timer = setTimeout(async () => {
    if (undone) return;
    try {
      const result = await commit();
      if (result === false) throw new Error('commit returned false');
    } catch {
      restore();
      toast.error(errorMessage);
    }
  }, durationMs);

  toast.success(successMessage, {
    duration: durationMs,
    action: {
      label: undoLabel,
      onClick: () => {
        undone = true;
        clearTimeout(timer);
        restore();
      },
    },
  });
}
