import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from '../utils/colorUtils';

const ColorMixer = ({ initialHex, onReplace, onSaveNew, onClose }) => {
    // We will operate primarily in HSL for sliders, but sync with RGB
    const [h, setH] = useState(0);
    const [s, setS] = useState(0);
    const [l, setL] = useState(0);

    useEffect(() => {
        const rgb = hexToRgb(initialHex);
        if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            setH(hsl.h);
            setS(hsl.s);
            setL(hsl.l);
        }
    }, [initialHex]);

    const handleHslChange = (newH, newS, newL) => {
        setH(newH);
        setS(newS);
        setL(newL);
    };

    const currentRgb = hslToRgb(h, s, l);
    const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Mixeur de Couleurs
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview */}
                <div className="p-4 flex gap-4 items-center border-b border-gray-100 dark:border-neutral-700">
                    <div className="w-16 h-16 rounded-lg shadow-inner border border-gray-200 dark:border-neutral-600 flex-shrink-0" style={{ backgroundColor: currentHex }} />
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-lg font-mono font-black text-gray-900 dark:text-white truncate">{currentHex.toUpperCase()}</span>
                        <span className="text-xs text-gray-500 font-mono truncate">RGB: {currentRgb.r}, {currentRgb.g}, {currentRgb.b}</span>
                    </div>
                </div>

                {/* Sliders */}
                <div className="p-4 space-y-4">
                    {/* Hue */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                            <span>Teinte (Hue)</span>
                            <span>{h}°</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="360"
                            value={h}
                            onChange={(e) => handleHslChange(Number(e.target.value), s, l)}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                        />
                    </div>

                    {/* Saturation */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                            <span>Saturation</span>
                            <span>{s}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="100"
                            value={s}
                            onChange={(e) => handleHslChange(h, Number(e.target.value), l)}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{ background: `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))` }}
                        />
                    </div>

                    {/* Lightness */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                            <span>Luminosité</span>
                            <span>{l}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="100"
                            value={l}
                            onChange={(e) => handleHslChange(h, s, Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{ background: `linear-gradient(to right, #000000, hsl(${h}, ${s}%, 50%), #ffffff)` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 dark:bg-neutral-900/50 flex gap-2">
                    <button
                        onClick={() => onReplace(currentHex)}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm transition-colors"
                    >
                        Remplacer
                    </button>
                    <button
                        onClick={() => onSaveNew(currentHex)}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition-colors"
                    >
                        Créer Nouvelle
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColorMixer;
