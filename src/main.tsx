import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/resizeObserverPatch'
import { initializeErrorSuppression } from './utils/errorSuppression'

initializeErrorSuppression()

createRoot(document.getElementById("root")!).render(<App />);
