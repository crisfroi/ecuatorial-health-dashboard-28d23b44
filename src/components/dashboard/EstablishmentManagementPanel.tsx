import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ClipboardCheck } from "lucide-react";
import SolicitudesEstablecimientos from "./SolicitudesEstablecimientos";
import EstablishmentInspectionsPanel from "./EstablishmentInspectionsPanel";

interface Props { userRole: string }

export default function EstablishmentManagementPanel({ userRole }: Props) {
  return <Tabs defaultValue="solicitudes" className="space-y-6">
    <TabsList className="grid w-full grid-cols-2 max-w-xl">
      <TabsTrigger value="solicitudes"><FileText className="h-4 w-4 mr-2" />Solicitudes y autorizaciones</TabsTrigger>
      <TabsTrigger value="inspecciones"><ClipboardCheck className="h-4 w-4 mr-2" />Inspecciones</TabsTrigger>
    </TabsList>
    <TabsContent value="solicitudes"><SolicitudesEstablecimientos userRole={userRole} /></TabsContent>
    <TabsContent value="inspecciones"><EstablishmentInspectionsPanel /></TabsContent>
  </Tabs>;
}
