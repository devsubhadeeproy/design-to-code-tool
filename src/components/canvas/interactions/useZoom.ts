"use client";

import { useEffect } from "react";
import { useCanvasStore } from "../state/CanvasStore";

export function useZoom(containerRef: React.RefObject<HTMLDivElement>){
    const zoom = useCanvasStore((s)=>s.zoom);
    const panX = useCanvasStore((s)=>s.panX);
    const panY = useCanvasStore((s)=>s.panY);
    const setZoom = useCanvasStore((s)=>s.setZoom);
    const setPan = useCanvasStore((s)=>s.setPan);

    useEffect(()=>{
        const el = containerRef.current;
        if (!el) return;

        function onWheel(e: WheelEvent){
            if (!e.ctrlKey) return;

            e.preventDefault();

            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = zoom * zoomFactor;

            const rect = el.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - panX) / zoom;
            const worldY = (mouseY - panY) / zoom;

            setZoom(newZoom);

            const newPanX = mouseX - worldX * newZoom;
            const newPanY = mouseY - worldY * newZoom;

            setPan(newPanX, newPanY);
        }

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [zoom, panX, panY, setZoom, setPan, containerRef]);
}