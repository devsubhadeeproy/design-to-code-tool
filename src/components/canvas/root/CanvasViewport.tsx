"use client";

import React, { useRef } from "react";
import { useCanvasStore } from "../state/CanvasStore";
import { useSelection } from "../selection/useSelection";
import { SelectionOverlay } from "../selection/SelectionOverlay";
import { useZoom } from "../interactions/useZoom";
import { usePan } from "../interactions/usePan";

interface CanvasViewportProps {
    children: React.ReactNode;
}

export function CanvasViewport({ children }: CanvasViewportProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useZoom(containerRef);
    usePan(containerRef);

    const selection = useSelection();

    const zoom = useCanvasStore((s) => s.zoom);
    const panX = useCanvasStore((s) => s.panX);
    const panY = useCanvasStore((s) => s.panY);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;

        selection.startSelection(e.clientX, e.clientY);
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!selection.isSelecting) return;

        selection.updateSelection(e.clientX, e.clientY);
    }

    const handleMouseUp = (e: React.MouseEvent) => {
        selection.endSelection(e.shiftKey);
    }

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div
                className="absolute inset-0 origin-top-left"
                style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                }}
            >
                {children}
            </div>
            <SelectionOverlay rect={selection.rect} />
        </div>
    );
}
