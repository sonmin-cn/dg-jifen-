import { requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { TripImportPreviewClient } from "@/app/admin/trips/import/TripImportPreviewClient";

export default async function TripImportPage() {
  await requireRole(TRIP_MANAGEMENT_ROLES, "/admin/trips/import");

  return <TripImportPreviewClient />;
}
