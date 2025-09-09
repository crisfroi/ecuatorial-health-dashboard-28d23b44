import React from "react";

interface EstablishmentApprovalResolutionProps {
  solicitud: {
    nombre_establecimiento: string;
    categoria: string;
    tipo_servicio: string;
    provincia: string;
    distrito_sanitario?: string | null;
    direccion: string;
    numero_solicitud?: string | null;
    numero_registro?: string | null;
    fecha_autorizacion?: string | null;
  };
}

const EstablishmentApprovalResolution: React.FC<EstablishmentApprovalResolutionProps> = ({ solicitud }) => {
  const fecha = solicitud.fecha_autorizacion ? new Date(solicitud.fecha_autorizacion).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

  return (
    <div id="establishment-approval-resolution" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '15mm 20mm', minHeight: '297mm', fontSize: '11px', lineHeight: 1.4 }}>
      <div className="text-center mb-4">
        <h1 className="text-base font-bold mb-0.5">REPÚBLICA DE GUINEA ECUATORIAL</h1>
        <h2 className="text-sm font-semibold">MINISTERIO DE SANIDAD, BIENESTAR SOCIAL E INFRAESTRUCTURAS SANITARIAS</h2>
        <div className="border-b-2 border-black mt-2 mb-3" />
      </div>

      <div className="text-right mb-4">
        <p className="text-sm">Malabo, {fecha}</p>
      </div>

      <div className="mb-3">
        <p className="font-semibold text-sm">RESOLUCIÓN MINISTERIAL</p>
        <p className="text-sm">Por la que se autoriza el alta del establecimiento sanitario</p>
      </div>

      <div className="mb-5 space-y-3 text-justify">
        <p>
          Vista la solicitud {solicitud.numero_solicitud ? <>número <span className="font-semibold">{solicitud.numero_solicitud}</span></> : null} presentada para la apertura del establecimiento
          <span className="font-semibold"> {solicitud.nombre_establecimiento}</span>, sito en <span className="font-semibold">{solicitud.direccion}</span>, provincia de <span className="font-semibold">{solicitud.provincia}</span>
          {solicitud.distrito_sanitario ? <> (Distrito Sanitario <span className="font-semibold">{solicitud.distrito_sanitario}</span>)</> : null},
          y considerando que cumple con los requisitos establecidos por la normativa vigente,
          el Ministerio de Sanidad, Bienestar Social e Infraestructuras Sanitarias
          RESUELVE autorizar el alta del referido establecimiento de categoría <span className="font-semibold">{solicitud.categoria}</span> en el sector <span className="font-semibold">{solicitud.tipo_servicio}</span>.
        </p>

        <p>
          Con la presente se hace constar {solicitud.numero_registro ? <>el número de registro <span className="font-semibold">{solicitud.numero_registro}</span></> : 'el registro correspondiente'} del establecimiento, a los efectos legales oportunos.
        </p>

        <p>
          Notifíquese al interesado y archívese.
        </p>
      </div>

      <div className="mt-10">
        <p className="font-semibold">EL MINISTRO</p>
        <p className="mt-10">______________________________</p>
      </div>
    </div>
  );
};

export default EstablishmentApprovalResolution;
