import { useEffect, useRef } from "react";
import { useCanvasStore } from "../state/CanvasStore";

export function usePan(containerRef: React.RefObject<HTMLDivElement>) {
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const setPan = useCanvasStore((s) => s.setPan);

  const isPanning = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 1) return;

      e.preventDefault();
      isPanning.current = true;
      lastPoint.current = { x: e.clientX, y: e.clientY };
    }

    function onMouseMove(e: MouseEvent) {
      if (!isPanning.current) return;

      const dx = e.clientX - lastPoint.current.x;
      const dy = e.clientY - lastPoint.current.y;

      setPan(panX + dx, panY + dy);
      lastPoint.current = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp(e: MouseEvent) {
      if (e.button === 1) {
        isPanning.current = false;
      }
    }

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [panX, panY, setPan, containerRef]);
}
