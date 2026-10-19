import { useEffect, useState } from 'react';
import { pdfViewerStore } from '../utils/pdfViewer';

/** アプリ内の PDF ビューが開いているか（開いている間は広告を出さない・App.tsx） */
export function usePdfOpen(): boolean {
  const [open, setOpen] = useState(() => pdfViewerStore.get() !== null);
  useEffect(() => pdfViewerStore.subscribe(d => setOpen(d !== null)), []);
  return open;
}
