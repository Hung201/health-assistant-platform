/** Mốc thời gian dùng lọc thống kê — ưu tiên ngày thanh toán. */
export function bookingStatsAt(alias: string): string {
  return `COALESCE(${alias}.paid_at, ${alias}.updated_at, ${alias}.created_at)`;
}

export function bookingPeriodSince(alias: string, periodDaysParam = 'periodDays'): string {
  return `${bookingStatsAt(alias)} >= NOW() - (:${periodDaysParam}::text || ' days')::interval`;
}

export function bookingPeriodBefore(alias: string, periodDaysParam = 'periodDays'): string {
  return `${bookingStatsAt(alias)} < NOW() - (:${periodDaysParam}::text || ' days')::interval`;
}

export function bookingPeriodBetweenPrevious(
  alias: string,
  periodDaysParam = 'periodDays',
): string {
  return `${bookingStatsAt(alias)} >= NOW() - ((:${periodDaysParam}::int * 2)::text || ' days')::interval AND ${bookingPeriodBefore(alias, periodDaysParam)}`;
}

export function bookingStatsDayKey(alias: string): string {
  return `TO_CHAR(DATE_TRUNC('day', ${bookingStatsAt(alias)}), 'YYYY-MM-DD')`;
}

export function fillRevenueTrendDays(
  periodDays: number,
  trendByDate: Map<string, { paidBookings: number; revenue: number }>,
) {
  const end = new Date();
  return Array.from({ length: periodDays }, (_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (periodDays - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const found = trendByDate.get(key);
    return {
      date: key,
      paidBookings: found?.paidBookings ?? 0,
      revenue: found?.revenue ?? 0,
    };
  });
}
