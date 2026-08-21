import { requireAuthedDbUser } from "@/lib/services/auth";
import { queries } from "@/lib/db";
import { SettingsShell } from "@/components/settings/settings-shell";

type SearchParams = Promise<{ tab?: string }>;

const VALID_TABS = [
  "profile",
  "notifications",
  "security",
  "appearance",
  "teams",
] as const;
export type SettingsTab = (typeof VALID_TABS)[number];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const dbUser = await requireAuthedDbUser();
  const teams = await queries.teams.getForUser(dbUser.id);

  const { tab } = await searchParams;
  const activeTab: SettingsTab = VALID_TABS.includes(tab as SettingsTab)
    ? (tab as SettingsTab)
    : "profile";

  return <SettingsShell activeTab={activeTab} dbUser={dbUser} teams={teams} />;
}
