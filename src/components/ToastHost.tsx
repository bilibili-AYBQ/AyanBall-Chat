import { useToastStore } from "../stores/toastStore";

export default function ToastHost() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);

  const icon = (kind: string) => {
    if (kind === "success")
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    if (kind === "error")
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5m0 3v.01M5.6 3h12.8L21 6.5v11L18.4 21H5.6L3 17.5v-11L5.6 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  };

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[340px] flex-col gap-2">
      {items.map((toast) => (
        <div
          key={toast.id}
          onClick={() => remove(toast.id)}
          className="anim-toast pointer-events-auto flex cursor-pointer items-start gap-3 rounded-xl bd bg-toast p-3.5 sh backdrop-blur"
        >
          {icon(toast.kind)}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-1">{toast.title}</div>
            <div className="mt-0.5 text-xs leading-relaxed text-2">{toast.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
