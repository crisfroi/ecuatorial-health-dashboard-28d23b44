import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface PoliticasModalProps {
  open: boolean;
  onClose: () => void;
}

const PoliticasModal = ({ open, onClose }: PoliticasModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">POLÍTICA DE PRIVACIDAD Y USO DE DATOS DEL REGISTRO NACIONAL DE PROFESIONALES SANITARIOS</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh] pr-2 space-y-4 text-sm leading-6">
          <p>
            <strong>Te damos la bienvenida a Dominios perfectos.</strong><br />
            Valoramos tu privacidad y nos comprometemos a proteger tu información personal.
          </p>
          <p>
            <strong>La presente Política de Privacidad tiene como finalidad informar a los usuarios solicitantes</strong> del tratamiento que se dará a sus datos personales conforme a la normativa vigente en materia de protección de datos, incluyendo las disposiciones aplicables en la República de Guinea Ecuatorial y los principios internacionales de buena práctica.
          </p>
          <p>Lee atentamente esta política para comprender nuestros puntos de vista y prácticas en relación con tus datos personales y cómo los trataremos.</p>

          <h3 className="font-bold mt-4">1. IDENTIDAD DEL RESPONSABLE DEL TRATAMIENTO</h3>
          <p>El tratamiento de los datos personales será realizado por el Ministerio de Sanidad, Bienestar Social e Infraestructuras Sanitarias de Guinea Ecuatorial, actuando como responsable de la gestión del <strong>Registro Nacional de Profesionales Sanitarios</strong> y de la emisión de carnets profesionales.</p>

          <h3 className="font-bold">2. FINALIDAD DEL TRATAMIENTO</h3>
          <ul className="list-disc pl-5">
            <li>Gestionar el proceso de inscripción, verificación y aprobación del solicitante como profesional sanitario.</li>
            <li>Emitir el carnet profesional sanitario con validez oficial.</li>
            <li>Validar la información con entidades sanitarias, educativas y administrativas nacionales competentes.</li>
            <li>Registrar, clasificar y conservar los expedientes en una base de datos centralizada de profesionales del sector salud.</li>
            <li>Enviar notificaciones relativas al estado del trámite o actualizaciones normativas.</li>
            <li>Elaborar estadísticas institucionales sobre el personal sanitario (con fines de planificación, investigación y gestión pública).</li>
          </ul>

          <h3 className="font-bold">3. LEGITIMACIÓN</h3>
          <p>
            El tratamiento de los datos personales se realiza sobre la base del <strong>consentimiento libre, informado e inequívoco del solicitante</strong>, así como en cumplimiento de la Ley Ministerial <strong>Resolución Ministerial Nº 07/2025</strong> y la Ley 1/2016, de 22 de julio, de Protección de Datos Personales de la República de Guinea Ecuatorial.
          </p>

          <h3 className="font-bold">4. PLAZO DE CONSERVACIÓN</h3>
          <p>Los datos serán conservados durante el tiempo necesario para cumplir con las finalidades anteriormente descritas y mientras subsista la condición de profesional sanitario registrado, y en cumplimiento de los plazos legales de conservación administrativa.</p>

          <h3 className="font-bold">5. DESTINATARIOS</h3>
          <p>Los datos podrán ser compartidos únicamente con:</p>
          <ul className="list-disc pl-5">
            <li>Ministerios competentes en materia de salud, educación y administración pública.</li>
            <li>Instituciones sanitarias autorizadas del país.</li>
            <li>Órganos de fiscalización, a efectos de control y auditoría.</li>
            <li>Entidades nacionales de estadística o investigación pública, en forma anonimizada.</li>
          </ul>
          <p>En ningún caso los datos serán vendidos, cedidos ni utilizados con fines comerciales.</p>

          <h3 className="font-bold">6. DERECHOS DE LOS TITULARES</h3>
          <p>Las personas titulares de los datos pueden ejercer en cualquier momento los siguientes derechos:</p>
          <ul className="list-disc pl-5">
            <li>Derecho de acceso, rectificación, cancelación y oposición (ARCO).</li>
            <li>Derecho a solicitar la portabilidad o eliminación de sus datos cuando proceda.</li>
            <li>Derecho a retirar el consentimiento otorgado sin efectos retroactivos.</li>
          </ul>
          <p>Las solicitudes deberán presentarse mediante formulario físico o digital dirigido a <strong>[correo electrónico de contacto o dependencia encargada]</strong>, adjuntando copia del documento de identidad.</p>

          <h3 className="font-bold">7. MEDIDAS DE SEGURIDAD</h3>
          <p>Se han implementado medidas técnicas, organizativas y administrativas adecuadas para garantizar la confidencialidad, integridad y disponibilidad de los datos personales, previniendo el acceso no autorizado o el uso indebido.</p>

          <h3 className="font-bold">8. ACTUALIZACIONES</h3>
          <p>Esta política podrá ser actualizada en función de cambios normativos, tecnológicos o institucionales. Toda modificación será debidamente comunicada en los medios oficiales de la entidad.</p>

          <p className="font-semibold">Al enviar el formulario de solicitud, el usuario acepta expresamente los términos aquí establecidos y autoriza el tratamiento de sus datos personales conforme a esta política.</p>

          <h3 className="font-bold">CONTACTA CON NOSOTROS</h3>
          <p><strong>Correo electrónico:</strong> <a href="mailto:soporte@dominiosperfectos.com" className="text-blue-600 underline">contacto@guineasalud.com</a></p>
          <p><strong>Dirección:</strong> Calle Ray Malabo, Malabo, Guinea Ecuatorial</p>
          <p><strong>Fecha de entrada en vigor:</strong> 14 de Junio de 2025</p>
        </ScrollArea>
        <div className="mt-4 text-right">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PoliticasModal;
