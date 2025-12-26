
import React from 'react';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline, TrashIcon } from '@heroicons/react/24/outline';
import { getColorName } from '../utils/colorNaming';

const HistoryList = ({ history, onSelect, onTogglePin, onDelete }) => {
    if (history.length === 0) {
        return (
            <div className="text-gray-400 text-xs text-center py-4 flex-1 flex items-center justify-center">
                Aucune couleur récente
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-2 flex-1 h-full overflow-y-auto scrollbar-hide">
            {history.map((item, index) => {
                const hex = typeof item === 'string' ? item : item.hex;
                const isPinned = typeof item === 'object' && item.pinned;

                return (
                    <div
                        key={`${hex}-${index}`}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group transition-all flex-shrink-0 ${isPinned ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                        onClick={() => onSelect(hex)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div
                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: hex }}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className={`text-xs font-mono font-medium truncate ${isPinned ? 'text-yellow-700 dark:text-yellow-500' : 'text-gray-900 dark:text-white'}`}>
                                    {hex.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate capitalize">{getColorName(hex)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Pin Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePin(hex);
                                }}
                                className={`p-1 rounded-full transition-colors ${isPinned ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100'}`}
                            >
                                {isPinned ? <StarIconSolid className="w-4 h-4" /> : <StarIconOutline className="w-4 h-4" />}
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(hex);
                                }}
                                className="p-1 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors"
                                title="Supprimer"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HistoryList;
