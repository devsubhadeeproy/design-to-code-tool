'use client';

import { useMemo } from 'react';
import { useCanvasStore } from '@/lib/store/canvasStore';
import type { DesignObject } from '@/lib/types/design';

export type Tool =
    | 'select'
    | 'rectangle'
    | 'frame'
    | 'text'
    | 'arrow'
    | 'hand';

interface ToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}

export default function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
    /* -------------------- STORE STATE (RAW ONLY) -------------------- */
    const objects = useCanvasStore((s) => s.objects);
    const selectedIds = useCanvasStore((s) => s.selectedIds);
    const updateObjectStyle = useCanvasStore((s) => s.updateObjectStyle);
    const clearCanvas = useCanvasStore((s) => s.clearCanvas);

    /* -------------------- DERIVED STATE -------------------- */
    const selectedObject: DesignObject | null = useMemo(() => {
        if (selectedIds.length !== 1) return null;
        return objects.find((o) => o.id === selectedIds[0]) ?? null;
    }, [objects, selectedIds]);

    /* -------------------- STYLE VALUES -------------------- */
    const fillColor =
        selectedObject &&
            (selectedObject.type === 'rectangle' ||
                selectedObject.type === 'frame' ||
                selectedObject.type === 'text')
            ? selectedObject.style.fill ?? '#000000'
            : '#000000';

    const strokeColor = selectedObject?.style.stroke ?? '#000000';
    const strokeWidth = selectedObject?.style.strokeWidth ?? 1;

    const tools: { id: Tool; label: string; icon: string }[] = [
        { id: 'select', label: 'Select', icon: '⬆' },
        { id: 'rectangle', label: 'Rectangle', icon: '⬜' },
        { id: 'frame', label: 'Frame', icon: '🖼' },
        { id: 'text', label: 'Text', icon: 'T' },
        { id: 'arrow', label: 'Arrow', icon: '➡' },
        { id: 'hand', label: 'Hand', icon: '✋' },
    ];

    return (
        <div className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-10 flex items-center px-4 gap-4">
            {/* Title */}
            <div className="text-lg font-semibold text-gray-800 mr-4">
                Design Tool
            </div>

            <div className="h-8 w-px bg-gray-300" />

            {/* Tool Buttons */}
            <div className="flex gap-1">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => onToolChange(tool.id)}
                        className={`
              px-3 py-2 rounded-lg flex flex-col items-center justify-center
              min-w-15 transition-all
              ${activeTool === tool.id
                                ? 'bg-blue-100 text-blue-700 shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                            }
            `}
                        title={tool.label}
                    >
                        <span className="text-xl">{tool.icon}</span>
                        <span className="text-xs mt-1">{tool.label}</span>
                    </button>
                ))}
            </div>

            <div className="h-8 w-px bg-gray-300" />

            {/* Style Controls */}
            <div className="flex items-center gap-3">
                {/* Fill */}
                <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 mb-1">Fill</label>
                    <input
                        type="color"
                        value={fillColor}
                        disabled={!selectedObject || selectedObject.type === 'arrow'}
                        onChange={(e) => {
                            if (!selectedObject) return;

                            if (
                                selectedObject.type === 'rectangle' ||
                                selectedObject.type === 'frame' ||
                                selectedObject.type === 'text'
                            ) {
                                updateObjectStyle(selectedObject.id, {
                                    fill: e.target.value,
                                });
                            }
                        }}
                        className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300 disabled:opacity-50"
                    />
                </div>

                {/* Stroke */}
                <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 mb-1">Stroke</label>
                    <input
                        type="color"
                        value={strokeColor}
                        disabled={!selectedObject}
                        onChange={(e) => {
                            if (!selectedObject) return;
                            updateObjectStyle(selectedObject.id, {
                                stroke: e.target.value,
                            });
                        }}
                        className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300 disabled:opacity-50"
                    />
                </div>

                {/* Stroke Width */}
                <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 mb-1">Width</label>
                    <input
                        type="number"
                        min={0}
                        max={20}
                        value={strokeWidth}
                        disabled={!selectedObject}
                        onChange={(e) => {
                            if (!selectedObject) return;
                            updateObjectStyle(selectedObject.id, {
                                strokeWidth: Number(e.target.value),
                            });
                        }}
                        className="w-16 h-10 px-2 border-2 border-gray-300 rounded text-center disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex-1" />

            {/* Stats */}
            <div className="text-sm text-gray-600">
                {objects.length} object{objects.length !== 1 ? 's' : ''}
            </div>

            <div className="h-8 w-px bg-gray-300" />

            {/* Clear */}
            <button
                onClick={() => {
                    if (confirm('Clear all objects? This cannot be undone.')) {
                        clearCanvas();
                    }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
                Clear Canvas
            </button>
        </div>
    );
}
