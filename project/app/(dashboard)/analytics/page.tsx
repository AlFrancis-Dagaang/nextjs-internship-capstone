import { getAnalytics } from "@/lib/actions/analytics";
import { AnalyticsView } from "@/components/analytics/analytics-view";

type SearchParams = Promise<{
  startDate?: string;
  endDate?: string;
  projectId?: string;
}>;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const result = await getAnalytics({
    startDate: params.startDate,
    endDate: params.endDate,
    projectId: params.projectId,
  });

  if (!result.success) {
    return (
      <div className="p-6 rounded-lg bg-card border border-border text-destructive">
        Error loading analytics: {result.error}
      </div>
    );
  }

  return <AnalyticsView data={result.data} />;
}
