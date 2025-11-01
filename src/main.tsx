import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/resizeObserverPatch'
import { initializeErrorSuppression } from './utils/errorSuppression'

// Inicializaciones existentes
initializeErrorSuppression()

// Renderizado de la aplicación
createRoot(document.getElementById("root")!).render(<App />);
