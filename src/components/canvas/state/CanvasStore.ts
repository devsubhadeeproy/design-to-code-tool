import { create } from "zustand";
import { CanvasNode } from "../types/CanvasNode";

interface CanvasViewState {
  zoom: number;
  panX: number;
  panY: number;
}

interface CanvasActions {
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  resetView: () => void;
  nodes: CanvasNode[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[])=>string[])) => void;
  addNode: (node: CanvasNode) => void;
}

export type CanvasState = CanvasViewState & CanvasActions;

export const useCanvasStore = create<CanvasState>((set) => ({
  // initial state
  zoom: 1,
  panX: 0,
  panY: 0,

  // functions to update state

  setZoom: (zoom) =>
    set(() => ({
      zoom: Math.max(0.1, Math.min(zoom, 5)), // clamp
    })),

  setPan: (panX, panY) =>
    set(() => ({
      panX,
      panY,
    })),

  resetView: () =>
    set(() => ({
      zoom: 1,
      panX: 0,
      panY: 0,
    })),

  nodes: [
    {
      id: "1",
      type: "rectangle",
      x: 200,
      y: 150,
      width: 250,
      height: 150,
    },
    {
      id: "2",
      type: "rectangle",
      x: 600,
      y: 400,
      width: 250,
      height: 120,
    },
  ],

  selectedIds: [],

  setSelectedIds: (ids) => set((state)=>({
    selectedIds: typeof ids === "function" ? ids(state.selectedIds) : ids,
  })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),
}));
