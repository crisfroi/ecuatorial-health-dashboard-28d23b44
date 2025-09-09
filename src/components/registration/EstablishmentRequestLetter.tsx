import React from "react";

interface EstablishmentRequestLetterProps {
  solicitud: {
    nombre_establecimiento: string;
    categoria: string;
    tipo_servicio: string;
    provincia: string;
    distrito_sanitario?: string | null;
    direccion: string;
    director_responsable?: string | null;
    telefono?: string | null;
    email?: string | null;
    personal_apertura?: { categorias?: Record<string, number>; personas?: { nombre: string; telefono: string; categoria?: string }[] } | null;
    asesor_tecnico?: { nombre?: string; telefono?: string; formacion?: string } | null;
    fecha_solicitud?: string | null;
    numero_solicitud?: string | null;
  };
}

const EstablishmentRequestLetter: React.FC<EstablishmentRequestLetterProps> = ({ solicitud }) => {
  const today = new Date().toLocaleDateString('es-ES');
  const personas = solicitud.personal_apertura?.personas || [];
  const categorias = solicitud.personal_apertura?.categorias || {};

  return (
    <div id="establishment-request-letter" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '15mm 20mm', minHeight: '297mm', fontSize: '11px', lineHeight: 1.4 }}>
      <div className="text-center mb-4">
        <h1 className="text-base font-bold mb-0.5">REPÚBLICA DE GUINEA ECUATORIAL</h1>
        <h2 className="text-sm font-semibold">MINISTERIO DE SANIDAD, BIENESTAR SOCIAL E INFRAESTRUCTURAS SANITARIAS</h2>
        <div className="border-b-2 border-black mt-2 mb-3" />
      </div>

      <div className="text-right mb-4">
        <p className="text-sm">Malabo, {solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES') : today}</p>
      </div>

      <div className="mb-3">
        <p className="font-semibold text-sm">AL SEÑOR MINISTRO DE SANIDAD, BIENESTAR SOCIAL E INFRAESTRUCTURAS SANITARIAS</p>
        <p className="text-sm">REPÚBLICA DE GUINEA ECUATORIAL</p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">ASUNTO:</span> Solicitud de Alta de Establecimiento Sanitario
        </p>
      </div>

      <div className="mb-5 space-y-3 text-justify">
        <p>
          Yo, <span className="font-semibold">{solicitud.director_responsable || '________________'}</span>, en calidad de responsable del establecimiento
          <span className="font-semibold"> {solicitud.nombre_establecimiento}</span>, ubicado en <span className="font-semibold">{solicitud.direccion}</span>,
          provincia de <span className="font-semibold">{solicitud.provincia}</span>
          {solicitud.distrito_sanitario ? <> (Distrito Sanitario <span className="font-semibold">{solicitud.distrito_sanitario}</span>)</> : null},
          respetuosamente solicito la autorización de apertura del referido establecimiento de categoría <span className="font-semibold">{solicitud.categoria}</span>
          en el sector <span className="font-semibold">{solicitud.tipo_servicio}</span>.
        </p>

        <p>
          Para la puesta en marcha, se presenta el plan de personal de apertura:
        </p>

        <ul className="list-disc ml-6">
          {Object.keys(categorias).length > 0 ? (
            Object.entries(categorias).map(([k,v]) => (
              <li key={k}>
                {k}: <span className="font-semibold">{v as number}</span>
              </li>
            ))
          ) : (
            <li>—</li>
          )}
        </ul>

        {personas.length > 0 && (
          <div>
            <p className="mt-2">Relación de personal propuesto (nombres y teléfonos):</p>
            <table className="w-full text-xs mt-1" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>Nombre</th>
                  <th style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>Teléfono</th>
                  <th style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>Categoría</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((p, i) => (
                  <tr key={i}>
                    <td>{p.nombre}</td>
                    <td>{p.telefono}</td>
                    <td>{p.categoria || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3">
          Además, se identifica como asesor técnico a <span className="font-semibold">{solicitud.asesor_tecnico?.nombre || '________________'}</span>
          {solicitud.asesor_tecnico?.formacion ? <> (formación: <span className="font-semibold">{solicitud.asesor_tecnico.formacion}</span>)</> : null}
          {solicitud.asesor_tecnico?.telefono ? <> con teléfono <span className="font-semibold">{solicitud.asesor_tecnico.telefono}</span></> : null}.
        </p>

        <p>
          Sin otro particular, y en espera de su aprobación, se firma la presente para los fines consiguientes.
        </p>
      </div>

      <div className="mt-10">
        <p>Atentamente,</p>
        <p className="mt-8 font-semibold">{solicitud.director_responsable || '________________'}</p>
        <p className="text-sm">Director/Responsable</p>
        {solicitud.telefono && <p className="text-sm">Tel: {solicitud.telefono}</p>}
        {solicitud.email && <p className="text-sm">Email: {solicitud.email}</p>}
      </div>
    </div>
  );
};

export default EstablishmentRequestLetter;
