"use client";

import { useState } from "react";
import { SelectionRect } from "./selectionTypes";

export function useSelection(){
    const [isSelecting, setIsSelecting] = useState(false);
    const [start, setSart] = useState<{ x: number; y: number } | null>(null);
    const [rect, setRect] = useState<SelectionRect | null>(null);

    const startSelection = (x: number, y: number)=>{
        setIsSelecting(true);
        setSart({ x, y });
        setRect({ x, y, width: 0, height: 0 });
    };

    const updateSelection = (x: number, y: number)=>{
        if (!start) return;

        const left = Math.min(start.x, x);
        const top = Math.min(start.y, y);
        const width = Math.abs(x - start.x);
        const height = Math.abs(y - start.y);

        setRect({ x: left, y: top, width, height});
    }

    const endSelection = () => {
        setIsSelecting(false);
        setSart(null);
        setRect({ x: 0, y: 0, width: 0, height: 0 });
    }

    return {
        isSelecting,
        rect,
        startSelection,
        updateSelection,
        endSelection
    }
}