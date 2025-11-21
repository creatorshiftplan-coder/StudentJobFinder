import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: LucideIcon;
  imageSrc?: string;
}

export function EmptyState({ title, description, action, icon: Icon, imageSrc }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="empty-state">
      {imageSrc && (
        <img src={imageSrc} alt={title} className="w-48 h-48 mb-6 opacity-80" />
      )}
      {Icon && !imageSrc && (
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm" data-testid="text-empty-description">{description}</p>
      {action && (
        <Button onClick={action.onClick} data-testid="button-empty-action">
          {action.label}
        </Button>
      )}
    </div>
  );
}
