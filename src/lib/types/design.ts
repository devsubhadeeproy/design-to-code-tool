export type DesignObjectType = 'rectangle' | 'frame' | 'text' | 'arrow' | 'hand';


// Basic properties shared by ALL design objects
export interface BaseDesignObject{
    id: string; // unique identifier
    type: DesignObjectType;
    position: {
        x: number; // Position for x-axis
        y: number; // Position for y-axis
    };
    dimensions: {
        width: number; // Width of design
        height: number; // Height of design
    };
    rotation?: number;
    opacity?: number; // 0-1
}

// Basic style properties for CSS conversion
export interface StyleProperties{
    fill?: string; // Background Color
    stroke?: string; // Border Color
    strokeWidth?: number; // Border width in px
    borderRadius?: number; // Corner radius in px
    shadow?: {
        x: number;
        y: number;
        blur: number;
        color: string;
    };
}

// Rectangle/frame object
export interface RectangleObject extends BaseDesignObject{
    type: 'rectangle' | 'frame';
    style: StyleProperties;
}

// Text object
export interface TextObject extends BaseDesignObject{
    type: 'text';
    content: string;
    style: StyleProperties & {
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: number;
        textAlign?: 'left' | 'center' | 'right';
    };
}

// Arrow-specified style
export interface ArrowStyle extends Pick<StyleProperties, 'stroke' | 'strokeWidth'>{
    arrowHeadSize?: number
}

// Arrow object
export interface ArrowObject extends BaseDesignObject{
    type: 'arrow';
    points: { x: number; y: number; }[];
    style: ArrowStyle;
}

export type DesignObject = RectangleObject | TextObject | ArrowObject;

export interface CanvasState{
    objects: DesignObject[]; // All objects on the canvas
    selectedIds: string[]; // Currently selected object IDs
    zoom: number; // canvas zoom level
    pan: { x:number; y:number; } // canvas pan offset
}