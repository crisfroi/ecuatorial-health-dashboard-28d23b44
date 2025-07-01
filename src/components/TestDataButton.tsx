
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createTestData } from '@/utils/testData';
import { UserPlus } from 'lucide-react';

const TestDataButton = () => {
  const { toast } = useToast();

  const handleCreateTestData = async () => {
    try {
      await createTestData();
      toast({
        title: "Datos de prueba creados",
        description: "Se han registrado 3 profesionales ficticios exitosamente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error creating test data:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear los datos de prueba. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleCreateTestData}
      variant="outline"
      className="flex items-center space-x-2 bg-guinea-light-teal hover:bg-guinea-teal hover:text-white"
    >
      <UserPlus className="w-4 h-4" />
      <span>Crear Datos de Prueba</span>
    </Button>
  );
};

export default TestDataButton;
