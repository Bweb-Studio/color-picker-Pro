
import React, { useState, useEffect, useRef } from 'react';
import ColorWidget from './components/ColorWidget';
import Overlay from './components/Overlay';

function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [isOverlay, setIsOverlay] = useState(false);

  // Drag State
  const isDragging = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#/overlay') {
        setIsOverlay(true);
      } else {
        setIsOverlay(false);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    // Use setMode for explicit independent positioning
    if (window.electronAPI && !isOverlay) {
      if (isOpen) {
        window.electronAPI.setMode('expanded');
      } else {
        window.electronAPI.setMode('minimized');
      }
    }
  }, [isOpen, isOverlay]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleMinimize = () => {
    setIsOpen(false);
  };

  // --- MANUAL DRAG LOGIC (Absolute Delta) ---
  const handlePointerDown = (e) => {
    if (isOpen || isOverlay) return;

    e.target.setPointerCapture(e.pointerId);

    isDragging.current = false;
    lastPointerPos.current = { x: e.screenX, y: e.screenY };
    dragStartPos.current = { x: e.screenX, y: e.screenY };
  };

  const handlePointerMove = (e) => {
    if (e.buttons !== 1) return;

    const currentX = e.screenX;
    const currentY = e.screenY;

    // Calculate absolute delta from last frame
    const dx = currentX - lastPointerPos.current.x;
    const dy = currentY - lastPointerPos.current.y;

    // Check threshold from START to determine if it is a drag vs click
    const totalDx = Math.abs(currentX - dragStartPos.current.x);
    const totalDy = Math.abs(currentY - dragStartPos.current.y);

    if (!isDragging.current && (totalDx > 4 || totalDy > 4)) {
      isDragging.current = true;
    }

    if (isDragging.current) {
      if (window.electronAPI) {
        window.electronAPI.moveWindow(dx, dy);
      }
      // Update last pos ONLY if processed
      lastPointerPos.current = { x: currentX, y: currentY };
    }
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);

    // If NOT dragged, treat as Click
    if (!isDragging.current) {
      handleOpen();
    }
    isDragging.current = false;
  };

  if (isOverlay) {
    return <Overlay />;
  }

  return (
    <div className="w-full h-full flex items-end justify-end overflow-hidden">
      {isOpen ? (
        <ColorWidget onMinimize={handleMinimize} />
      ) : (
        // MINIMIZED BUTTON - POINTER DRAG
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-14 h-14 bg-white dark:bg-neutral-800 border-2 border-gray-300 dark:border-neutral-600 rounded-2xl shadow-xl flex items-center justify-center relative select-none active:scale-95 transition-transform touch-none"
          title="Drag to Move, Click to Open"
        >
          <img
            src="./icon.png"
            alt="Open"
            className="w-10 h-10 rounded-full shadow-sm pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}

export default App;
