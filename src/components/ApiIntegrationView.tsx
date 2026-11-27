import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ApiIntegrationViewProps {
  onBackToArrivals: () => void;
}

export const ApiIntegrationView: React.FC<ApiIntegrationViewProps> = ({
  onBackToArrivals,
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            LTA DataMall API Integration Guide
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Frontend state and data models are structured to match LTA DataMall BusArrivalv2.
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
              01. Connect Your Backend Proxy
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              LTA DataMall requires an <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">AccountKey</code> header and does not permit direct browser CORS requests. Add an Express route at <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/bus-arrival</code> that forwards the request server-side.
            </p>
            <pre className="mt-3 p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`// server.ts (Express proxy endpoint)
app.get('/api/bus-arrival', async (req, res) => {
  const code = String(req.query.BusStopCode || '');
  const response = await fetch(
    \`https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=\${code}\`,
    { headers: { AccountKey: process.env.LTA_ACCOUNT_KEY! } }
  );
  const data = await response.json();
  res.json(data);
});`}
            </pre>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              02. Swap the Frontend Fetcher
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Update <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">fetchBusArrivals</code> inside <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/services/busService.ts</code>. Every component already consumes <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">NextBus</code>, <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">NextBus2</code>, <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">NextBus3</code>, <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Load</code>, <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Feature</code>, and <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Type</code> using LTA’s exact property names.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/70">
            <h2 className="text-base font-semibold text-slate-900">
              Mapped LTA Schema Fields
            </h2>
            <dl className="mt-4 divide-y divide-slate-200 text-xs">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="font-mono font-medium text-slate-800">BusStopCode</dt>
                <dd className="text-slate-600 text-right">5-digit stop ID (e.g. 09047)</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="font-mono font-medium text-slate-800">ServiceNo</dt>
                <dd className="text-slate-600 text-right">Bus service number (e.g. 174)</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="font-mono font-medium text-slate-800">Operator</dt>
                <dd className="text-slate-600 text-right">SBST · SMRT · TTS · GAS</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="font-mono font-medium text-slate-800">EstimatedArrival</dt>
                <dd className="text-slate-600 text-right">ISO-8601 timestamp</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="font-mono font-medium text-slate-800">Load</dt>
                <dd className="text-slate-600 text-right">SEA (Seats) · SDA · LSD</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="font-mono font-medium text-slate-800">Feature</dt>
                <dd className="text-slate-600 text-right">WAB (Wheelchair Accessible)</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="font-mono font-medium text-slate-800">Type</dt>
                <dd className="text-slate-600 text-right">SD · DD (Double) · BD (Bendy)</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};
