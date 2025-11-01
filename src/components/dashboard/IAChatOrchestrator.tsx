// @ts-nocheck
// SISTEMA DE IA SUPERINTELIGENTE - REEMPLAZADO POR SuperAIChatMaster
import SuperAIChatMaster from './SuperAIChatMaster';

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface NavigationSuggestion {
  type: "navigate";
  tab: string;
  label: string;
  filters?: Record<string, any>;
}

interface IAChatOrchestratorProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
  filters?: Record<string, any>;
}

const IAChatOrchestrator: React.FC<IAChatOrchestratorProps> = ({ onNavigateToTab, filters }) => {
  // Usar el nuevo sistema de IA superinteligente
  return <SuperAIChatMaster onNavigateToTab={onNavigateToTab} filters={filters} />;
};

export default IAChatOrchestrator;
