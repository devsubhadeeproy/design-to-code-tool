"use client";

import React from "react";
import { useCanvasStore } from "../state/CanvasStore";

interface CanvasViewportProps {
    children: React.ReactNode;
}

export function CanvasViewport({ children }: CanvasViewportProps) {
    const zoom = useCanvasStore((s) => s.zoom);
    const panX = useCanvasStore((s) => s.panX);
    const panY = useCanvasStore((s) => s.panY);

    return (
        <div
            className="absolute inset-0 origin-top-left"
            style={{
                transform: `
          translate(${panX}px, ${panY}px)
          scale(${zoom})
        `,
            }}
        >
            {children}
        </div>
    );
}
