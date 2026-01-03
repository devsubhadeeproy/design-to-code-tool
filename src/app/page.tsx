'use client';

import { useState } from 'react';
import Canvas from '@/components/canvas/Canvas';
import Toolbar, { Tool } from '@/components/canvas/Toolbar';

export default function Page() {
  const [activeTool, setActiveTool] = useState<Tool>('select');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-100">
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
      />

      <Canvas />
    </div>
  );
}
