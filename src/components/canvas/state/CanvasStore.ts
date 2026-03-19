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
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  addNode: (node: CanvasNode) => void;
}

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;

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

  setPan: (x, y) =>
    set((state) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const worldWidthScaled = WORLD_WIDTH * state.zoom;
      const worldHeightScaled = WORLD_HEIGHT * state.zoom;

      let clampedPanX;
      let clampedPanY;

      // 🧠 Horizontal handling
      if (worldWidthScaled <= viewportWidth) {
        // center the world
        clampedPanX = (viewportWidth - worldWidthScaled) / 2;
      } else {
        const minPanX = viewportWidth - worldWidthScaled;
        const maxPanX = 0;
        clampedPanX = Math.min(maxPanX, Math.max(minPanX, x));
      }

      // 🧠 Vertical handling
      if (worldHeightScaled <= viewportHeight) {
        // center the world
        clampedPanY = (viewportHeight - worldHeightScaled) / 2;
      } else {
        const minPanY = viewportHeight - worldHeightScaled;
        const maxPanY = 0;
        clampedPanY = Math.min(maxPanY, Math.max(minPanY, y));
      }

      return {
        panX: clampedPanX,
        panY: clampedPanY,
      };
    }),

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

  setSelectedIds: (ids) =>
    set((state) => ({
      selectedIds: typeof ids === "function" ? ids(state.selectedIds) : ids,
    })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),
}));
