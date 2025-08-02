import React from 'react';
import { Button } from "@/components/ui/button";
import { useUpdateAccreditation } from "@/hooks/useUpdateAccreditation";

const PublicSearch = () => {
  const updateAccreditationMutation = useUpdateAccreditation();

  const handleUpdateAccreditation = () => {
    updateAccreditationMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      
      <Button 
        onClick={handleUpdateAccreditation}
        disabled={updateAccreditationMutation.isPending}
      >
        {updateAccreditationMutation.isPending ? 'Actualizando...' : 'Actualizar Acreditación'}
      </Button>

    </div>
  );
};

export default PublicSearch;
