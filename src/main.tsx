import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { kitchenSignalRService } from './services/kitchenSignalRService'

kitchenSignalRService.connect().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <App />
)