import React, { useState } from 'react';
import { Bookmark, Check, Pencil, Trash2, X } from 'lucide-react';
import { FavoriteStop } from '../types/bus';

interface FavoritesPanelProps {
  favorites: FavoriteStop[];
  activeStopCode: string;
  onSelectStop: (busStopCode: string) => void;
  onRemoveFavorite: (busStopCode: string) => void;
  onUpdateAlias: (busStopCode: string, alias: string) => void;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  favorites,
  activeStopCode,
  onSelectStop,
  onRemoveFavorite,
  onUpdateAlias,
}) => {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draftAlias, setDraftAlias] = useState('');

  const startEditing = (fav: FavoriteStop, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCode(fav.BusStopCode);
    setDraftAlias(fav.alias ?? '');
  };

  const saveEdit = (code: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateAlias(code, draftAlias);
    setEditingCode(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCode(null);
  };

  return (
    <section
      aria-label="Favorite bus stops"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Favorite Stops
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {favorites.length === 0
              ? 'No stops saved yet'
              : `${favorites.length} saved ${favorites.length === 1 ? 'stop' : 'stops'}`}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-800">
            No favorite bus stops pinned
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-[24ch] mx-auto">
            Click Save Stop on any arrival board for instant one-click access.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {favorites.map((fav) => {
            const isActive = fav.BusStopCode === activeStopCode;
            const isEditing = editingCode === fav.BusStopCode;

            return (
              <li key={fav.BusStopCode}>
                {isEditing ? (
                  <form
                    onSubmit={(e) => saveEdit(fav.BusStopCode, e)}
                    className="px-5 py-3.5 bg-slate-50 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={draftAlias}
                      onChange={(e) => setDraftAlias(e.target.value)}
                      placeholder={fav.Description}
                      maxLength={32}
                      autoFocus
                      aria-label={`Nickname for stop ${fav.BusStopCode}`}
                      className="flex-1 min-w-0 min-h-[40px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="submit"
                      aria-label="Save nickname"
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      aria-label="Cancel nickname edit"
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div
                    className={`group flex items-center justify-between gap-2 px-5 py-3 transition-colors ${
                      isActive ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectStop(fav.BusStopCode)}
                      className="flex-1 min-w-0 text-left min-h-[44px] py-1 cursor-pointer focus:outline-none focus-visible:underline"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums ${
                            isActive ? 'text-slate-900' : 'text-slate-600'
                          }`}
                        >
                          {fav.BusStopCode}
                        </span>
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {fav.alias || fav.Description}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {fav.alias ? `${fav.Description} · ` : ''}
                        {fav.RoadName} · {fav.District}
                      </div>
                    </button>

                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => startEditing(fav, e)}
                        aria-label={`Rename ${fav.Description}`}
                        title="Rename favorite"
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFavorite(fav.BusStopCode);
                        }}
                        aria-label={`Remove ${fav.Description} from favorites`}
                        title="Remove favorite"
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
