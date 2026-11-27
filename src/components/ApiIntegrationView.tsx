import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ApiHealthStatus, fetchApiHealth } from '../services/busService';

interface ApiIntegrationViewProps {
  onBackToArrivals: () => void;
}

export const ApiIntegrationView: React.FC<ApiIntegrationViewProps> = ({
  onBackToArrivals,
}) => {
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(true);

  const checkHealth = async () => {
    setChecking(true);
    setHealthError(null);
    try {
      const data = await fetchApiHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setHealthError(
        err instanceof Error ? err.message : 'Unable to reach /api/health'
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            LTA DataMall v3 Serverless Connection
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Serverless routes at <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/health</code> and <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/busarrival</code> proxy LTA DataMall securely without exposing your key.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToArrivals}
          className="min-h-[44px] px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Arrivals</span>
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              01. Configure Your LTA Account Key
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Add <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">LTA_ACCOUNT_KEY</code> as a server-side environment secret (or in your local <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.env</code> file). The key is never bundled into the browser client and is attached only by <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/busarrival.ts</code> as the <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">AccountKey</code> header.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              02. Available Serverless Endpoints
            </h2>
            <div className="mt-3 divide-y divide-slate-200 border border-slate-200 rounded-lg text-xs">
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono font-semibold text-slate-900">
                  GET /api/health
                </span>
                <span className="text-slate-600">
                  Verifies server readiness and whether LTA_ACCOUNT_KEY is set
                </span>
              </div>
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono font-semibold text-slate-900">
                  GET /api/busarrival?BusStopCode=04121
                </span>
                <span className="text-slate-600">
                  Fetches LTA DataMall v3 arrivals (optional &amp;ServiceNo=7)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/70">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Serverless Health Status
              </h2>
              <button
                type="button"
                onClick={checkHealth}
                disabled={checking}
                className="min-h-[36px] px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Check</span>
              </button>
            </div>

            {healthError ? (
              <p className="mt-3 text-xs text-red-700">{healthError}</p>
            ) : (
              <dl className="mt-4 divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-600">Endpoint Status</dt>
                  <dd className="font-mono font-medium text-emerald-700">
                    {health?.ok ? 'Healthy' : checking ? 'Checking...' : 'Unavailable'}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-600">LTA API Version</dt>
                  <dd className="font-mono text-slate-900">
                    {health?.ltaEndpointVersion ?? 'v3'}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-600">LTA_ACCOUNT_KEY</dt>
                  <dd
                    className={`font-mono font-medium ${
                      health?.ltaKeyConfigured ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {health
                      ? health.ltaKeyConfigured
                        ? 'Configured'
                        : 'Not set yet'
                      : 'Checking...'}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-600">Refresh Cadence</dt>
                  <dd className="font-mono text-slate-900 tabular-nums">
                    20s
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
