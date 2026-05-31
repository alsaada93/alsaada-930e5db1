import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-5">
      <div>
        <h1 className="text-xl font-extrabold text-card-foreground md:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {user?.email && (
          <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">خروج</span>
        </Button>
      </div>
    </header>
  );
}
