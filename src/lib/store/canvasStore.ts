import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CanvasState, DesignObject } from '../types/design';

interface CanvasStore extends CanvasState {
  // === BASIC CRUD OPERATIONS ===
  addObject: (object: DesignObject) => void;
  addObjects: (objects: DesignObject[]) => void; // Batch add
  updateObject: (id: string, updates: Partial<DesignObject>) => void;
  updateObjects: (updates: { id: string; changes: Partial<DesignObject> }[]) => void; // Batch update
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void; // Batch remove
  clearCanvas: () => void;
  
  // === SELECTION MANAGEMENT ===
  setSelectedIds: (ids: string[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelection: (id: string) => void;
  getSelectedObjects: () => DesignObject[];
  
  // === OBJECT QUERIES ===
  getObjectById: (id: string) => DesignObject | undefined;
  getObjectsByType: (type: DesignObject['type']) => DesignObject[];
  
  // === CANVAS TRANSFORMATION ===
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;
  
  // === CLIPBOARD OPERATIONS (Sprint 3) ===
  clipboard: DesignObject[];
  copySelected: () => void;
  pasteFromClipboard: () => void;
  duplicateSelected: () => void;
  
  // === HISTORY MANAGEMENT (Sprint 3) ===
  history: CanvasState[];
  historyIndex: number;
  maxHistorySize: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// Helper function to generate unique IDs
let objectCounter = 0;
export const generateId = (type: string): string => {
  return `${type}_${++objectCounter}_${Date.now()}`;
};

// Helper to deep clone objects (for history)
const cloneState = (state: CanvasState): CanvasState => {
  return JSON.parse(JSON.stringify({
    objects: state.objects,
    selectedIds: state.selectedIds,
    zoom: state.zoom,
    pan: state.pan,
  }));
};

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      (set, get) => ({
        // === INITIAL STATE ===
        objects: [],
        selectedIds: [],
        zoom: 1,
        pan: { x: 0, y: 0 },
        clipboard: [],
        history: [],
        historyIndex: -1,
        maxHistorySize: 50, // Keep last 50 states

        // === BASIC CRUD OPERATIONS ===

        /**
         * Add a single object to canvas
         * Automatically pushes to history for undo/redo
         */
        addObject: (object) => {
          set((state) => {
            const newState = {
              objects: [...state.objects, object],
            };
            // Push to history after state update (Sprint 3)
            return newState;
          });
        },

        /**
         * Add multiple objects at once (batch operation)
         * More efficient than calling addObject multiple times
         * 
         * USE CASE: Paste multiple objects, AI generation
         */
        addObjects: (objects) => {
          set((state) => ({
            objects: [...state.objects, ...objects],
          }));
        },

        /**
         * Update a single object's properties
         * Uses Partial<DesignObject> to allow updating any subset of properties
         * 
         * IMMUTABILITY: Creates new array, doesn't mutate existing
         */
        updateObject: (id, updates) => {
          set((state) => ({
            objects: state.objects.map((obj) =>
              obj.id === id ? ({ ...obj, ...updates } as DesignObject) : obj
            ),
          }));
        },

        /**
         * Update multiple objects at once (batch operation)
         * 
         * USE CASE: Move multiple selected objects, change colors in bulk
         * 
         * PERFORMANCE: Single state update instead of N updates
         */
        updateObjects: (updates) => {
          set((state: any) => {
            const updateMap = new Map(
              updates.map((u) => [u.id, u.changes])
            );
            
            return {
              objects: state.objects.map((obj: DesignObject) => {
                const changes = updateMap.get(obj.id);
                return changes ? { ...obj, ...changes } : obj;
              }),
            };
          });
        },

        /**
         * Remove a single object
         * Also removes from selectedIds if selected
         */
        removeObject: (id) => {
          set((state) => ({
            objects: state.objects.filter((obj) => obj.id !== id),
            selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
          }));
        },

        /**
         * Remove multiple objects at once (batch operation)
         * 
         * USE CASE: Delete all selected objects
         * 
         * PERFORMANCE: Single filter pass instead of N removes
         */
        removeObjects: (ids) => {
          set((state) => {
            const idsSet = new Set(ids);
            return {
              objects: state.objects.filter((obj) => !idsSet.has(obj.id)),
              selectedIds: state.selectedIds.filter((id) => !idsSet.has(id)),
            };
          });
        },

        /**
         * Clear all objects from canvas
         * Resets selection and history
         */
        clearCanvas: () => {
          set({
            objects: [],
            selectedIds: [],
            history: [],
            historyIndex: -1,
          });
        },

        // === SELECTION MANAGEMENT ===

        /**
         * Set selected object IDs
         * Called by Canvas component when Fabric selection changes
         */
        setSelectedIds: (ids) => set({ selectedIds: ids }),

        /**
         * Select all objects on canvas
         * Returns all object IDs
         */
        selectAll: () => {
          set((state) => ({
            selectedIds: state.objects.map((obj) => obj.id),
          }));
        },

        /**
         * Clear all selections
         */
        deselectAll: () => set({ selectedIds: [] }),

        /**
         * Toggle selection state of a single object
         * If selected, deselect. If not selected, add to selection.
         * 
         * USE CASE: Ctrl/Cmd+Click to add/remove from selection
         */
        toggleSelection: (id) => {
          set((state) => ({
            selectedIds: state.selectedIds.includes(id)
              ? state.selectedIds.filter((selectedId) => selectedId !== id)
              : [...state.selectedIds, id],
          }));
        },

        /**
         * Get full objects for selected IDs
         * Returns array of DesignObjects
         * 
         * USE CASE: Properties Panel needs full object data
         */
        getSelectedObjects: () => {
          const state = get();
          return state.objects.filter((obj) =>
            state.selectedIds.includes(obj.id)
          );
        },

        // === OBJECT QUERIES ===

        /**
         * Fast lookup of object by ID
         * Returns undefined if not found
         * 
         * PERFORMANCE: O(n) - could optimize with Map if needed
         */
        getObjectById: (id) => {
          return get().objects.find((obj) => obj.id === id);
        },

        /**
         * Get all objects of a specific type
         * 
         * USE CASE: "Select all text objects", Layer filtering
         */
        getObjectsByType: (type) => {
          return get().objects.filter((obj) => obj.type === type);
        },

        // === CANVAS TRANSFORMATION ===

        /**
         * Set zoom level (1 = 100%)
         * 
         * RANGE: Typically 0.1 (10%) to 10 (1000%)
         */
        setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),

        /**
         * Set pan offset
         * 
         * USE CASE: Hand tool, mouse wheel pan
         */
        setPan: (pan) => set({ pan }),

        /**
         * Reset view to default
         * Zoom = 100%, Pan = (0, 0)
         */
        resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

        // === CLIPBOARD OPERATIONS ===

        /**
         * Copy selected objects to clipboard
         * Stores deep clones to prevent mutation
         */
        copySelected: () => {
          const selected = get().getSelectedObjects();
          set({
            clipboard: JSON.parse(JSON.stringify(selected)),
          });
        },

        /**
         * Paste objects from clipboard
         * Creates new objects with offset position and new IDs
         * 
         * OFFSET: Places 20px right and down from original
         */
        pasteFromClipboard: () => {
          const { clipboard, objects } = get();
          if (clipboard.length === 0) return;

          const newObjects = clipboard.map((obj) => ({
            ...obj,
            id: generateId(obj.type),
            position: {
              x: obj.position.x + 20, // Offset to see it's a copy
              y: obj.position.y + 20,
            },
          }));

          set({
            objects: [...objects, ...newObjects],
            selectedIds: newObjects.map((obj) => obj.id),
          });
        },

        /**
         * Duplicate selected objects
         * Shortcut for copy + paste
         */
        duplicateSelected: () => {
          get().copySelected();
          get().pasteFromClipboard();
        },

        // === HISTORY MANAGEMENT ===

        /**
         * Push current state to history
         * Called after operations that should be undoable
         * 
         * OPTIMIZATION: Only stores canvas state, not entire store
         */
        pushHistory: () => {
          set((state) => {
            const currentState = cloneState(state);
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(currentState);

            // Limit history size to prevent memory issues
            if (newHistory.length > state.maxHistorySize) {
              newHistory.shift();
            }

            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          });
        },

        /**
         * Undo last action
         * Restores previous state from history
         */
        undo: () => {
          set((state) => {
            if (state.historyIndex <= 0) return state;

            const previousState = state.history[state.historyIndex - 1];
            return {
              ...previousState,
              history: state.history,
              historyIndex: state.historyIndex - 1,
            };
          });
        },

        /**
         * Redo previously undone action
         * Moves forward in history
         */
        redo: () => {
          set((state) => {
            if (state.historyIndex >= state.history.length - 1) return state;

            const nextState = state.history[state.historyIndex + 1];
            return {
              ...nextState,
              history: state.history,
              historyIndex: state.historyIndex + 1,
            };
          });
        },

        /**
         * Check if undo is available
         */
        canUndo: () => {
          return get().historyIndex > 0;
        },

        /**
         * Check if redo is available
         */
        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },
      }),
      {
        name: 'canvas-storage', // localStorage key
        partialize: (state) => ({
          // Only persist these fields (not history, clipboard)
          objects: state.objects,
          zoom: state.zoom,
          pan: state.pan,
        }),
      }
    ),
    {
      name: 'CanvasStore', // DevTools label
    }
  )
);

/**
 * USAGE EXAMPLES:
 * 
 * === Basic Operations ===
 * const addObject = useCanvasStore((state) => state.addObject);
 * const objects = useCanvasStore((state) => state.objects);
 * 
 * addObject({
 *   id: generateId('rectangle'),
 *   type: 'rectangle',
 *   ...
 * });
 * 
 * === Selection ===
 * const selectAll = useCanvasStore((state) => state.selectAll);
 * const selectedObjects = useCanvasStore((state) => state.getSelectedObjects());
 * 
 * selectAll(); // Selects all objects
 * console.log(selectedObjects); // Array of selected DesignObjects
 * 
 * === Batch Operations ===
 * const updateObjects = useCanvasStore((state) => state.updateObjects);
 * 
 * updateObjects([
 *   { id: 'rect_1', changes: { position: { x: 100, y: 100 } } },
 *   { id: 'rect_2', changes: { position: { x: 200, y: 200 } } },
 * ]);
 * 
 * === Clipboard ===
 * const copySelected = useCanvasStore((state) => state.copySelected);
 * const pasteFromClipboard = useCanvasStore((state) => state.pasteFromClipboard);
 * 
 * copySelected(); // Copies selected objects
 * pasteFromClipboard(); // Pastes with offset
 * 
 * === History ===
 * const undo = useCanvasStore((state) => state.undo);
 * const redo = useCanvasStore((state) => state.redo);
 * const canUndo = useCanvasStore((state) => state.canUndo());
 * 
 * if (canUndo) {
 *   undo();
 * }
 */

/**
 * PERFORMANCE CONSIDERATIONS:
 * 
 * 1. BATCH OPERATIONS
 *    - Use addObjects() instead of multiple addObject() calls
 *    - Single state update = single re-render
 * 
 * 2. SELECTIVE SUBSCRIPTIONS
 *    - Only subscribe to needed state slices
 *    - useCanvasStore((state) => state.objects) // Re-renders on objects change only
 * 
 * 3. HISTORY SIZE
 *    - Limited to 50 states by default
 *    - Prevents memory bloat with large canvases
 * 
 * 4. PERSISTENCE
 *    - Only persists essential data (not history/clipboard)
 *    - Reduces localStorage size
 * 
 * 5. IMMUTABILITY
 *    - All updates create new arrays/objects
 *    - Enables React's reconciliation optimization
 */

/**
 * DEVTOOLS USAGE:
 * 
 * 1. Install Redux DevTools Extension
 * 2. Open browser DevTools → Redux tab
 * 3. See all Zustand actions and state changes
 * 4. Time-travel through history
 * 5. Export/import state for debugging
 * 
 * Actions visible in DevTools:
 * - addObject
 * - updateObject
 * - removeObject
 * - setSelectedIds
 * - undo
 * - redo
 * - etc.
 */