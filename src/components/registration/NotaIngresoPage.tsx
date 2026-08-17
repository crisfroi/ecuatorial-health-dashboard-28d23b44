import React from 'react';

export interface NotaIngresoData {
  numero_nota?: string | null;
  tipo_solicitud?: string | null;
  concepto_descripcion?: string | null;
  monto?: number | string | null;
  moneda?: string | null;
  cuenta_tesoreria?: string | null;
  beneficiario_nombre?: string | null;
  beneficiario_documento?: string | null;
  hash?: string | null;
  algoritmo?: string | null;
  created_at?: string | null;
}

interface Props { data?: NotaIngresoData | null; codigoExpediente?: string | null; }

const NotaIngresoPage = ({ data, codigoExpediente }: Props) => {
  const monto = data?.monto == null ? 'Pendiente de configuración' : `${Number(data.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${data.moneda || 'XAF'}`;
  const fecha = data?.created_at ? new Date(data.created_at).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

  return (
    <div className="pdf-page bg-white w-[210mm] min-h-[297mm] box-border px-[18mm] py-[16mm] text-[#17343b]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <header className="border-b-2 border-[#16859a] pb-5">
        <div className="text-center">
          <div className="text-[15px] font-bold tracking-wide">REPÚBLICA DE GUINEA ECUATORIAL</div>
          <div className="text-[17px] font-bold text-[#0d7085] mt-1">MINISTERIO DE SANIDAD E INFRAESTRUCTURAS SANITARIAS</div>
          <div className="text-[24px] font-extrabold tracking-[2px] mt-4">NOTA DE INGRESO</div>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-5 mt-7">
        <div><div className="text-[11px] font-bold text-[#55717a]">N.º DE NOTA</div><div className="mt-1 border border-[#b8d0d5] rounded px-3 py-3 text-[17px] font-bold">{data?.numero_nota || 'PENDIENTE'}</div></div>
        <div><div className="text-[11px] font-bold text-[#55717a]">FECHA</div><div className="mt-1 border border-[#b8d0d5] rounded px-3 py-3 text-[17px]">{fecha}</div></div>
      </div>
      <section className="mt-7 border border-[#c6dfe3] rounded-lg overflow-hidden">
        <div className="bg-[#f4fafb] px-4 py-3 font-bold text-[14px]">DATOS DEL INGRESO</div>
        <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-5 text-[13px]">
          <div><b>Beneficiario</b><div className="mt-1">{data?.beneficiario_nombre || '—'}</div></div>
          <div><b>Documento</b><div className="mt-1">{data?.beneficiario_documento || '—'}</div></div>
          <div><b>Concepto</b><div className="mt-1">{data?.concepto_descripcion || 'Registro de Profesional Sanitario'}</div></div>
          <div><b>Tipo de solicitud</b><div className="mt-1">{data?.tipo_solicitud || 'Profesional sanitario'}</div></div>
          <div><b>Cuenta de Tesorería</b><div className="mt-1">{data?.cuenta_tesoreria || 'Pendiente de configuración ministerial'}</div></div>
          <div><b>Importe</b><div className="mt-1 text-[18px] font-bold text-[#0d7085]">{monto}</div></div>
        </div>
      </section>
      <section className="mt-7 border border-[#c6dfe3] rounded-lg p-5">
        <div className="text-[12px] font-bold text-[#55717a]">REFERENCIA DEL EXPEDIENTE</div>
        <div className="mt-2 text-[18px] font-mono font-bold">{codigoExpediente || '—'}</div>
        <div className="mt-5 text-[12px] leading-6 text-[#55717a]">Esta nota de ingreso queda vinculada electrónicamente al expediente y a la solicitud que origina el ingreso.</div>
      </section>
      <section className="mt-8 border-2 border-[#16859a] rounded-lg p-5">
        <div className="text-[13px] font-bold text-[#0d7085]">VERIFICACIÓN Y TRAZABILIDAD</div>
        <div className="mt-3 grid grid-cols-2 gap-5 text-[12px]"><div><span className="font-bold">Algoritmo:</span> {data?.algoritmo || 'SHA-256'}</div><div><span className="font-bold">Estado:</span> Generada electrónicamente</div></div>
        <div className="mt-4"><div className="text-[10px] font-bold text-[#55717a]">HASH DE LA NOTA</div><div className="mt-1 break-all font-mono text-[10px] leading-5">{data?.hash || 'Pendiente de generación'}</div></div>
      </section>
      <div className="mt-10 flex items-end justify-between"><div className="text-[11px] text-[#55717a] leading-5">Documento oficial de Tesorería<br/>Guinea Ecuatorial Salud</div><div className="w-[62mm] h-[25mm] border border-dashed border-[#8fb5bd] rounded flex items-center justify-center text-center text-[10px] text-[#55717a]">SELLO / VALIDACIÓN<br/>DE TESORERÍA</div></div>
    </div>
  );
};

export default NotaIngresoPage;
