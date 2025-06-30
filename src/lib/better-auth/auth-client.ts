import { createAuthClient } from "better-auth/react";
import { BETTER_URL } from "../env";

export const authClient = createAuthClient({
  baseURL: BETTER_URL,
});

export const { useSession } = authClient;
