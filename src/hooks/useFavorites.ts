import { useCallback, useEffect, useState } from 'react';
import { BusStopInfo, FavoriteStop } from '../types/bus';

const STORAGE_KEY = 'buswatch_sg_favorites_v1';
const INIT_FLAG_KEY = 'buswatch_sg_favorites_initialized_v1';

const DEFAULT_FAVORITES: FavoriteStop[] = [
  {
    BusStopCode: '09047',
    Description: 'Orchard Stn / Tang Plaza',
    RoadName: 'Orchard Rd',
    District: 'Orchard',
    alias: 'Orchard Commute',
    pinnedAt: 1700000001000,
  },
  {
    BusStopCode: '01012',
    Description: 'Hotel Grand Pacific',
    RoadName: 'Victoria St',
    District: 'Bugis / Bras Basah',
    pinnedAt: 1700000002000,
  },
  {
    BusStopCode: '75009',
    Description: 'Tampines Int',
    RoadName: 'Tampines Ctrl 1',
    District: 'Tampines',
    pinnedAt: 1700000003000,
  },
];

function readInitialFavorites(): FavoriteStop[] {
  try {
    const initialized = localStorage.getItem(INIT_FLAG_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    if (!initialized) {
      localStorage.setItem(INIT_FLAG_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FAVORITES));
      return DEFAULT_FAVORITES;
    }
  } catch {
    // Fallback if storage is unavailable
  }
  return [];
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStop[]>(readInitialFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(INIT_FLAG_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota errors
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (busStopCode: string) =>
      favorites.some((item) => item.BusStopCode === busStopCode),
    [favorites]
  );

  const toggleFavorite = useCallback((stop: BusStopInfo) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.BusStopCode === stop.BusStopCode);
      if (exists) {
        return prev.filter((item) => item.BusStopCode !== stop.BusStopCode);
      }
      const nextItem: FavoriteStop = {
        BusStopCode: stop.BusStopCode,
        Description: stop.Description,
        RoadName: stop.RoadName,
        District: stop.District,
        pinnedAt: Date.now(),
      };
      return [nextItem, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((busStopCode: string) => {
    setFavorites((prev) =>
      prev.filter((item) => item.BusStopCode !== busStopCode)
    );
  }, []);

  const updateAlias = useCallback((busStopCode: string, alias: string) => {
    const trimmed = alias.trim();
    setFavorites((prev) =>
      prev.map((item) =>
        item.BusStopCode === busStopCode
          ? { ...item, alias: trimmed || undefined }
          : item
      )
    );
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    updateAlias,
  };
}
