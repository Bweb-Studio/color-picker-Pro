
import React from 'react';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { getColorName } from '../utils/colorNaming';

const HistoryList = ({ history, onSelect, onTogglePin, onDelete, gradientSelection = [], onToggleGradientSelect, onEditColor }) => {
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
                const isObj = typeof item === 'object';
                const hex = isObj ? item.hex : item;
                const isPinned = isObj && item.pinned;
                const isGradient = isObj && item.isGradient;
                
                const gradIndex = gradientSelection.indexOf(hex);
                const isSelectedForGradient = gradIndex !== -1;

                return (
                    <div
                        key={`${hex}-${index}`}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-all flex-shrink-0 border ${isSelectedForGradient ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 shadow-sm' : isPinned ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30' : 'border-transparent hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                        onClick={() => onSelect(hex)}
                    >
                        {/* Checkbox for Gradient (Only for solid colors) */}
                        {!isGradient && (
                            <div 
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${isSelectedForGradient ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
                                onClick={(e) => { e.stopPropagation(); onToggleGradientSelect(hex); }}
                            >
                                {isSelectedForGradient && <span className="text-[10px] font-bold">{gradIndex + 1}</span>}
                            </div>
                        )}

                        <div className="flex flex-1 items-center gap-3 overflow-hidden">
                            <div
                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0"
                                style={{ background: hex }}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className={`text-xs font-mono font-medium truncate ${isSelectedForGradient ? 'text-blue-700 dark:text-blue-400' : isPinned ? 'text-yellow-700 dark:text-yellow-500' : 'text-gray-900 dark:text-white'}`}>
                                    {isGradient ? 'DÉGRADÉ' : hex.toUpperCase()}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate capitalize leading-tight">
                                        {isGradient ? `${item.colors.length} couleurs` : getColorName(hex)}
                                    </span>
                                    {isObj && item.sourceImage && (
                                        <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 truncate mt-0.5" title={item.sourceImage}>
                                            {item.sourceImage}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Edit Button (Only for solid colors) */}
                            {!isGradient && onEditColor && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditColor(hex);
                                    }}
                                    className="p-1 rounded-full text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-colors"
                                    title="Modifier la couleur"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            )}

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
