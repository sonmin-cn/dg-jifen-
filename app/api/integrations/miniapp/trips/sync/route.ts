import { miniappPlaceholder } from "@/app/api/integrations/miniapp/_placeholder";

export async function POST() {
  return miniappPlaceholder("/api/integrations/miniapp/trips/sync");
}
