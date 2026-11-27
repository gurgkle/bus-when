import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { searchBusStops } from '../services/busService';
import { BusStopInfo } from '../types/bus';

interface StopSearchBarProps {
  activeStopCode: string;
  onSelectStop: (busStopCode: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const QUICK_SAMPLE_STOPS = [
  { code: '09047', label: 'Orchard Stn' },
  { code: '03218', label: 'Marina Bay' },
  { code: '14141', label: 'HarbourFront' },
  { code: '28009', label: 'Jurong East' },
];

export const StopSearchBar: React.FC<StopSearchBarProps> = ({
  activeStopCode,
  onSelectStop,
  inputRef,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    return searchBusStops(query).slice(0, 7);
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // If user typed a 5-digit code directly, look it up immediately
    if (/^\d{5}$/.test(trimmed)) {
      onSelectStop(trimmed);
      setIsOpen(false);
      return;
    }

    // Otherwise select the highlighted match if present
    if (matches.length > 0) {
      const target = matches[highlightedIndex] ?? matches[0];
      onSelectStop(target.BusStopCode);
      setQuery('');
      setIsOpen(false);
    }
  };

  const handlePickMatch = (stop: BusStopInfo) => {
    onSelectStop(stop.BusStopCode);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }
    if (!isOpen || matches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + matches.length) % matches.length);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <section
      ref={containerRef}
      aria-label="Bus stop lookup"
      className="bg-white border border-slate-200 rounded-xl p-5"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Quick Stop Lookup
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter a 5-digit bus stop code, road name, or MRT landmark.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 09047 or Orchard Rd"
              aria-label="Search bus stop code or name"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              className="w-full min-h-[44px] pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/15 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef?.current?.focus();
                }}
                aria-label="Clear search query"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!query.trim()}
            className="min-h-[44px] px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Go</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {isOpen && query.trim().length > 0 && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden divide-y divide-slate-100"
          >
            {matches.length > 0 ? (
              matches.map((stop, idx) => {
                const isSelected = idx === highlightedIndex;
                const isCurrent = stop.BusStopCode === activeStopCode;
                return (
                  <button
                    key={stop.BusStopCode}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handlePickMatch(stop)}
                    className={`w-full text-left px-3.5 py-2.5 min-h-[48px] flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                          {stop.BusStopCode}
                        </span>
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {stop.Description}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {stop.RoadName} · {stop.District}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 font-mono tabular-nums">
                      {isCurrent ? 'Viewing' : `${stop.Services.length} svcs`}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500">
                {/^\d{5}$/.test(query.trim()) ? (
                  <span>
                    Press <strong>Go</strong> to look up stop code{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {query.trim()}
                    </span>
                    .
                  </span>
                ) : (
                  <span>
                    No matching stops in local directory. Enter a 5-digit bus stop code to test lookup.
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </form>

      <div className="mt-3.5 pt-3.5 border-t border-slate-100">
        <div className="text-xs text-slate-500 mb-2">Popular stops</div>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_SAMPLE_STOPS.map((sample) => {
            const isActive = activeStopCode === sample.code;
            return (
              <button
                key={sample.code}
                type="button"
                onClick={() => onSelectStop(sample.code)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-md border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-xs font-medium truncate">
                  {sample.label}
                </span>
                <span
                  className={`font-mono text-[11px] tabular-nums shrink-0 ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {sample.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
