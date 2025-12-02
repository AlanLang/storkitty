import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/user/")({
  beforeLoad() {
    throw redirect({
      to: "/settings/user/profile",
    });
  },
});
