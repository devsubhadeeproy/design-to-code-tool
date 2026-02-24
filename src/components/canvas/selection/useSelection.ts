"use client";

import { useState, useRef } from "react";
import { SelectionRect } from "./selectionTypes";
import { useCanvasStore } from "../state/CanvasStore";

export function useSelection() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [start, setSart] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<SelectionRect | null>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const zoom = useCanvasStore((s) => s.zoom);

  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isSelectingRef = useRef(false);

  const EDGE_THRESHOLD = 10;
  const PAN_SPEED = 5;

  const autoPanLoop = () => {
    if (!isSelectingRef) return;

    const { x, y } = mouseRef.current;

    let dx = 0;
    let dy = 0;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x < EDGE_THRESHOLD) dx = PAN_SPEED;
    else if (x > viewportWidth - EDGE_THRESHOLD) dx = -PAN_SPEED;

    if (y < EDGE_THRESHOLD) dy = PAN_SPEED;
    else if (y > viewportHeight - EDGE_THRESHOLD) dy = -PAN_SPEED;

    if (dx !== 0 || dy !== 0) {
      useCanvasStore.setState((state) => ({
        panX: state.panX + dx,
        panY: state.panY + dy,
      }));
    }

    animationRef.current = requestAnimationFrame(autoPanLoop);
  };

  const startSelection = (x: number, y: number) => {
    setIsSelecting(true);
    isSelectingRef.current = true; // 👈 important

    setSart({ x, y });
    setRect({ x, y, width: 0, height: 0 });

    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(autoPanLoop);
    }
  };

  const updateSelection = (x: number, y: number) => {
    if (!start) return;

    mouseRef.current = { x, y }; // 👈 store latest mouse

    const left = Math.min(start.x, x);
    const top = Math.min(start.y, y);
    const width = Math.abs(x - start.x);
    const height = Math.abs(y - start.y);

    setRect({ x: left, y: top, width, height });
  };

  const endSelection = (isShiftPressed: boolean = false) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!rect || !start) {
      cleanup();
      return;
    }

    const isClick = rect.width < 5 && rect.height < 5;

    if (isClick) {
      const worldX = (rect.x - panX) / zoom;
      const worldY = (rect.y - panY) / zoom;

      const clickedNode = [...nodes].reverse().find((node) =>
        pointInside(worldX, worldY, {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        }),
      );

      if (clickedNode) {
        if (isShiftPressed) {
          setSelectedIds((prev) =>
            prev.includes(clickedNode.id)
              ? prev.filter((id) => id !== clickedNode.id)
              : [...prev, clickedNode.id],
          );
        } else {
          setSelectedIds([clickedNode.id]);
        }
      } else {
        if (!isShiftPressed) {
          setSelectedIds([]);
        }
      }

      cleanup();
      return;
    }

    const worldRect = {
      x: (rect.x - panX) / zoom,
      y: (rect.y - panY) / zoom,
      width: rect.width / zoom,
      height: rect.height / zoom,
    };

    const selected = nodes
      .filter((node) =>
        intersects(worldRect, {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        }),
      )
      .map((node) => node.id);

    setSelectedIds(selected);

    cleanup();
  };

  const cleanup = () => {
    isSelectingRef.current = false;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsSelecting(false);
    setSart(null);
    setRect(null);
  };

  return {
    isSelecting,
    rect,
    startSelection,
    updateSelection,
    endSelection,
  };
}

function intersects(a: SelectionRect, b: SelectionRect) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function pointInside(
  px: number,
  py: number,
  node: { x: number; y: number; width: number; height: number },
) {
  return (
    px >= node.x &&
    px <= node.x + node.width &&
    py >= node.y &&
    py <= node.y + node.height
  );
}
