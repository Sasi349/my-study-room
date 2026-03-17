import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="mb-5 w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
        {icon || <FolderOpen size={28} />}
      </div>
      <h3 className="text-base font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500 max-w-xs">{description}</p>
      )}
    </div>
  );
}
