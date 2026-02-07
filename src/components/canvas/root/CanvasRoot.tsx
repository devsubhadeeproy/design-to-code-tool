import React from "react";

interface CanvasRootProps {
    children: React.ReactNode;
}

export function CanvasRoot({ children }: CanvasRootProps) {
    return (
        <div
            className="
        relative
        w-full
        h-full
        overflow-hidden
        bg-neutral-900
        select-none
      "
        >
            {children}
        </div>
    );
}
