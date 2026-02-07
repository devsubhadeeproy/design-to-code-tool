import { CanvasRoot } from "@/components/canvas/root/CanvasRoot";
import { CanvasViewport } from "@/components/canvas/root/CanvasViewport";
import { CanvasScene } from "@/components/canvas/root/CanvasScene";

export default function EditorPage() {
    return (
        <div className="w-full h-full">
            <CanvasRoot>
                <CanvasViewport>
                    <CanvasScene>
                        <div className="absolute left-25 top-25 w-37.5 h-37.5 bg-blue-500 rounded-md" />
                    </CanvasScene>
                </CanvasViewport>
            </CanvasRoot>
        </div>
    );
}
