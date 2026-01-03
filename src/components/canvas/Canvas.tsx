'use client';

import { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, Rect } from 'fabric';
import { useCanvasStore } from '@/lib/store/canvasStore';
import { RectangleObject } from '@/lib/types/design';

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);

    const objects = useCanvasStore((state) => state.objects);
    const setSelectedIds = useCanvasStore((state) => state.setSelectedIds);
    const updateObject = useCanvasStore((state) => state.updateObject);

    /**
     * === INITIALIZE FABRIC CANVAS ===
     */
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new FabricCanvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#f9fafb',
            selection: true,
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        /**
         * SELECTION EVENTS
         */
        canvas.on('selection:created', (e) => {
            const ids = e.selected
                ?.map((obj) => (obj as any).designId)
                .filter(Boolean) as string[];

            setSelectedIds(ids);
        });

        canvas.on('selection:updated', (e) => {
            const ids = e.selected
                ?.map((obj) => (obj as any).designId)
                .filter(Boolean) as string[];

            setSelectedIds(ids);
        });

        canvas.on('selection:cleared', () => {
            setSelectedIds([]);
        });

        /**
         * OBJECT MODIFICATION
         */
        canvas.on('object:modified', (e) => {
            const obj = e.target as any;
            if (!obj?.designId) return;

            updateObject(obj.designId, {
                position: { x: obj.left ?? 0, y: obj.top ?? 0 },
                dimensions: {
                    width: (obj.width ?? 0) * (obj.scaleX ?? 1),
                    height: (obj.height ?? 0) * (obj.scaleY ?? 1),
                },
                rotation: obj.angle ?? 0,
                opacity: obj.opacity ?? 1,
            });

            obj.set({ scaleX: 1, scaleY: 1 });
        });

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, [setSelectedIds, updateObject]);

    /**
     * === SYNC ZUSTAND → FABRIC ===
     */
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        canvas.clear();

        objects.forEach((obj) => {
            if (obj.type === 'rectangle' || obj.type === 'frame') {
                const rect = createFabricRectangle(obj);
                canvas.add(rect);
            }
        });

        canvas.renderAll();
    }, [objects]);

    return <canvas ref={canvasRef} className="absolute inset-0" />;
}

/**
 * === FABRIC OBJECT FACTORY ===
 */
function createFabricRectangle(obj: RectangleObject): Rect {
    const rect = new Rect({
        left: obj.position.x,
        top: obj.position.y,
        width: obj.dimensions.width,
        height: obj.dimensions.height,
        fill: obj.style.fill,
        stroke: obj.style.stroke,
        strokeWidth: obj.style.strokeWidth,
        rx: obj.style.borderRadius,
        ry: obj.style.borderRadius,
        opacity: obj.opacity ?? 1,
        angle: obj.rotation ?? 0,
        hasControls: true,
        hasBorders: true,
    });

    (rect as any).designId = obj.id;

    return rect;
}
