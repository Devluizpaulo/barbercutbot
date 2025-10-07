import { Scissors } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="Barbearia SaaS Home">
      <div className="p-2 bg-primary text-primary-foreground rounded-lg">
        <Scissors className="h-5 w-5" />
      </div>
      <span className="text-xl font-bold tracking-tight font-headline">
        Barbearia
      </span>
    </div>
  );
}
