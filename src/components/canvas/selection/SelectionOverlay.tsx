import { SelectionRect } from "./selectionTypes"

type Props = {
    rect: SelectionRect | null
}

export function SelectionOverlay({ rect }: Props) {
    if (!rect) return null

    return (
        <div
            className="pointer-events-none absolute border border-blue-400 bg-blue-400/10"
            style={{
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
            }}
        />
    )
}
