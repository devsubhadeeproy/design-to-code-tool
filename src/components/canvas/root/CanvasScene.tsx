"use client";

import React from "react";
import { useCanvasStore } from "../state/CanvasStore";

interface CanvasSceneProps {
    children: React.ReactNode;
}

export function CanvasScene({ children }: CanvasSceneProps) {
    const nodes = useCanvasStore((s)=>s.nodes);
    const selectedIds = useCanvasStore((s)=>s.selectedIds);

    return (
        <div
            className="relative w-2500 h-2500 bg-neutral-800"
        >
            {nodes.map((node)=>{
                const isSelected = selectedIds.includes(node.id);

                return(
                    <div
                        key={node.id}
                        className={`absolute ${isSelected?"ring-2 ring-blue-400":""} bg-neutral-500`}
                        style={{left: node.x, top: node.y, width: node.width, height: node.height,}}
                    />
                )
            })}
        </div>
    );
}
