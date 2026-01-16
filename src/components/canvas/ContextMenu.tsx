'use client';

interface ContextMenuProps {
    x: number;
    y: number;
    onDelete: () => void;
    onClose: () => void;
}

export default function ContextMenu({
    x,
    y,
    onDelete,
    onClose,
}: ContextMenuProps) {
    return (
        <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                    onDelete();
                    onClose();
                }}
            >
                🗑 Delete
            </button>
        </div>
    );
}
