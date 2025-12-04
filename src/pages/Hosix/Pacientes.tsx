import React from 'react';
import PacientesList from '@/components/hosix/pacientes/PacientesList';

const PacientesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
        <p className="text-gray-500 mt-1">
          Administre el registro de pacientes y su información clínica
        </p>
      </div>

      <PacientesList />
    </div>
  );
};

export default PacientesPage;
