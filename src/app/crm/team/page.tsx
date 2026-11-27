import { requireStaff } from "@/lib/auth";
import TeamView from "./team-view";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await requireStaff();
  return <TeamView />;
}
