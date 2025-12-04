import { HosixLayout } from '@/components/hosix/HosixLayout';
import PacientesList from '@/components/hosix/pacientes/PacientesList';

export default function PacientesPage() {
  return (
    <HosixLayout>
      <div className="p-8">
        <PacientesList />
      </div>
    </HosixLayout>
  );
}
