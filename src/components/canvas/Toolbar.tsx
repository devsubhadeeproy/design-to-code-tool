'use client';

import { useState } from "react";
import { useCanvasStore, generateId } from "@/lib/store/canvasStore";
import { RectangleObject } from "@/lib/types/design";

export type Tool = 'select' | 'rectangle' | 'frame' | 'text' | 'arrow' | 'hand';

interface ToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}

export default function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
    const [fillColor, setFillColor] = useState('#3b82f6');
    const [strokeColor, setStrokeColor] = useState('#1e40af');
    const [strokeWidth, setStrokeWidth] = useState(2);

    const addObject = useCanvasStore((state) => state.addObject);
    const clearCanvas = useCanvasStore((state) => state.clearCanvas);
    const objects = useCanvasStore((state) => state.objects);

    const tools: { id: Tool; label: string; icon: string; }[] = [
        { id: 'select', label: 'Select', icon: '⬆' },
        { id: 'rectangle', label: 'Rectangle', icon: '⬜' },
        { id: 'frame', label: 'Frame', icon: '🖼' },
        { id: 'text', label: 'Text', icon: 'T' },
        { id: 'arrow', label: 'Arrow', icon: '➡' },
        { id: 'hand', label: 'Hand', icon: '✋' },
    ];

    const addRectangle = () => {
        const newRect: RectangleObject = {
            id: generateId('rectangle'),
            type: 'rectangle',
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
            },
            dimensions: { width: 200, height: 150 },
            style: {
                fill: fillColor,
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                borderRadius: 8,
            },
            opacity: 1,
        };
        addObject(newRect);
    };

    const addFrame = () => {
        const newFrame: RectangleObject = {
            id: generateId('frame'),
            type: 'frame',
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100
            },
            dimensions: { width: 300, height: 400 },
            style: {
                fill: '#ffffff',
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                borderRadius: 0,
            },
            opacity: 1,
        };
        addObject(newFrame);
    };

    return (
        <div className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-10 flex items-center px-4 gap-4">
            {/* Logo/Title */}
            <div className="text-lg font-semibold text-gray-800 mr-4">
                Design Tool
            </div>

            {/* Divider */}
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

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300" />

            {/* Color Pickers */}
            <div className="flex items-center gap-3">
                {/* Fill Color */}
                <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 mb-1">Fill</label>
                    <div className="relative">
                        <input
                            type="color"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
                            title="Fill Color"
                        />
                    </div>
                </div>

                {/* Stroke Color */}
                <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 mb-1">Stroke</label>
                    <div className="relative">
                        <input
                            type="color"
                            value={strokeColor}
                            onChange={(e) => setStrokeColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
                            title="Stroke Color"
                        />
                    </div>
                </div>

                {/* Stroke Width */}
                <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 mb-1">Width</label>
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-16 h-10 px-2 border-2 border-gray-300 rounded text-center"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300" />

            {/* Quick Add Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={addRectangle}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    + Rectangle
                </button>
                <button
                    onClick={addFrame}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                    + Frame
                </button>
            </div>

            {/* Spacer to push right-side controls to the end */}
            <div className="flex-1" />

            {/* Canvas Stats */}
            <div className="text-sm text-gray-600">
                {objects.length} object{objects.length !== 1 ? 's' : ''}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300" />

            {/* Clear Button */}
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