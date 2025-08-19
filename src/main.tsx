import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { suppressResizeObserverErrors } from './utils/resizeObserverSuppress'

// Suppress ResizeObserver loop errors globally
suppressResizeObserverErrors();

createRoot(document.getElementById("root")!).render(<App />);
