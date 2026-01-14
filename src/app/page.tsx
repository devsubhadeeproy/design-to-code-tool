'use client';

import { useState } from 'react';
import Canvas from '@/components/canvas/Canvas';
import Toolbar, { Tool } from '@/components/canvas/Toolbar';

export default function Page() {
  const [activeTool, setActiveTool] = useState<Tool>('select');

  return (
    <main className="flex h-screen overflow-hidden bg-slate-50">
      <div className="flex-1 relative">
        <Canvas />
      </div>
    </main>
  );
}
