import { create } from "zustand";

interface CanvasViewState {
    zoom: number;
    panX: number;
    panY: number;
}

interface CanvasActions {
    setZoom: (zoom: number)=>void;
    setPan: (panX: number, panY: number)=>void;
    resetView: ()=>void;
}

export type CanvasState= CanvasViewState & CanvasActions;

export const useCanvasStore = create<CanvasState>((set)=>({
    // initial state
    zoom: 1,
    panX: 0,
    panY: 0,

    // functions to update state

    setZoom: (zoom)=>set(()=>({
        zoom: Math.max(0.1, Math.min(zoom, 5)), // clamp
    })),

    setPan: (panX, panY) =>
        set(()=>({
            panX,
            panY
        })),
    
    resetView: () =>
        set(()=>({
            zoom: 1,
            panX: 0,
            panY: 0,
        })),
}));