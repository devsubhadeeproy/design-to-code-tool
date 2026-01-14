// src/components/canvas/Canvas.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect } from 'fabric';
import { useCanvasStore, generateId } from '@/lib/store/canvasStore';
import { RectangleObject } from '@/lib/types/design';
import Toolbar, { Tool } from './Toolbar';

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);

    const drawingRectRef = useRef<Rect | null>(null);
    const startPointRef = useRef<{ x: number; y: number } | null>(null);
    const isDrawingRef = useRef(false);

    const [activeTool, setActiveTool] = useState<Tool>('select');
    const activeToolRef = useRef<Tool>('select'); // ← FIX: Use ref to avoid closure
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const objects = useCanvasStore((s) => s.objects);

    // Keep ref in sync with state
    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);
    const addObject = useCanvasStore((s) => s.addObject);
    const removeObject = useCanvasStore((s) => s.removeObject);
    const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
    const updateObject = useCanvasStore((s) => s.updateObject);

    // Add debug message
    const addDebug = (msg: string) => {
        console.log(msg);
        setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    // Helper to get coordinates
    const getPointerCoords = (mouseEvent: MouseEvent, canvas: FabricCanvas) => {
        const canvasEl = canvas.getElement();
        const rect = canvasEl.getBoundingClientRect();

        return {
            x: mouseEvent.clientX - rect.left,
            y: mouseEvent.clientY - rect.top,
        };
    };

    // TEST BUTTON: Add a rectangle directly (bypassing drawing)
    const addTestRectangle = () => {
        addDebug('🧪 TEST: Adding rectangle directly to Zustand');

        const testRect: RectangleObject = {
            id: generateId('rectangle'),
            type: 'rectangle',
            position: { x: 100, y: 100 },
            dimensions: { width: 200, height: 150 },
            style: {
                fill: '#ef4444', // Red to distinguish test rects
                stroke: '#991b1b',
                strokeWidth: 3,
                borderRadius: 8,
            },
            opacity: 1,
            rotation: 0,
        };

        addObject(testRect);
        addDebug('✅ TEST: Rectangle added to store');
    };

    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        addDebug('🎨 Initializing Fabric Canvas');

        const canvas = new FabricCanvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 64,
            backgroundColor: '#f9fafb',
        });

        fabricCanvasRef.current = canvas;
        addDebug(`✅ Canvas initialized: ${canvas.width}x${canvas.height}`);

        // Log the entire event object to see what properties exist
        canvas.on('mouse:down', (event) => {
            addDebug('🖱️ MOUSE DOWN');
            addDebug(`📋 Event keys: ${Object.keys(event).join(', ')}`);
            addDebug(`🎯 Active tool (state): ${activeTool}`);
            addDebug(`🎯 Active tool (ref): ${activeToolRef.current}`); // ← Use ref
            addDebug(`🎯 Target: ${event.target ? 'object' : 'empty'}`);

            const mouseEvent = event.e as MouseEvent;
            addDebug(`🖱️ Button: ${mouseEvent.button}`);

            // Right click
            if (mouseEvent.button === 2) {
                mouseEvent.preventDefault();
                const target = event.target as any;
                if (target?.designId) {
                    if (confirm('Delete this object?')) {
                        removeObject(target.designId);
                    }
                }
                return;
            }

            const isDrawingTool = activeToolRef.current === 'rectangle' || activeToolRef.current === 'frame'; // ← Use ref
            addDebug(`🔧 Is drawing tool? ${isDrawingTool}`);

            if (!isDrawingTool) {
                addDebug('❌ Not in drawing mode');
                return;
            }

            if (event.target) {
                addDebug('❌ Clicked on existing object');
                return;
            }

            // Get coordinates
            const pointer = getPointerCoords(mouseEvent, canvas);
            addDebug(`📍 Coordinates: x=${pointer.x.toFixed(0)}, y=${pointer.y.toFixed(0)}`);

            // Start drawing
            isDrawingRef.current = true;
            startPointRef.current = pointer;
            addDebug('✅ Drawing state activated');

            canvas.discardActiveObject();

            // Create preview
            const rect = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 1,
                height: 1,
                fill: activeToolRef.current === 'frame' ? 'transparent' : '#3b82f6', // ← Use ref
                stroke: '#2563eb',
                strokeWidth: 2,
                selectable: false,
                evented: false,
                opacity: 0.7,
            });

            addDebug(`✅ Preview rect: left=${rect.left}, top=${rect.top}`);
            drawingRectRef.current = rect;

            canvas.add(rect);
            addDebug(`✅ Rect added, canvas has ${canvas.getObjects().length} objects`);

            canvas.renderAll();
            addDebug('✅ Canvas rendered');
        });

        canvas.on('mouse:move', (event) => {
            if (!isDrawingRef.current || !drawingRectRef.current || !startPointRef.current) {
                return;
            }

            const mouseEvent = event.e as MouseEvent;
            const pointer = getPointerCoords(mouseEvent, canvas);
            const start = startPointRef.current;
            const rect = drawingRectRef.current;

            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            const width = Math.abs(pointer.x - start.x);
            const height = Math.abs(pointer.y - start.y);

            // Only log every 10th move event to avoid spam
            if (Math.random() < 0.1) {
                addDebug(`📏 w=${width.toFixed(0)}, h=${height.toFixed(0)}`);
            }

            rect.set({ left, top, width, height });
            rect.setCoords();
            canvas.renderAll();
        });

        canvas.on('mouse:up', () => {
            addDebug('🖱️ MOUSE UP');
            addDebug(`🔍 isDrawing=${isDrawingRef.current}, hasRect=${!!drawingRectRef.current}`);

            if (!isDrawingRef.current || !drawingRectRef.current || !startPointRef.current) {
                addDebug('❌ Not in drawing state');
                return;
            }

            const rect = drawingRectRef.current;
            const width = rect.width ?? 0;
            const height = rect.height ?? 0;

            addDebug(`📦 Final: w=${width.toFixed(0)}, h=${height.toFixed(0)}`);

            if (width > 5 && height > 5) {
                addDebug('✅ Creating object');

                const newObject: RectangleObject = {
                    id: generateId(activeToolRef.current), // ← Use ref
                    type: activeToolRef.current === 'frame' ? 'frame' : 'rectangle', // ← Use ref
                    position: { x: rect.left ?? 0, y: rect.top ?? 0 },
                    dimensions: { width, height },
                    style: {
                        fill: activeToolRef.current === 'frame' ? '#ffffff' : '#3b82f6', // ← Use ref
                        stroke: '#2563eb',
                        strokeWidth: 2,
                        borderRadius: activeToolRef.current === 'frame' ? 0 : 8, // ← Use ref
                    },
                    opacity: 1,
                    rotation: 0,
                };

                addDebug(`📦 Object: ${JSON.stringify(newObject.position)}`);
                addObject(newObject);
                addDebug('✅ Added to Zustand');
            } else {
                addDebug(`⚠️ Too small (${width.toFixed(0)}x${height.toFixed(0)})`);
            }

            canvas.remove(rect);
            drawingRectRef.current = null;
            startPointRef.current = null;
            isDrawingRef.current = false;

            setActiveTool('select');
            canvas.renderAll();
            addDebug('🔄 Switched to select');
        });

        // Selection events
        canvas.on('selection:created', (event) => {
            const selected = event.selected || [];
            setSelectedIds(selected.map((obj: any) => obj.designId).filter(Boolean));
        });

        canvas.on('selection:updated', (event) => {
            const selected = event.selected || [];
            setSelectedIds(selected.map((obj: any) => obj.designId).filter(Boolean));
        });

        canvas.on('selection:cleared', () => {
            setSelectedIds([]);
        });

        canvas.on('object:modified', (event) => {
            const obj = event.target as any;
            if (!obj?.designId) return;

            const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
            const height = (obj.height ?? 0) * (obj.scaleY ?? 1);

            updateObject(obj.designId, {
                position: { x: obj.left ?? 0, y: obj.top ?? 0 },
                dimensions: { width, height },
                rotation: obj.angle ?? 0,
                opacity: obj.opacity ?? 1,
            });

            obj.set({ scaleX: 1, scaleY: 1, width, height });
            obj.setCoords();
            canvas.renderAll();
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = canvas.getActiveObjects();
                activeObjects.forEach((obj: any) => {
                    if (obj.designId) {
                        removeObject(obj.designId);
                    }
                });
                canvas.discardActiveObject();
                canvas.renderAll();
            }

            if (e.key === 'Escape') {
                if (isDrawingRef.current && drawingRectRef.current) {
                    canvas.remove(drawingRectRef.current);
                    drawingRectRef.current = null;
                    startPointRef.current = null;
                    isDrawingRef.current = false;
                    setActiveTool('select');
                } else {
                    canvas.discardActiveObject();
                }
                canvas.renderAll();
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const canvasEl = canvas.getElement();
        canvasEl?.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        addDebug(`🔧 Tool changed: ${activeTool}`);

        const isDrawingTool = activeTool === 'rectangle' || activeTool === 'frame';
        canvas.selection = !isDrawingTool;
        canvas.defaultCursor = isDrawingTool ? 'crosshair' : 'default';
        canvas.hoverCursor = isDrawingTool ? 'crosshair' : 'move';

        canvas.getObjects().forEach((obj) => {
            obj.selectable = !isDrawingTool;
            obj.evented = !isDrawingTool;
        });

        canvas.renderAll();
    }, [activeTool]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        addDebug(`🔄 Syncing ${objects.length} objects`);

        const drawingObj = drawingRectRef.current;
        canvas.clear();

        objects.forEach((obj) => {
            if (obj.type === 'rectangle' || obj.type === 'frame') {
                const fabricRect = createFabricRectangle(obj);
                const isDrawingTool = activeTool === 'rectangle' || activeTool === 'frame';
                fabricRect.selectable = !isDrawingTool;
                fabricRect.evented = !isDrawingTool;
                canvas.add(fabricRect);
            }
        });

        if (drawingObj) {
            addDebug('🎨 Re-adding preview');
            canvas.add(drawingObj);
        }

        canvas.renderAll();
        addDebug(`✅ Canvas: ${canvas.getObjects().length} objects`);
    }, [objects, activeTool]);

    return (
        <div className="relative w-full h-full bg-slate-50">
            <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

            <div className="pt-16 w-full h-full">
                <canvas ref={canvasRef} className="border-2 border-blue-500" />
            </div>

            {/* Debug Panel */}
            <div className="absolute top-20 right-4 w-80 max-h-96 overflow-y-auto bg-black bg-opacity-90 text-white text-xs p-3 rounded shadow-lg font-mono">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-600">
                    <span className="font-bold">🐛 Debug Log</span>
                    <button
                        onClick={() => setDebugInfo([])}
                        className="text-red-400 hover:text-red-300"
                    >
                        Clear
                    </button>
                </div>

                {/* Test Button */}
                <button
                    onClick={addTestRectangle}
                    className="w-full mb-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
                >
                    🧪 ADD TEST RECTANGLE
                </button>

                <div className="space-y-1">
                    {debugInfo.length === 0 && (
                        <div className="text-gray-500 italic">No events yet...</div>
                    )}
                    {debugInfo.map((msg, i) => (
                        <div key={i} className="leading-tight">{msg}</div>
                    ))}
                </div>
            </div>

            {/* Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-white border-t border-gray-200 flex items-center px-4 text-xs text-gray-600">
                <span className="font-medium">Tool: {activeTool}</span>
                <span className="ml-4">
                    Drawing: {isDrawingRef.current ? '🎨 YES' : '❌ NO'}
                </span>
                <span className="ml-4">
                    Has Rect: {drawingRectRef.current ? '✅ YES' : '❌ NO'}
                </span>
                <span className="ml-auto">
                    Store: {objects.length} • Canvas: {fabricCanvasRef.current?.getObjects().length ?? 0}
                </span>
            </div>
        </div>
    );
}

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
    });

    (rect as any).designId = obj.id;
    return rect;
}