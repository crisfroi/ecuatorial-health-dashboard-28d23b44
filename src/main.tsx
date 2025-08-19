import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeErrorSuppression } from './utils/errorSuppression'

// Initialize enhanced error suppression for ResizeObserver and related issues
initializeErrorSuppression();

createRoot(document.getElementById("root")!).render(<App />);
