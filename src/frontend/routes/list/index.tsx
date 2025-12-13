import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toggle } from "@/components/ui/toggle";
import { FileListSidebar } from "@/routes/list/$space/components/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { Circle } from "lucide-react";

export const Route = createFileRoute("/list/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full w-full">
      <FileListSidebar />
      <SidebarInset className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center h-18 shrink-0">
          <Toolbar />
        </div>
      </SidebarInset>
    </div>
  );
}

function Toolbar() {
  return (
    <div className="w-full flex items-center justify-between gap-4">
      <div className="flex-1 flex items-center gap-2">
        <SidebarTrigger />
        <Input placeholder="搜索" className="w-full" />
      </div>
      <div className="flex items-center gap-2">
        <Toggle
          aria-label="Toggle bookmark"
          size="sm"
          variant="outline"
          className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary"
        >
          <Circle />
        </Toggle>
      </div>
    </div>
  );
}
