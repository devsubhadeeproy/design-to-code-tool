import React from "react";

interface CanvasSceneProps {
    children: React.ReactNode;
}

export function CanvasScene({ children }: CanvasSceneProps) {
    return (
        <div
            className="
        relative
        w-2500
        h-2500
        bg-neutral-800
      "
        >
            {children}
        </div>
    );
}
