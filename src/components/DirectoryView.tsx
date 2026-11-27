import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, Search } from 'lucide-react';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeStops';

interface DirectoryViewProps {
  activeStopCode: string;
  isFavorite: (code: string) => boolean;
  onToggleFavoriteByCode: (code: string) => void;
  onSelectStop: (code: string) => void;
}

const REGION_FILTERS = [
  { id: 'all', label: 'All Stops' },
  { id: 'central', label: 'Central & CBD' },
  { id: 'interchanges', label: 'Bus Interchanges' },
  { id: 'east', label: 'East & Airport' },
] as const;

type RegionFilter = (typeof REGION_FILTERS)[number]['id'];

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  activeStopCode,
  isFavorite,
  onToggleFavoriteByCode,
  onSelectStop,
}) => {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');

  const filteredStops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SINGAPORE_BUS_STOPS.filter((stop) => {
      if (region === 'central') {
        const centralDistricts = [
          'Orchard',
          'Bugis / Bras Basah',
          'Bugis / Kampong Glam',
          'Marina Bay / CBD',
          'Raffles Place / CBD',
          'Singapore River',
          'Chinatown',
          'Museum / Orchard',
        ];
        if (!centralDistricts.includes(stop.District)) return false;
      } else if (region === 'interchanges') {
        if (!stop.Description.includes('Int')) return false;
      } else if (region === 'east') {
        const eastDistricts = ['Tampines', 'Paya Lebar', 'Bedok', 'Changi'];
        if (!eastDistricts.includes(stop.District)) return false;
      }

      if (!q) return true;
      return (
        stop.BusStopCode.includes(q) ||
        stop.Description.toLowerCase().includes(q) ||
        stop.RoadName.toLowerCase().includes(q) ||
        stop.District.toLowerCase().includes(q) ||
        stop.Services.some((s) => s.toLowerCase() === q)
      );
    });
  }, [search, region]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Singapore Bus Stop Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Curated MRT stations, CBD corridors, and major bus interchanges for instant lookup.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter code, road, or bus no."
              aria-label="Filter bus stop directory"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
            {REGION_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRegion(item.id)}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  region === item.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 tabular-nums">
            Showing {filteredStops.length} of {SINGAPORE_BUS_STOPS.length} stops
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
              <th className="py-3 pl-6 pr-4">Stop Code</th>
              <th className="py-3 px-4">Stop Name</th>
              <th className="py-3 px-4">Road & District</th>
              <th className="py-3 px-4">Services</th>
              <th className="py-3 pl-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredStops.map((stop) => {
              const saved = isFavorite(stop.BusStopCode);
              const isCurrent = stop.BusStopCode === activeStopCode;
              return (
                <tr
                  key={stop.BusStopCode}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4 font-mono text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap">
                    {stop.BusStopCode}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {stop.Description}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {stop.RoadName} · {stop.District}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums max-w-xs truncate">
                    {stop.Services.slice(0, 6).join(', ')}
                    {stop.Services.length > 6
                      ? ` +${stop.Services.length - 6}`
                      : ''}
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleFavoriteByCode(stop.BusStopCode)}
                        aria-label={
                          saved
                            ? `Remove ${stop.Description} from favorites`
                            : `Save ${stop.Description} to favorites`
                        }
                        className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                          saved
                            ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${saved ? 'fill-amber-500' : ''}`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectStop(stop.BusStopCode)}
                        className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>View Arrivals</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
