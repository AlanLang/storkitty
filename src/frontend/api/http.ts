import { token } from "@/lib/token";
import ky from "ky";

export const http = ky.create({
  prefixUrl: "/api",
  hooks: {
    beforeRequest: [
      (request) => {
        const tokenStr = token.get();
        if (token) {
          request.headers.set("Authorization", `Bearer ${tokenStr}`);
        }
      },
    ],
  },
});
