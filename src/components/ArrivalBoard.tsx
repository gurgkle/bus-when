import React, { useMemo, useState } from 'react';
import {
  Accessibility,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  formatArrivalMinutes,
  formatClockTime,
  getBusTypeLabel,
  getLoadMeta,
  getOperatorFullName,
} from '../services/busService';
import {
  BusServiceArrival,
  BusStopArrivalResponse,
  BusStopInfo,
  NextBusEstimate,
} from '../types/bus';

type ArrivalFilter = 'all' | 'soon' | 'wab' | 'dd';

interface ArrivalBoardProps {
  stopInfo: BusStopInfo | undefined;
  requestedStopCode: string;
  arrivalData: BusStopArrivalResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  nowMs: number;
  secondsToRefresh: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRefresh: () => void;
  onSelectStop: (code: string) => void;
}

const LoadMeter: React.FC<{ load: NextBusEstimate['Load'] }> = ({ load }) => {
  const meta = getLoadMeta(load);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-end gap-0.5 h-3"
        aria-hidden="true"
      >
        <span
          className={`w-1 h-1.5 rounded-[1px] ${
            meta.bars >= 1 ? meta.barClass : 'bg-slate-200'
          }`}
        />
        <span
          className={`w-1 h-2 rounded-[1px] ${
            meta.bars >= 2 ? meta.barClass : 'bg-slate-200'
          }`}
        />
        <span
          className={`w-1 h-3 rounded-[1px] ${
            meta.bars >= 3 ? meta.barClass : 'bg-slate-200'
          }`}
        />
      </span>
      <span className={`text-xs font-medium ${meta.textClass}`}>
        {meta.label}
      </span>
    </span>
  );
};

export const ArrivalBoard: React.FC<ArrivalBoardProps> = ({
  stopInfo,
  requestedStopCode,
  arrivalData,
  isLoading,
  isRefreshing,
  error,
  nowMs,
  secondsToRefresh,
  isFavorite,
  onToggleFavorite,
  onRefresh,
  onSelectStop,
}) => {
  const [filter, setFilter] = useState<ArrivalFilter>('all');
  const [serviceQuery, setServiceQuery] = useState('');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(requestedStopCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  const filteredServices = useMemo(() => {
    if (!arrivalData) return [];
    const q = serviceQuery.trim().toLowerCase();

    return arrivalData.Services.filter((svc) => {
      if (q && !svc.ServiceNo.toLowerCase().includes(q)) {
        return false;
      }
      if (filter === 'soon') {
        const { minutes } = formatArrivalMinutes(
          svc.NextBus.EstimatedArrival,
          nowMs
        );
        return minutes <= 5;
      }
      if (filter === 'wab') {
        return svc.NextBus.Feature === 'WAB';
      }
      if (filter === 'dd') {
        return svc.NextBus.Type === 'DD';
      }
      return true;
    });
  }, [arrivalData, filter, serviceQuery, nowMs]);

  if (error && !isLoading) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="max-w-md">
          <div className="font-mono text-sm font-semibold text-red-700 tabular-nums">
            Stop {requestedStopCode}
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">
            Bus stop not found in local directory
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {error} Connect your LTA DataMall API endpoint in{' '}
            <span className="font-mono text-xs text-slate-800">
              src/services/busService.ts
            </span>{' '}
            to query all 5,000+ stops across Singapore, or choose a curated stop below.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['09047', '01012', '03218', '75009'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onSelectStop(code)}
                className="min-h-[40px] px-3.5 py-2 text-xs font-mono font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Load {code}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Bus arrival board"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Stop Identity & Actions Header */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold tracking-tight text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums">
                {requestedStopCode}
              </span>
              <span className="text-xs text-slate-500">
                {stopInfo ? `${stopInfo.RoadName} · ${stopInfo.District}` : 'Singapore Transit Stop'}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2 text-balance">
              {stopInfo?.Description ?? `Bus Stop ${requestedStopCode}`}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 tabular-nums flex-wrap">
              <span>
                {arrivalData
                  ? `${arrivalData.Services.length} active services`
                  : 'Loading services'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {arrivalData
                  ? `Updated ${formatClockTime(arrivalData.fetchedAt)}`
                  : 'Syncing'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Auto-refresh in {secondsToRefresh}s</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleCopyCode}
              className="min-h-[44px] px-3.5 py-2 text-xs font-medium border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleFavorite}
              disabled={!stopInfo}
              className={`min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isFavorite
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  isFavorite ? 'fill-amber-500 text-amber-600' : 'text-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>{isFavorite ? 'Saved' : 'Save Stop'}</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh bus arrivals"
              className="min-h-[44px] px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Service Number Filter */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Filter bus arrivals"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full"
          >
            {(
              [
                { id: 'all', label: 'All Services' },
                { id: 'soon', label: 'Arriving ≤5m' },
                { id: 'wab', label: 'Wheelchair' },
                { id: 'dd', label: 'Double Deck' },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-52">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              placeholder="Filter service no."
              aria-label="Filter by bus service number"
              className="w-full min-h-[40px] pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Column Headers (Desktop) */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-2.5 bg-slate-50/80 border-b border-slate-200 text-xs font-medium text-slate-500">
        <div className="col-span-2">Service</div>
        <div className="col-span-4">Route & Vehicle</div>
        <div className="col-span-3">Next Bus</div>
        <div className="col-span-3 text-right">Subsequent</div>
      </div>

      {/* Arrival Rows */}
      {isLoading ? (
        <div className="divide-y divide-slate-100" aria-busy="true">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="px-6 py-4 flex items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-7 bg-slate-200 rounded" />
                <div className="space-y-1.5">
                  <div className="w-44 h-4 bg-slate-200 rounded" />
                  <div className="w-28 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-16 h-6 bg-slate-200 rounded" />
                <div className="w-20 h-5 bg-slate-100 rounded hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">
            No bus services match the active filter
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Clear your service filter or switch back to All Services to see every route at this stop.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setServiceQuery('');
            }}
            className="mt-4 min-h-[40px] px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filteredServices.map((svc) => (
            <ServiceRow
              key={svc.ServiceNo}
              service={svc}
              nowMs={nowMs}
              isExpanded={expandedService === svc.ServiceNo}
              onToggleExpand={() =>
                setExpandedService((prev) =>
                  prev === svc.ServiceNo ? null : svc.ServiceNo
                )
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
};

interface ServiceRowProps {
  service: BusServiceArrival;
  nowMs: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ServiceRow: React.FC<ServiceRowProps> = ({
  service,
  nowMs,
  isExpanded,
  onToggleExpand,
}) => {
  const next1 = formatArrivalMinutes(service.NextBus.EstimatedArrival, nowMs);
  const next2 = service.NextBus2
    ? formatArrivalMinutes(service.NextBus2.EstimatedArrival, nowMs)
    : null;
  const next3 = service.NextBus3
    ? formatArrivalMinutes(service.NextBus3.EstimatedArrival, nowMs)
    : null;

  const isWab = service.NextBus.Feature === 'WAB';

  return (
    <li>
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        className={`w-full text-left px-6 py-4 min-h-[64px] transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-50 ${
          isExpanded ? 'bg-slate-50/90' : 'hover:bg-slate-50/70'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Col 1: Service Number + Operator */}
          <div className="sm:col-span-2 flex sm:block items-baseline justify-between">
            <div className="font-mono text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {service.ServiceNo}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {service.Operator}
            </div>
          </div>

          {/* Col 2: Route & Vehicle Metadata (unboxed text with separators) */}
          <div className="sm:col-span-4 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">
              {service.routeLabel}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
              <span>{getBusTypeLabel(service.NextBus.Type)}</span>
              {isWab && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>WAB</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Col 3: Next Bus Timing & Load */}
          <div className="sm:col-span-3 flex sm:flex-col items-center sm:items-start justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-lg font-bold tabular-nums ${
                  next1.isArriving ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {next1.label}
              </span>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {formatClockTime(service.NextBus.EstimatedArrival)}
              </span>
            </div>
            <LoadMeter load={service.NextBus.Load} />
          </div>

          {/* Col 4: Subsequent Arrivals + Expand Affordance */}
          <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-4">
            <div className="flex items-center gap-4 text-xs text-slate-600 font-mono tabular-nums">
              {next2 && (
                <div className="text-left sm:text-right">
                  <div className="font-semibold text-slate-800">
                    {next2.label}
                  </div>
                  <div className="text-[11px] font-sans text-slate-500">
                    {getLoadMeta(service.NextBus2!.Load).label}
                  </div>
                </div>
              )}
              {next3 && (
                <div className="text-left sm:text-right">
                  <div className="font-semibold text-slate-700">
                    {next3.label}
                  </div>
                  <div className="text-[11px] font-sans text-slate-500">
                    {getLoadMeta(service.NextBus3!.Load).label}
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-400 shrink-0" aria-hidden="true">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-5 pt-2 bg-slate-50/90 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span>
              Operator: <strong className="font-medium text-slate-800">{getOperatorFullName(service.Operator)}</strong>
            </span>
            <span>Next 3 incoming trips</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: '1st Bus', est: service.NextBus },
              { title: '2nd Bus', est: service.NextBus2 },
              { title: '3rd Bus', est: service.NextBus3 },
            ].map(({ title, est }) => {
              if (!est) return null;
              const timing = formatArrivalMinutes(est.EstimatedArrival, nowMs);
              return (
                <div
                  key={title}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs text-slate-500">{title}</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                        {timing.label}
                      </span>
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {formatClockTime(est.EstimatedArrival)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <LoadMeter load={est.Load} />
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {getBusTypeLabel(est.Type)}
                      {est.Feature === 'WAB' ? ' · WAB' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
};
