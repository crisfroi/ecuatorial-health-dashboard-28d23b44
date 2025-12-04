import HosixLayout from '@/components/hosix/HosixLayout';
import UrgenciasWorklist from '@/components/hosix/urgencias/UrgenciasWorklist';

export default function UrgenciasPage() {
  return (
    <HosixLayout>
      <div className="p-8">
        <UrgenciasWorklist />
      </div>
    </HosixLayout>
  );
}
