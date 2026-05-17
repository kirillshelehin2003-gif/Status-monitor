import { SearchX } from "lucide-react";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div>
        <SearchX size={28} />
        <h2 className="section-title">{title}</h2>
        <p className="panel-copy">{text}</p>
      </div>
    </div>
  );
}
