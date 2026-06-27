
import React, { useEffect, useRef, useState } from 'react';

const Overlay = () => {
    const canvasRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [mousePosState, setMousePosState] = useState({ x: -1000, y: -1000 });
    const mousePosRef = useRef({ x: -1000, y: -1000 }); // Ref for keydown access

    useEffect(() => {
        // Init Listener
        if (window.electronAPI) {
            window.electronAPI.onShowOverlay((url) => {
                setImageSrc(null);
                setTimeout(() => setImageSrc(url), 0);
            });
        }
    }, []);

    // Canvas Render
    useEffect(() => {
        if (imageSrc && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            const img = new Image();
            img.onload = () => {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
            };
            img.src = imageSrc;
        }
    }, [imageSrc]);

    const handleMouseMove = (e) => {
        const x = e.clientX;
        const y = e.clientY;
        const pos = { x, y };

        setMousePosState(pos);
        mousePosRef.current = pos; // Update Ref

        // Hover Logic
        if (canvasRef.current && imageSrc && window.electronAPI) {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
            window.electronAPI.sendHoverColor(hex);
        }
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        pickColor(e.clientX, e.clientY);
    };

    const pickColor = (x, y) => {
        if (canvasRef.current && imageSrc && window.electronAPI) {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
            window.electronAPI.colorPicked(hex);
        }
    };

    // Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.code === 'Escape') {
                e.preventDefault();
                // Escape = Stop (Cancel)
                if (window.electronAPI) window.electronAPI.stopPicking();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // No depsi

    if (!imageSrc) return <div className="fixed inset-0 bg-transparent" />;

    return (
        <div
            className="fixed inset-0 overflow-hidden"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                cursor: 'crosshair'
            }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
        >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-0" />

            {/* Loupe */}
            <div
                className="absolute w-32 h-32 rounded-full border-2 border-white shadow-xl overflow-hidden pointer-events-none z-50"
                style={{
                    left: mousePosState.x,
                    top: mousePosState.y,
                    transform: 'translate(-50%, -50%)',
                    backgroundImage: `url(${imageSrc})`,
                    backgroundPosition: `-${mousePosState.x * 3 - 64}px -${mousePosState.y * 3 - 64}px`,
                    backgroundSize: `${window.innerWidth * 3}px ${window.innerHeight * 3}px`,
                    display: mousePosState.x < 0 ? 'none' : 'block'
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
                </div>
            </div>
        </div>
    );
};

export default Overlay;
