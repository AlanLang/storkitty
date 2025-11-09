import { HardDrive, LogOut, UserIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

export function FilesHeader() {
  const { user, version, logout } = useAuth();
  return (
    <header className="flex-shrink-0 border-b toolbar backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Storkitty</h1>
            {version && (
              <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-muted/60 rounded border border-border/50 translate-y-0.5">
                v{version}
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{user?.username}</span>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">退出</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
