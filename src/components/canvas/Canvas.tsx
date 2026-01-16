// src/components/canvas/Canvas.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Line, Textbox } from 'fabric';
import { Group, Triangle } from 'fabric';
import { useCanvasStore, generateId } from '@/lib/store/canvasStore';
import { RectangleObject, ArrowObject, TextObject } from '@/lib/types/design';
import Toolbar, { Tool } from './Toolbar';
import ContextMenu from './ContextMenu';

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);

    const drawingRectRef = useRef<Rect | null>(null);
    const drawingArrowRef = useRef<Line | null>(null);
    const startPointRef = useRef<{ x: number; y: number } | null>(null);
    const isDrawingRef = useRef(false);

    const [activeTool, setActiveTool] = useState<Tool>('select');
    const activeToolRef = useRef<Tool>('select');

    const objects = useCanvasStore((s) => s.objects);
    const addObject = useCanvasStore((s) => s.addObject);
    const removeObject = useCanvasStore((s) => s.removeObject);
    const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
    const updateObject = useCanvasStore((s) => s.updateObject);

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        targetId: string;
    } | null>(null);

    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const isDrawing =
            activeTool === 'rectangle' ||
            activeTool === 'frame' ||
            activeTool === 'arrow' ||
            activeTool === 'text';

        canvas.selection = !isDrawing;

        canvas.defaultCursor = isDrawing ? 'crosshair' : 'default';
        canvas.hoverCursor = isDrawing ? 'crosshair' : 'move';

        canvas.getObjects().forEach((obj) => {
            obj.selectable = !isDrawing;
            obj.evented = !isDrawing;
        });

        canvas.renderAll();
    }, [activeTool]);


    const getPointer = (e: MouseEvent, canvas: FabricCanvas) => {
        const rect = canvas.getElement().getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    /* ------------------------- INIT CANVAS ------------------------- */

    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        const canvas = new FabricCanvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 64,
            backgroundColor: '#f9fafb',
            selection: true,
        });

        fabricCanvasRef.current = canvas;

        /* ------------------------- MOUSE DOWN ------------------------- */

        canvas.on('mouse:down', (opt) => {
            const e = opt.e as MouseEvent;

            // Right click (context menu)
            if (e.button === 2) {
                e.preventDefault();
                const target = opt.target as any;
                if (target?.designId) {
                    setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        targetId: target.designId,
                    });
                }
                return;
            }

            setContextMenu(null);

            const tool = activeToolRef.current;

            // TEXT TOOL (click once)
            if (tool === 'text' && !opt.target) {
                const pointer = getPointer(e, canvas);

                const textObj: TextObject = {
                    id: generateId('text'),
                    type: 'text',
                    position: pointer,
                    dimensions: { width: 200, height: 40 },
                    content: 'Text',
                    style: {
                        fill: '#000000',
                        fontSize: 16,
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        textAlign: 'left',
                    },
                };

                addObject(textObj);
                setSelectedIds([textObj.id]);
                setActiveTool('select');
                return;
            }

            if (tool === 'select' || opt.target) return;

            const pointer = getPointer(e, canvas);
            isDrawingRef.current = true;
            startPointRef.current = pointer;

            // ARROW
            if (tool === 'arrow') {
                const line = new Line(
                    [pointer.x, pointer.y, pointer.x, pointer.y],
                    {
                        stroke: '#2563eb',
                        strokeWidth: 2,
                        selectable: false,
                        evented: false,
                    }
                );
                drawingArrowRef.current = line;
                canvas.add(line);
                return;
            }

            // RECT / FRAME
            const rect = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 1,
                height: 1,
                fill: tool === 'frame' ? 'transparent' : '#3b82f6',
                stroke: '#2563eb',
                strokeWidth: 2,
                selectable: false,
                evented: false,
                opacity: 0.7,
            });

            drawingRectRef.current = rect;
            canvas.add(rect);
        });

        /* ------------------------- MOUSE MOVE ------------------------- */

        canvas.on('mouse:move', (opt) => {
            if (!isDrawingRef.current || !startPointRef.current) return;

            const e = opt.e as MouseEvent;
            const pointer = getPointer(e, canvas);
            const start = startPointRef.current;

            // Arrow preview
            if (drawingArrowRef.current) {
                drawingArrowRef.current.set({
                    x1: start.x,
                    y1: start.y,
                    x2: pointer.x,
                    y2: pointer.y,
                });
                drawingArrowRef.current.setCoords();
                canvas.renderAll();
                return;
            }

            // Rect preview
            if (!drawingRectRef.current) return;

            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            const width = Math.abs(pointer.x - start.x);
            const height = Math.abs(pointer.y - start.y);

            drawingRectRef.current.set({ left, top, width, height });
            drawingRectRef.current.setCoords();
            canvas.renderAll();
        });

        /* ------------------------- MOUSE UP ------------------------- */

        canvas.on('mouse:up', () => {
            if (!isDrawingRef.current || !startPointRef.current) return;

            const tool = activeToolRef.current;

            // FINALIZE ARROW
            if (drawingArrowRef.current) {
                const line = drawingArrowRef.current;

                const arrow: ArrowObject = {
                    id: generateId('arrow'),
                    type: 'arrow',
                    position: { x: 0, y: 0 },
                    dimensions: { width: 0, height: 0 },
                    points: [
                        { x: line.x1 ?? 0, y: line.y1 ?? 0 },
                        { x: line.x2 ?? 0, y: line.y2 ?? 0 },
                    ],
                    style: {
                        stroke: line.stroke as string,
                        strokeWidth: line.strokeWidth ?? 2,
                        arrowHeadSize: 12,
                    },
                };


                addObject(arrow);
                canvas.remove(line);
                drawingArrowRef.current = null;
            }

            // FINALIZE RECT / FRAME
            if (drawingRectRef.current) {
                const rect = drawingRectRef.current;
                const width = rect.width ?? 0;
                const height = rect.height ?? 0;

                if (width > 5 && height > 5) {
                    const newObj: RectangleObject = {
                        id: generateId(tool),
                        type: tool === 'frame' ? 'frame' : 'rectangle',
                        position: { x: rect.left ?? 0, y: rect.top ?? 0 },
                        dimensions: { width, height },
                        style: {
                            fill: tool === 'frame' ? '#ffffff' : '#3b82f6',
                            stroke: '#2563eb',
                            strokeWidth: 2,
                            borderRadius: tool === 'frame' ? 0 : 8,
                        },
                    };
                    addObject(newObj);
                }

                canvas.remove(rect);
                drawingRectRef.current = null;
            }

            startPointRef.current = null;
            isDrawingRef.current = false;
            setActiveTool('select');
            canvas.renderAll();
        });

        /* ------------------------- SELECTION ------------------------- */

        canvas.on('selection:created', (e) => {
            setSelectedIds((e.selected || []).map((o: any) => o.designId).filter(Boolean));
        });

        canvas.on('selection:updated', (e) => {
            setSelectedIds((e.selected || []).map((o: any) => o.designId).filter(Boolean));
        });

        canvas.on('selection:cleared', () => setSelectedIds([]));

        /* ------------------------- CLEANUP ------------------------- */

        const preventContext = (e: MouseEvent) => e.preventDefault();
        canvas.getElement().addEventListener('contextmenu', preventContext);

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []);

    /* ------------------------- SYNC OBJECTS ------------------------- */

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        canvas.clear();

        objects.forEach((obj) => {
            if (obj.type === 'rectangle' || obj.type === 'frame') {
                canvas.add(createFabricRectangle(obj));
            }
            if (obj.type === 'arrow') {
                canvas.add(createFabricArrow(obj));
            }
            if (obj.type === 'text') {
                canvas.add(createFabricText(obj));
            }
        });

        canvas.renderAll();
    }, [objects]);

    return (
        <div className="relative w-full h-full">
            <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

            <div className="pt-16 w-full h-full">
                <canvas ref={canvasRef} />
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onDelete={() => removeObject(contextMenu.targetId)}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}

/* ------------------------- FACTORIES ------------------------- */

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
    });

    (rect as any).designId = obj.id;
    return rect;
}

function createFabricArrow(obj: ArrowObject): Group {
    const [start, end] = obj.points;

    const line = new Line(
        [start.x, start.y, end.x, end.y],
        {
            stroke: obj.style.stroke,
            strokeWidth: obj.style.strokeWidth,
            selectable: false,
            evented: false,
        }
    );

    const angle =
        Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

    const headSize = obj.style.arrowHeadSize ?? 10;

    const arrowHead = new Triangle({
        left: end.x,
        top: end.y,
        originX: 'center',
        originY: 'center',
        angle: angle + 90,
        width: headSize,
        height: headSize,
        fill: obj.style.stroke,
    });

    const group = new Group([line, arrowHead], {
        selectable: true,
        evented: true,
    });

    (group as any).designId = obj.id;
    return group;
}

function createFabricText(obj: TextObject): Textbox {
    const text = new Textbox(obj.content, {
        left: obj.position.x,
        top: obj.position.y,
        width: obj.dimensions.width,
        fill: obj.style.fill,
        fontSize: obj.style.fontSize,
        fontFamily: obj.style.fontFamily,
        fontWeight: obj.style.fontWeight,
        textAlign: obj.style.textAlign,
    });

    (text as any).designId = obj.id;
    return text;
}
