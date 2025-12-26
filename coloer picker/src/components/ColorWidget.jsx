
import React, { useState, useEffect, useRef } from 'react';
import { EyeDropperIcon, MoonIcon, SunIcon, XMarkIcon, MinusIcon, ClipboardDocumentIcon, StopIcon, ArrowPathIcon, ArrowDownTrayIcon, FolderIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { hexToRgb, rgbToHsl, rgbToCmyk, generateHarmonies, getContrastColor } from '../utils/colorUtils';
import { getColorName } from '../utils/colorNaming';
import HistoryList from './HistoryList';

const ColorWidget = ({ onMinimize }) => {
    const [color, setColor] = useState('#ffffff');
    // History is now Array<{ hex: string, pinned: boolean }>
    const [history, setHistory] = useState([]);
    const [isDark, setIsDark] = useState(false);
    const [copied, setCopied] = useState(null);
    const [isPicking, setIsPicking] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [savedPalettes, setSavedPalettes] = useState([]);
    const [showSavesMenu, setShowSavesMenu] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);

    useEffect(() => {
        const savedHistory = localStorage.getItem('color-picker-history');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                // Migration: If array of strings, convert to objects
                if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
                    setHistory(parsed.map(hex => ({ hex, pinned: false })));
                } else {
                    setHistory(parsed || []);
                }
            } catch (e) {
                setHistory([]);
            }
        }
    }, []);

    useEffect(() => localStorage.setItem('color-picker-history', JSON.stringify(history)), [history]);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (isPicking) {
                    stopPicking(); // Space stops if running
                } else {
                    startPicking(); // Space starts if stopped
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPicking]);

    useEffect(() => {
        if (!window.electronAPI) return;
        const removeHover = window.electronAPI.onColorHover((hex) => { if (isPicking) setColor(hex); });
        const removeSelected = window.electronAPI.onColorSelected((hex) => {
            setColor(hex);
            setHistory(prev => {
                if (prev.length > 0 && prev[0].hex === hex) return prev;
                const newItem = { hex, pinned: false };
                const pinnedItems = prev.filter(i => i.pinned);
                const unpinnedItems = prev.filter(i => !i.pinned);
                const filteredUnpinned = unpinnedItems.filter(i => i.hex !== hex);
                return [...pinnedItems, newItem, ...filteredUnpinned].slice(0, 50);
            });
        });
        const removeStopUI = window.electronAPI.onStopPickingUI(() => { setIsPicking(false); });
        return () => { };
    }, [isPicking]);

    const togglePicking = async (e) => {
        if (e) e.target.blur();
        if (isPicking) { await stopPicking(); } else { await startPicking(); }
    };
    const startPicking = async () => { setIsPicking(true); if (window.electronAPI) await window.electronAPI.startPicking(); };
    const stopPicking = async () => { setIsPicking(false); if (window.electronAPI) await window.electronAPI.stopPicking(); };

    const handleMinimizeApp = async () => {
        if (isPicking) await stopPicking();
        onMinimize();
    };
    const handleCloseApp = async () => { if (window.electronAPI) window.electronAPI.close(); };

    const clearHistory = () => {
        setShowResetModal(true);
    };

    const confirmClearHistory = () => {
        setHistory(prev => prev.filter(i => i.pinned));
        setShowResetModal(false);
    };

    const togglePin = (targetHex) => {
        setHistory(prev => {
            return prev.map(item => {
                if (item.hex === targetHex) {
                    return { ...item, pinned: !item.pinned };
                }
                return item;
            }).sort((a, b) => {
                if (a.pinned === b.pinned) return 0;
                return a.pinned ? -1 : 1;
            });
        });
    };

    const deleteColor = (targetHex) => {
        setHistory(prev => prev.filter(item => item.hex !== targetHex));
    };

    // Save/Load Palettes
    useEffect(() => {
        const saved = localStorage.getItem('color-picker-palettes');
        if (saved) {
            try {
                setSavedPalettes(JSON.parse(saved) || []);
            } catch (e) {
                setSavedPalettes([]);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('color-picker-palettes', JSON.stringify(savedPalettes));
    }, [savedPalettes]);

    const savePalette = () => {
        setShowSaveModal(true);
        setSaveName('');
    };

    const confirmSavePalette = () => {
        if (saveName.trim()) {
            const newPalette = {
                id: Date.now(),
                name: saveName.trim(),
                colors: history
            };
            setSavedPalettes(prev => [...prev, newPalette]);
            setShowSaveModal(false);
            setSaveName('');
        }
    };

    const loadPalette = (palette) => {
        setHistory(palette.colors);
        setShowSavesMenu(false);
    };

    const deletePalette = (paletteId) => {
        setSavedPalettes(prev => prev.filter(p => p.id !== paletteId));
    };

    const handleExport = (format) => {
        const timestamp = new Date().toISOString().slice(0, 10);
        let content = '';
        let mimeType = 'text/plain';
        let extension = 'txt';
        const items = history;

        if (format === 'css') {
            content = `:root {\n` +
                items.map((item, i) => `  --color-${getColorName(item.hex).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${i + 1}: ${item.hex}; /* ${getColorName(item.hex)} */`).join('\n') +
                `\n}`;
            mimeType = 'text/css';
            extension = 'css';
        } else if (format === 'json') {
            content = JSON.stringify(items.map(i => ({ hex: i.hex, name: getColorName(i.hex) })), null, 2);
            mimeType = 'application/json';
            extension = 'json';
        } else if (format === 'tailwind') {
            content = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n` +
                items.map(i => `        '${getColorName(i.hex).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}': '${i.hex}',`).join('\n') +
                `\n      }\n    }\n  }\n}`;
            mimeType = 'text/javascript';
            extension = 'js';
        } else if (format === 'txt') {
            content = items.map(i => `${getColorName(i.hex)}: ${i.hex}`).join('\n');
            mimeType = 'text/plain';
            extension = 'txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `palette-${timestamp}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 1500);
    };

    const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const colorName = getColorName(color);
    const harmonies = generateHarmonies(color);
    const textColor = getContrastColor(color); // 'black' or 'white'

    const ColorCard = ({ label, value }) => (
        <div
            onClick={() => copyToClipboard(value, label)}
            className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all group active:scale-95 h-14"
        >
            <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
                <span className="text-xs font-mono text-gray-900 dark:text-white font-semibold truncate" title={value}>{value}</span>
            </div>
            {copied === label ? <span className="text-[10px] text-green-500 font-bold">✓</span> : <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 min-w-[16px]" />}
        </div>
    );

    return (
        <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border-2 border-gray-300 dark:border-neutral-700 overflow-hidden flex flex-col font-sans transition-colors duration-300 relative">

            {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>}
            {showSavesMenu && <div className="fixed inset-0 z-40" onClick={() => setShowSavesMenu(false)}></div>}

            {/* Save Palette Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-4 w-64 border border-gray-200 dark:border-neutral-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Sauvegarder la palette</h3>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Nom de la palette..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmSavePalette()}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmSavePalette}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-4 w-64 border border-gray-200 dark:border-neutral-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Effacer l'historique</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Les couleurs épinglées seront conservées.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmClearHistory}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                Effacer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ WebkitAppRegion: 'drag' }} className="h-10 bg-gray-100 dark:bg-neutral-800 flex items-center justify-between px-3 border-b border-gray-200 dark:border-neutral-700 select-none flex-shrink-0">
                <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
                    <img src="./icon.png" alt="App Icon" className="w-5 h-5 rounded-full shadow-sm" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white ml-1">Color Picker Pro</span>
                </div>
                <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
                    <button onClick={() => setIsDark(!isDark)} className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-900 dark:text-white transition-colors">
                        {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    </button>
                    <button onClick={handleMinimizeApp} className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-900 dark:text-white transition-colors">
                        <MinusIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleCloseApp} className="p-1 hover:bg-red-100 hover:text-red-500 dark:hover:bg-neutral-700 rounded text-gray-900 dark:text-white transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Color Display (HARMONY SPLIT) */}
            <div className="h-32 w-full flex flex-shrink-0 border-b border-gray-200 dark:border-neutral-700">

                {/* LEFT: Main Color (65%) */}
                <div
                    className="w-[65%] h-full relative flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer group"
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color.toUpperCase(), 'main')}
                    title="Cliquez pour copier"
                >
                    {/* Pipette Button */}
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={togglePicking}
                            className={`p-2 rounded-lg shadow-lg backdrop-blur-md border border-white/20 transition-all active:scale-95 ${isPicking ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 hover:bg-white/30 text-current'}`}
                            title={isPicking ? "Arrêter (Espace)" : "Capturer (Espace)"}
                            style={{ color: textColor }} // Pipette icon adapts
                        >
                            {isPicking ? <StopIcon className="w-5 h-5" /> : <EyeDropperIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Hex & Name with RAW CONTRAST */}
                    <div className="flex flex-col items-center gap-1 z-10 pointer-events-none">
                        {/* No backdrop, just raw text with contrast check */}
                        <div
                            className="font-mono text-2xl font-black select-all tracking-wider drop-shadow-sm"
                            style={{ color: textColor }}
                        >
                            {copied === 'main' ? '✓ Copié!' : color.toUpperCase()}
                        </div>
                        <div
                            className="text-sm font-bold opacity-90 drop-shadow-sm"
                            style={{ color: textColor }}
                        >
                            {colorName}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Harmony Stack (35%) */}
                <div className="w-[35%] h-full flex flex-col border-l border-white/10">
                    {harmonies.map((hColor, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                setColor(hColor);
                                setHistory(prev => {
                                    if (prev.find(p => p.hex === hColor)) return prev;
                                    return [...prev.filter(p => p.pinned), { hex: hColor, pinned: false }, ...prev.filter(p => !p.pinned)].slice(0, 50);
                                });
                            }}
                            className="flex-1 w-full cursor-pointer hover:brightness-110 transition-all relative group"
                            style={{ backgroundColor: hColor }}
                            title={`Harmonie: ${hColor}`}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-black/30 backdrop-blur-sm rounded px-1 py-0.5 text-[9px] text-white font-mono shadow-md">
                                    {i === 0 ? 'COMP' : 'SPLIT'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Color Codes Grid */}
            <div className="p-3 space-y-2 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
                <div className="grid grid-cols-2 gap-2">
                    <ColorCard label="HEX" value={color.toUpperCase()} />
                    <ColorCard label="RGB" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} />
                    <ColorCard label="HSL" value={`${hsl.h}°, ${hsl.s}%, ${hsl.l}%`} />
                    <ColorCard label="CMYK" value={`${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`} />
                </div>
            </div>

            {/* History */}
            <div className="flex-1 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col min-h-0 relative">
                <div className="px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-neutral-800 border-b border-gray-100 dark:border-neutral-700 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Couleurs Récentes</span>
                    <div className="flex items-center gap-1 relative">

                        {/* Save Palette Button */}
                        {history.length > 0 && (
                            <button
                                onClick={savePalette}
                                className="p-1.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-full text-gray-500 dark:text-gray-300 hover:text-green-500 hover:border-green-200 transition-colors shadow-sm"
                                title="Sauvegarder la palette"
                            >
                                <BookmarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Load Palettes Button */}
                        <button
                            onClick={() => setShowSavesMenu(!showSavesMenu)}
                            className={`p-1.5 border rounded-full transition-colors shadow-sm ${showSavesMenu ? 'bg-purple-100 text-purple-600 border-purple-300' : 'bg-white dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-500 dark:text-gray-300 hover:text-purple-500 hover:border-purple-200'}`}
                            title="Palettes sauvegardées"
                        >
                            <FolderIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Palettes Menu Dropdown */}
                        {showSavesMenu && (
                            <div className="absolute top-8 right-0 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 py-1 w-48 flex flex-col animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                                {savedPalettes.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-gray-400 text-center">Aucune palette sauvegardée</div>
                                ) : (
                                    savedPalettes.map(palette => (
                                        <div key={palette.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 group">
                                            <button
                                                onClick={() => loadPalette(palette)}
                                                className="flex-1 text-left text-xs text-gray-900 dark:text-white truncate"
                                            >
                                                📁 {palette.name}
                                                <span className="text-gray-400 ml-1">({palette.colors.length})</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deletePalette(palette.id); }}
                                                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Export Button */}
                        {history.length > 0 && (
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className={`p-1.5 border rounded-full transition-colors shadow-sm ${showExportMenu ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-white dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-500 dark:text-gray-300 hover:text-blue-500 hover:border-blue-200'}`}
                                title="Exporter la palette"
                            >
                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Export Menu Dropdown */}
                        {showExportMenu && (
                            <div className="absolute top-8 right-8 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 py-1 w-32 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={() => handleExport('css')} className="px-3 py-2 text-left text-xs text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    CSS (.css)
                                </button>
                                <button onClick={() => handleExport('json')} className="px-3 py-2 text-left text-xs text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    JSON (.json)
                                </button>
                                <button onClick={() => handleExport('tailwind')} className="px-3 py-2 text-left text-xs text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    Tailwind (.js)
                                </button>
                                <button onClick={() => handleExport('txt')} className="px-3 py-2 text-left text-xs text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    Texte (.txt)
                                </button>
                            </div>
                        )}

                        {/* Clear Button */}
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="p-1.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-full text-gray-500 dark:text-gray-300 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
                                title="Effacer (sauf épinglés)"
                            >
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                <HistoryList history={history} onSelect={setColor} onTogglePin={togglePin} onDelete={deleteColor} />
            </div>
        </div>
    );
};

export default ColorWidget;
