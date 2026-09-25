
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeDropperIcon, MoonIcon, SunIcon, XMarkIcon, MinusIcon, ClipboardDocumentIcon, StopIcon, ArrowPathIcon, ArrowDownTrayIcon, FolderIcon, BookmarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { hexToRgb, rgbToHsl, rgbToCmyk, generateHarmonies, getContrastColor } from '../utils/colorUtils';
import { getColorName } from '../utils/colorNaming';
import HistoryList from './HistoryList';
import ColorMixer from './ColorMixer';

const ColorWidget = ({ onMinimize }) => {
    const { t, i18n } = useTranslation();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [color, setColor] = useState('#ffffff');
    // History is now Array<{ hex: string, pinned: boolean }>
    const [history, setHistory] = useState([]);
    
    useEffect(() => {
        const lastSeen = localStorage.getItem('lastSeenVersion');
        if (lastSeen !== __APP_VERSION__) {
            setShowUpdateModal(true);
            localStorage.setItem('lastSeenVersion', __APP_VERSION__);
        }
    }, []);
    const [isDark, setIsDark] = useState(() => localStorage.getItem("color-picker-dark") === "true");
    const [copied, setCopied] = useState(null);
    const [isPicking, setIsPicking] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [savedPalettes, setSavedPalettes] = useState([]);
    const [showSavesMenu, setShowSavesMenu] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [showSelectionMenu, setShowSelectionMenu] = useState(false);

    // NEW FEATURES STATE
    const [gradientSelection, setGradientSelection] = useState([]);
    const [editingColor, setEditingColor] = useState(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);

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
                const hexValue = typeof prev[0] === 'object' ? prev[0].hex : prev[0];
                if (prev.length > 0 && hexValue === hex) return prev;
                const newItem = { hex, pinned: false };
                const pinnedItems = prev.filter(i => i.pinned);
                const unpinnedItems = prev.filter(i => !i.pinned);
                const filteredUnpinned = unpinnedItems.filter(i => (typeof i === 'object' ? i.hex !== hex : i !== hex));
                return [...pinnedItems, newItem, ...filteredUnpinned].slice(0, 50);
            });
        });
        const removeStartUI = window.electronAPI.onStartPickingUI ? window.electronAPI.onStartPickingUI(() => { setIsPicking(true); }) : () => {};
        const removeStopUI = window.electronAPI.onStopPickingUI(() => { setIsPicking(false); });
        return () => { if(removeHover) removeHover(); if(removeSelected) removeSelected(); if(removeStartUI) removeStartUI(); if(removeStopUI) removeStopUI(); };
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
                const itemHex = typeof item === 'object' ? item.hex : item;
                if (itemHex === targetHex) {
                    return typeof item === 'object' ? { ...item, pinned: !item.pinned } : { hex: item, pinned: true };
                }
                return item;
            }).sort((a, b) => {
                const aPinned = typeof a === 'object' ? a.pinned : false;
                const bPinned = typeof b === 'object' ? b.pinned : false;
                if (aPinned === bPinned) return 0;
                return aPinned ? -1 : 1;
            });
        });
    };

    const deleteColor = (targetHex) => {
        setHistory(prev => prev.filter(item => {
            const h = typeof item === 'object' ? item.hex : item;
            return h !== targetHex;
        }));
        setGradientSelection(prev => prev.filter(h => h !== targetHex));
    };

    // GRADIENT LOGIC
    const toggleGradientSelect = (hex) => {
        setGradientSelection(prev => {
            if (prev.includes(hex)) return prev.filter(h => h !== hex);
            if (prev.length < 4) return [...prev, hex];
            return prev;
        });
    };

    const createGradient = () => {
        if (gradientSelection.length < 2) return;
        const gradientHex = `linear-gradient(90deg, ${gradientSelection.join(', ')})`;
        const newGradient = {
            isGradient: true,
            colors: gradientSelection,
            hex: gradientHex,
            pinned: true
        };
        setHistory(prev => [newGradient, ...prev].slice(0, 50));
        setGradientSelection([]);
    };

    // MIXER LOGIC
    const handleReplaceColor = (newHex) => {
        setHistory(prev => prev.map(item => {
            const h = typeof item === 'object' ? item.hex : item;
            if (h === editingColor) {
                return typeof item === 'object' ? { ...item, hex: newHex } : newHex;
            }
            return item;
        }));
        setColor(newHex);
        setEditingColor(null);
    };

    const handleSaveNewColor = (newHex) => {
        setHistory(prev => [{ hex: newHex, pinned: false }, ...prev].slice(0, 50));
        setColor(newHex);
        setEditingColor(null);
    };

    // IMAGE EXTRACTION
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingImage(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDraggingImage(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingImage(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const colors = [];
                    for(let i=1; i<=5; i++) {
                        const x = Math.floor(canvas.width * (i/6));
                        const y = Math.floor(canvas.height * (i/6));
                        const pixel = ctx.getImageData(x, y, 1, 1).data;
                        const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
                        colors.push({ hex, pinned: false, sourceImage: file.name });
                    }
                    
                    const newPalette = { id: Date.now(), name: file.name, colors: colors };
                    setSavedPalettes(prev => [...prev, newPalette]);
                    setHistory(prev => [...colors, ...prev].slice(0, 50));
                    setColor(colors[0].hex);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
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

    const isGradientColor = color.includes('gradient');
    const rgb = !isGradientColor ? (hexToRgb(color) || { r: 0, g: 0, b: 0 }) : { r: 0, g: 0, b: 0 };
    const hsl = !isGradientColor ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };
    const cmyk = !isGradientColor ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 0 };
    const colorName = !isGradientColor ? getColorName(color) : 'Dégradé CSS';
    const textColor = !isGradientColor ? getContrastColor(color) : 'white'; // Default white for gradient text

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

            {editingColor && (
                <ColorMixer
                    initialHex={editingColor}
                    onReplace={handleReplaceColor}
                    onSaveNew={handleSaveNewColor}
                    onClose={() => setEditingColor(null)}
                />
            )}

            {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>}
            {showSavesMenu && <div className="fixed inset-0 z-40" onClick={() => setShowSavesMenu(false)}></div>}

            {/* Save Palette Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-4 w-64 border border-gray-200 dark:border-neutral-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{t('savePalette', 'Sauvegarder la palette')}</h3>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder={t('paletteName', 'Nom de la palette...')}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmSavePalette()}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                            >
                                {t('cancel', 'Annuler')}
                            </button>
                            <button
                                onClick={confirmSavePalette}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                                {t('save', 'Sauvegarder')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-4 w-64 border border-gray-200 dark:border-neutral-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{t('clearHistory', "Effacer l'historique")}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('pinnedColorsKept', 'Les couleurs épinglées seront conservées.')}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                            >
                                {t('cancel', 'Annuler')}
                            </button>
                            <button
                                onClick={confirmClearHistory}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                {t('clear', 'Effacer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Notes Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-5 w-72 border border-gray-200 dark:border-neutral-700 animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('updateTitle', 'Mise à jour')} {__APP_VERSION__}</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                            <p>{t('updateNote1', 'Quoi de neuf ?')}</p>
                            <ul className="list-disc pl-4 text-xs space-y-1">
                                <li>{t('updateNote2', 'Ajout du choix de la langue (Français, Anglais, Espagnol, Allemand).')}</li>
                                <li>{t('updateNote3', "Nouvelle icône de l'application.")}</li>
                                <li>{t('updateNote4', 'Améliorations générales de performance.')}</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => setShowUpdateModal(false)}
                            className="w-full px-4 py-2 text-sm font-bold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            {t('updateOk', 'Génial !')}
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ WebkitAppRegion: 'drag' }} className="h-10 bg-gray-100 dark:bg-neutral-800 flex items-center justify-between px-3 border-b border-gray-200 dark:border-neutral-700 select-none flex-shrink-0">
                <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
                    <img src="./icon.png" alt="App Icon" className="w-5 h-5 rounded-full shadow-sm" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white ml-1">Color Picker Pro <span className="text-[10px] text-gray-500 font-normal">v{__APP_VERSION__}</span></span>
                </div>
                <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
                    <div className="relative">
                        <button onClick={() => setShowLangMenu(!showLangMenu)} className="p-1 flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-900 dark:text-white transition-colors uppercase text-[10px] font-bold">
                            <GlobeAltIcon className="w-4 h-4" />
                            {i18n.language ? i18n.language.substring(0, 2) : 'en'}
                        </button>
                        {showLangMenu && (
                            <div className="absolute top-8 right-0 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 py-1 w-24 flex flex-col">
                                {['en', 'fr', 'es', 'de'].map(lng => (
                                    <button 
                                        key={lng} 
                                        onClick={() => { i18n.changeLanguage(lng); setShowLangMenu(false); }} 
                                        className="px-3 py-1 text-left text-xs text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 uppercase font-bold"
                                    >
                                        {lng === 'en' ? '🇺🇸 EN' : lng === 'fr' ? '🇫🇷 FR' : lng === 'es' ? '🇪🇸 ES' : '🇩🇪 DE'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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

            {/* Main Color Display & Image Drop Zone (50/50 SPLIT) */}
            <div className="h-32 w-full flex flex-shrink-0 border-b border-gray-200 dark:border-neutral-700">

                {/* LEFT: Main Color (50%) */}
                <div
                    className="w-[50%] h-full relative flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer group"
                    style={{ [isGradientColor ? 'background' : 'backgroundColor']: (history.length === 0 && !isPicking) ? 'transparent' : color }}
                    onClick={() => { if (history.length > 0) copyToClipboard(color, 'main'); }}
                    title={history.length === 0 ? "" : "Cliquez pour copier"}
                >
                    {isGradientColor && extractedColors.length > 0 && (
                        <div className="absolute bottom-1 w-full flex justify-center gap-1 z-20" onClick={(e) => e.stopPropagation()}>
                            {extractedColors.map((c, i) => (
                                <div
                                    key={i}
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', i.toString()); }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                        const toIndex = i;
                                        if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                                            const newColors = [...extractedColors];
                                            const [moved] = newColors.splice(fromIndex, 1);
                                            newColors.splice(toIndex, 0, moved);
                                            const newGradient = `linear-gradient(90deg, ${newColors.join(', ')})`;
                                            setColor(newGradient);
                                            setHistory(prev => prev.map(item => {
                                                const itemHex = typeof item === 'object' ? item.hex : item;
                                                if (itemHex === color) {
                                                    return { ...item, hex: newGradient, colors: newColors };
                                                }
                                                return item;
                                            }));
                                        }
                                    }}
                                    className="w-5 h-5 rounded-full border-2 border-white shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                                    style={{ backgroundColor: c }}
                                    title="Glisser pour réorganiser"
                                />
                            ))}
                        </div>
                    )}
                    {/* Pipette Button */}
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={togglePicking}
                            className={`p-2 rounded-lg shadow-lg backdrop-blur-md border border-white/20 transition-all active:scale-95 ${isPicking ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 hover:bg-white/30 text-current'}`}
                            title={isPicking ? t('stopCapture', 'Arrêter (Espace)') : t('startCapture', 'Capturer (Espace)')}
                            style={{ color: history.length === 0 || isGradientColor ? 'inherit' : textColor }}
                        >
                            {isPicking ? <StopIcon className="w-5 h-5" /> : <EyeDropperIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    {(history.length === 0 && !isPicking) ? (
                        <div className="flex flex-col items-center justify-center pointer-events-none text-gray-400 dark:text-gray-500 mt-6">
                            <span className="text-xs text-center px-4 font-bold">{t('readyToCapture', 'Prêt à capturer')}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 z-10 pointer-events-none px-2 text-center w-full">
                            <div className="font-mono text-xl font-black select-all tracking-wider drop-shadow-sm truncate w-full" style={{ color: isGradientColor ? 'white' : textColor }}>
                                {copied === 'main' ? t('copied', '✓ Copié!') : isGradientColor ? t('gradientCss', 'DÉGRADÉ CSS') : color.toUpperCase()}
                            </div>
                            <div className="text-sm font-bold opacity-90 drop-shadow-sm truncate w-full" style={{ color: isGradientColor ? 'white' : textColor }}>
                                {isGradientColor ? t('copyCode', 'Copier le code') : colorName}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Image Drop Zone (50%) */}
                <div
                    className={`w-[50%] h-full flex flex-col items-center justify-center border-l border-gray-200 dark:border-neutral-700 transition-colors ${isDraggingImage ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className={`w-[90%] h-[80%] flex flex-col items-center justify-center pointer-events-none border-2 border-dashed rounded-lg transition-colors ${isDraggingImage ? 'border-blue-400 text-blue-500' : 'border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                        <span className="text-3xl mb-1">+</span>
                        <span className="text-[10px] text-center px-2 font-bold uppercase tracking-wider">{t('dragImage', 'Glisser une image')}<br/>{t('toExtract', 'pour extraire')}</span>
                    </div>
                </div>

            </div>

            {/* Color Codes Grid */}
            <div className="p-3 space-y-2 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
                <div className="grid grid-cols-2 gap-2">
                    <ColorCard label="HEX" value={hexVal} />
                    <ColorCard label="RGB" value={rgbVal} />
                    <ColorCard label="HSL" value={hslVal} />
                    <ColorCard label="CMYK" value={cmykVal} />
                </div>
            </div>

            {/* History */}
            <div className="flex-1 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col min-h-0 relative">
                <div className="px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-neutral-800 border-b border-gray-100 dark:border-neutral-700 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('recentColors', 'Couleurs Récentes')}</span>
                    <div className="flex items-center gap-1 relative">

                        {/* Save Palette Button */}
                        {history.length > 0 && (
                            <button
                                onClick={savePalette}
                                className="p-1.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-full text-gray-500 dark:text-gray-300 hover:text-green-500 hover:border-green-200 transition-colors shadow-sm"
                                title={t('savePalette', 'Sauvegarder la palette')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V10.5H4.5V3.75h12zm2.25 0l-5.25-5.25H6a2.25 2.25 0 00-2.25 2.25v15A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25V6zM15 16.5v3.75H9V16.5h6z" /></svg>
                            </button>
                        )}

                        {/* 3 dots menu when colors are selected */}
                        {gradientSelection.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowSelectionMenu(!showSelectionMenu)}
                                    className="p-1.5 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                                </button>
                                {showSelectionMenu && (
                                    <div className="absolute top-8 right-0 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 py-1 w-48 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                        <button onClick={() => { handleCreateGradient(); setShowSelectionMenu(false); }} className="px-3 py-2 text-left text-xs text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700">
                                            {t('createGradient', 'Créer un dégradé')}
                                        </button>
                                        <button onClick={handleBulkDelete} className="px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            {t('deleteSelection', 'Supprimer la sélection')}
                                        </button>
                                        <button onClick={() => { setGradientSelection([]); setShowSelectionMenu(false); }} className="px-3 py-2 text-left text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                            {t('cancel', 'Annuler')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Load Palettes Button */}
                        <button
                            onClick={() => setShowSavesMenu(!showSavesMenu)}
                            className={`p-1.5 border rounded-full transition-colors shadow-sm ${showSavesMenu ? 'bg-purple-100 text-purple-600 border-purple-300' : 'bg-white dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-500 dark:text-gray-300 hover:text-purple-500 hover:border-purple-200'}`}
                            title={t('savedPalettes', 'Palettes sauvegardées')}
                        >
                            <FolderIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Palettes Menu Dropdown */}
                        {showSavesMenu && (
                            <div className="absolute top-8 right-0 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 py-1 w-48 flex flex-col animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                                {savedPalettes.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-gray-400 text-center">{t('noSavedPalettes', 'Aucune palette sauvegardée')}</div>
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
                                title={t('exportPalette', 'Exporter la palette')}
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
                                    {t('text', 'Texte')} (.txt)
                                </button>
                            </div>
                        )}

                        {/* Clear Button */}
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="p-1.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-full text-gray-500 dark:text-gray-300 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
                                title={t('clearExceptPinned', 'Effacer (sauf épinglés)')}
                            >
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                <HistoryList 
                    history={history} 
                    onSelect={setColor} 
                    onTogglePin={togglePin} 
                    onDelete={deleteColor} 
                    gradientSelection={gradientSelection}
                    onToggleGradientSelect={toggleGradientSelect}
                    onEditColor={setEditingColor}
                />
            </div>

            {/* Gradient Creator Panel */}
            {gradientSelection.length >= 2 && (
                <div className="p-3 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 flex flex-col gap-2 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-20 transition-all animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('newGradient', 'Nouveau Dégradé')} ({gradientSelection.length}/4)</span>
                        <button onClick={() => setGradientSelection([])} className="text-gray-400 hover:text-red-500 transition-colors"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="h-8 rounded-lg shadow-inner w-full border border-gray-200 dark:border-neutral-700" style={{ background: `linear-gradient(90deg, ${gradientSelection.join(', ')})` }}></div>
                    <button onClick={createGradient} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors mt-1">
                        {t('createGradient', 'Créer le dégradé')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ColorWidget;
