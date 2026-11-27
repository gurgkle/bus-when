import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { ApiIntegrationView } from './components/ApiIntegrationView';
import { ArrivalBoard } from './components/ArrivalBoard';
import { DirectoryView } from './components/DirectoryView';
import { FavoritesPanel } from './components/FavoritesPanel';
import { StopSearchBar } from './components/StopSearchBar';
import { useFavorites } from './hooks/useFavorites';
import { fetchBusArrivals, getBusStopByCode } from './services/busService';
import { BusStopArrivalResponse } from './types/bus';

type ActiveTab = 'arrivals' | 'favorites' | 'directory' | 'api';

const AUTO_REFRESH_SECONDS = 30;
const DEFAULT_STOP_CODE = '09047';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('arrivals');
  const [selectedStopCode, setSelectedStopCode] = useState<string>(DEFAULT_STOP_CODE);
  const [arrivalData, setArrivalData] = useState<BusStopArrivalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [secondsToRefresh, setSecondsToRefresh] = useState<number>(AUTO_REFRESH_SECONDS);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    updateAlias,
  } = useFavorites();

  const loadStopArrivals = useCallback(
    async (code: string, backgroundRefresh = false) => {
      if (backgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await fetchBusArrivals(code);
        setArrivalData(response);
        setNowMs(Date.now());
        setSecondsToRefresh(AUTO_REFRESH_SECONDS);
      } catch (err) {
        setArrivalData(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to retrieve bus arrivals.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadStopArrivals(selectedStopCode, false);
  }, [selectedStopCode, loadStopArrivals]);

  // Real-time 1-second clock tick + 30-second auto-refresh countdown
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
      setSecondsToRefresh((prev) => {
        if (prev <= 1) {
          loadStopArrivals(selectedStopCode, true);
          return AUTO_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [selectedStopCode, loadStopArrivals]);

  const handleSelectStop = useCallback((code: string) => {
    setSelectedStopCode(code);
    setActiveTab('arrivals');
  }, []);

  const handleToggleFavoriteByCode = useCallback(
    (code: string) => {
      const stop = getBusStopByCode(code);
      if (stop) {
        toggleFavorite(stop);
      }
    },
    [toggleFavorite]
  );

  const handleFocusSearch = () => {
    setActiveTab('arrivals');
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  };

  const activeStopInfo = getBusStopByCode(selectedStopCode);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] text-slate-900">
      {/* Top Bar (3-zone contract) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('arrivals')}
            className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:underline"
          >
            BusWatch SG
          </button>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {(
              [
                { id: 'arrivals', label: 'Arrivals' },
                { id: 'favorites', label: 'Favorites' },
                { id: 'directory', label: 'Directory' },
                { id: 'api', label: 'API Setup' },
              ] as const
            ).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleFocusSearch}
              className="min-h-[40px] px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Find Stop</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-row Nav (only < md) */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-100 px-4 flex items-center justify-between gap-2 overflow-x-auto"
        >
          {(
            [
              { id: 'arrivals', label: 'Arrivals' },
              { id: 'favorites', label: 'Favorites' },
              { id: 'directory', label: 'Directory' },
              { id: 'api', label: 'API Setup' },
            ] as const
          ).map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[40px] px-2 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'arrivals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: Quick Code Search + Favorites */}
            <aside className="lg:col-span-4 space-y-6">
              <StopSearchBar
                activeStopCode={selectedStopCode}
                onSelectStop={handleSelectStop}
                inputRef={searchInputRef}
              />

              <FavoritesPanel
                favorites={favorites}
                activeStopCode={selectedStopCode}
                onSelectStop={handleSelectStop}
                onRemoveFavorite={removeFavorite}
                onUpdateAlias={updateAlias}
              />
            </aside>

            {/* Right Main Board: Live Arrival Timings */}
            <div className="lg:col-span-8">
              <ArrivalBoard
                stopInfo={activeStopInfo}
                requestedStopCode={selectedStopCode}
                arrivalData={arrivalData}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                error={error}
                nowMs={nowMs}
                secondsToRefresh={secondsToRefresh}
                isFavorite={isFavorite(selectedStopCode)}
                onToggleFavorite={() => handleToggleFavoriteByCode(selectedStopCode)}
                onRefresh={() => loadStopArrivals(selectedStopCode, true)}
                onSelectStop={handleSelectStop}
              />
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <StopSearchBar
                activeStopCode={selectedStopCode}
                onSelectStop={handleSelectStop}
                inputRef={searchInputRef}
              />
            </div>
            <div className="lg:col-span-7">
              <FavoritesPanel
                favorites={favorites}
                activeStopCode={selectedStopCode}
                onSelectStop={handleSelectStop}
                onRemoveFavorite={removeFavorite}
                onUpdateAlias={updateAlias}
              />
            </div>
          </div>
        )}

        {activeTab === 'directory' && (
          <DirectoryView
            activeStopCode={selectedStopCode}
            isFavorite={isFavorite}
            onToggleFavoriteByCode={handleToggleFavoriteByCode}
            onSelectStop={handleSelectStop}
          />
        )}

        {activeTab === 'api' && (
          <ApiIntegrationView onBackToArrivals={() => setActiveTab('arrivals')} />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>BusWatch SG · Singapore Bus Arrival Tracker</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Stop Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('api')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              LTA API Integration
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
