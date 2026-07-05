import React, { useEffect, useMemo, useState } from 'react';
import { reportApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DEFAULT_LIMIT = 1000;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatMoney(value) {
  return `${formatNumber(value)}đ`;
}

function formatDateTime(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

async function extractErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      return JSON.parse(text).message || fallback;
    } catch {
      return fallback;
    }
  }

  return data?.detail || data?.message || error?.message || fallback;
}

function StatusPill({ status, detail }) {
  const isOk = status === 'ok' || status === 'ready';
  const className = isOk
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${className}`} title={detail || ''}>
      <i className={`fa-solid ${isOk ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
      {status || 'unknown'}
    </span>
  );
}

function StatTile({ label, value, icon, tone = 'text-primary-600' }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
        <i className={`fa-solid ${icon} ${tone}`} />
      </div>
      <p className="text-sm text-warmink-2">{label}</p>
      <p className="mt-1 text-xl font-bold text-warmink">{value ?? '-'}</p>
    </div>
  );
}

function EndpointRow({ method, path, auth, note }) {
  return (
    <tr className="odd:bg-surface-2/50">
      <td className="px-4 py-3">
        <span className="rounded bg-blue-50 px-2 py-1 font-mono text-xs font-semibold text-blue-700">{method}</span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-warmink">{path}</td>
      <td className="px-4 py-3 text-sm text-warmink-2">{auth}</td>
      <td className="px-4 py-3 text-sm text-warmink-2">{note}</td>
    </tr>
  );
}

export default function AdminRubyReports() {
  const [health, setHealth] = useState(null);
  const [ready, setReady] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [summary, setSummary] = useState(null);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const [lastDownload, setLastDownload] = useState(null);

  const totals = summary?.totals || {};
  const generatedAt = useMemo(() => formatDateTime(summary?.generatedAt), [summary?.generatedAt]);

  const loadReports = async ({ quiet = false } = {}) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    const [healthResult, readyResult, catalogResult, summaryResult] = await Promise.allSettled([
      reportApi.getHealth(),
      reportApi.getReady(),
      reportApi.getCatalog(),
      reportApi.getSummary(),
    ]);

    if (healthResult.status === 'fulfilled') setHealth(healthResult.value.data);
    if (readyResult.status === 'fulfilled') setReady(readyResult.value.data);
    if (catalogResult.status === 'fulfilled') setCatalog(catalogResult.value.data);
    if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value.data);

    const failed = [healthResult, readyResult, catalogResult, summaryResult].filter((item) => item.status === 'rejected');
    if (failed.length > 0) {
      const message = await extractErrorMessage(
        failed[0].reason,
        'Không tải được dữ liệu từ RubyReportService.',
      );
      setError(message);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const exportCsv = async (type) => {
    const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 10000);
    setLimit(safeLimit);
    setExporting(type);
    setError('');

    try {
      const response = type === 'events'
        ? await reportApi.exportEventsCsv(safeLimit)
        : await reportApi.exportDonationsCsv(safeLimit);
      const filename = `ruby_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(response.data, filename);
      setLastDownload({ filename, limit: safeLimit, at: new Date().toISOString() });
    } catch (err) {
      setError(await extractErrorMessage(err, 'Không xuất được file CSV từ RubyReportService.'));
    } finally {
      setExporting('');
    }
  };

  if (loading) return <LoadingSpinner />;

  const endpointRows = catalog?.endpoints?.length
    ? catalog.endpoints
    : ['/api/reports/summary', '/api/reports/events.csv', '/api/reports/donations.csv'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-warmink">Báo cáo Ruby</h1>
          <p className="mt-1 text-sm text-warmink-2">RubyReportService xuất báo cáo CSV từ SQL Server qua ApiGateway.</p>
        </div>
        <button
          type="button"
          onClick={() => loadReports({ quiet: true })}
          disabled={refreshing}
          className="btn-secondary"
        >
          {refreshing ? <span className="h-4 w-4 rounded-full border-2 border-warmborder-2 border-t-transparent animate-spin" /> : <i className="fa-solid fa-rotate-right" />}
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <i className="fa-solid fa-triangle-exclamation mr-2" />
          {error}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-warmink">Trạng thái service</h2>
              <p className="mt-1 text-sm text-warmink-2">Port local 5005, gateway qua /api/reports.</p>
            </div>
            <StatusPill status={health?.status} detail={health?.detail} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-warmink-3">Health</p>
              <p className="mt-1 font-medium text-warmink">{health?.service || 'RubyReportService'}</p>
            </div>
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-warmink-3">Ready</p>
              <div className="mt-1">
                <StatusPill status={ready?.status} detail={ready?.detail} />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold text-warmink">Xuất CSV</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="block">
              <span className="mb-1 block text-sm text-warmink-2">Số dòng tối đa</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="input-field"
              />
            </label>
            <button
              type="button"
              onClick={() => exportCsv('events')}
              disabled={!!exporting}
              className="btn-primary"
            >
              {exporting === 'events' ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <i className="fa-solid fa-calendar-days" />}
              Events CSV
            </button>
            <button
              type="button"
              onClick={() => exportCsv('donations')}
              disabled={!!exporting}
              className="btn-secondary"
            >
              {exporting === 'donations' ? <span className="h-4 w-4 rounded-full border-2 border-warmborder-2 border-t-transparent animate-spin" /> : <i className="fa-solid fa-hand-holding-dollar" />}
              Donations CSV
            </button>
          </div>
          {lastDownload && (
            <p className="mt-3 text-sm text-emerald-700">
              <i className="fa-solid fa-circle-check mr-2" />
              {lastDownload.filename} · {lastDownload.limit} dòng · {formatDateTime(lastDownload.at)}
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Sự kiện" value={formatNumber(totals.events)} icon="fa-calendar-check" />
        <StatTile label="Đăng ký" value={formatNumber(totals.registrations)} icon="fa-clipboard-list" tone="text-violet-600" />
        <StatTile label="Campaign" value={formatNumber(totals.supportCampaigns)} icon="fa-bullhorn" tone="text-amber-600" />
        <StatTile label="Donation" value={formatNumber(totals.donations)} icon="fa-hand-holding-heart" tone="text-emerald-600" />
        <StatTile label="Đã xác nhận" value={formatMoney(totals.confirmedDonationAmount)} icon="fa-sack-dollar" tone="text-emerald-700" />
      </div>

      <section className="card p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-warmink">Ruby report summary</h2>
          <span className="text-sm text-warmink-2">Generated: {generatedAt}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Endpoint</th>
                <th className="px-4 py-3 text-left">Auth</th>
                <th className="px-4 py-3 text-left">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              <EndpointRow method="GET" path="/api/reports/health" auth="Public" note="Kiểm tra service Ruby" />
              <EndpointRow method="GET" path="/api/reports/ready" auth="Public" note="Kiểm tra kết nối SQL" />
              {endpointRows.map((path) => (
                <EndpointRow
                  key={path}
                  method="GET"
                  path={path}
                  auth="Admin"
                  note={path.endsWith('.csv') ? 'Tải file CSV' : 'JSON metadata'}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
