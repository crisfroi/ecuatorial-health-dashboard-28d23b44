import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { FileText, User } from 'lucide-react';

interface PDFSummaryProps {
  formData: any;
}

const PDFSummary = ({ formData }: PDFSummaryProps) => {
  return (
    <div className="space-y-2"> {/* Reducido de space-y-4 a space-y-2 */}
      <div className="bg-white p-4 space-y-3" style={{ minHeight: '297mm' }}> {/* Reducido de p-6 a p-4 y space-y-4 a space-y-3 */}
        {/* Encabezado oficial */}
        <div className="text-center border-b-2 border-gray-300 pb-3 mb-3"> {/* Reducido pb-4 mb-4 a pb-3 mb-3 */}
          <h1 className="text-lg font-bold text-guinea-teal mb-0.5"> {/* Reducido text-xl a text-lg, mb-1 a mb-0.5 */}
            MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL
          </h1>
          <h2 className="text-sm font-semibold text-gray-700 mb-0.5"> {/* Reducido text-base a text-sm, mb-1 a mb-0.5 */}
            REPÚBLICA DE GUINEA ECUATORIAL
          </h2>
          <h3 className="text-xs font-medium text-gray-600"> {/* Reducido text-sm a text-xs */}
            SOLICITUD DE ACREDITACIÓN PROFESIONAL SANITARIA
          </h3>
          {formData.codigo_expediente && (
            <div className="mt-2"> {/* Reducido mt-3 a mt-2 */}
              <p className="text-xs font-medium text-gray-600 mb-0.5"> {/* Reducido mb-1 a mb-0.5 */}
                Código de Expediente: {formData.codigo_expediente}
              </p>
            </div>
          )}
        </div>

        {/* Layout optimizado: Foto + Datos personales + Código de barras */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4"> {/* Reducido gap-4 a gap-3, mb-6 a mb-4 */}
          {/* Foto carnet */}
          <div className="flex flex-col items-center space-y-2"> {/* Reducido space-y-3 a space-y-2 */}
            {formData.foto_carnet_base64 && (
              <div className="w-24 h-32 border-2 border-gray-300 rounded overflow-hidden"> {/* Reducido w-28 h-36 a w-24 h-32 */}
                <img
                  src={formData.foto_carnet_base64}
                  alt="Foto carnet"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* Código de barras debajo de la foto - CORRECCIÓN APLICADA AQUÍ */}
            {formData.codigo_barras_base64 ? (
              <div className="flex flex-col items-center">
                <img
                  // ⭐ Usamos la Base64 que ya fue descargada e incrustada
                  src={formData.codigo_barras_base64}
                  alt={`Código de Barras: ${formData.codigo_expediente}`}
                  style={{ width: '120px', height: '35px' }}
                  className="mb-0.5 object-contain"
                />
                <p className="text-xs text-gray-600 text-center">Código de Barras</p>
              </div>
            ) : formData.url_codigo_barras_expediente ? (
              // Fallback a URL antigua con manejador de error (menos fiable en PDF)
              <div className="flex flex-col items-center">
                <img
                  src={formData.url_codigo_barras_expediente}
                  alt={`Código de Barras: ${formData.codigo_expediente}`}
                  style={{ width: '120px', height: '35px' }}
                  className="mb-0.5 object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <p className="text-xs text-gray-600 text-center">Código de Barras</p>
              </div>
            ) : null}
          </div>

          {/* Datos personales básicos */}
          <div className="md:col-span-2 space-y-1.5"> {/* Reducido space-y-2 a space-y-1.5 */}
            <h4 className="font-semibold text-base text-gray-800 mb-2">Datos Personales</h4> {/* Reducido mb-3 a mb-2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs"> {/* Reducido gap-2 a gap-1.5 */}
              <div><strong>Nombre completo:</strong> {formData.nombre} {formData.apellidos}</div>
              <div><strong>Género:</strong> {formData.genero}</div>
              <div><strong>Fecha de nacimiento:</strong> {formData.fecha_nacimiento}</div>
              <div><strong>Edad:</strong> {formData.edad} años</div>
              <div><strong>Nacionalidad:</strong> {formData.nacionalidad}</div>
              <div><strong>Teléfono:</strong> {formData.telefono}</div>
              {formData.numero_dip && <div><strong>Número DIP:</strong> {formData.numero_dip}</div>}
              {formData.numero_pasaporte && <div><strong>Número Pasaporte:</strong> {formData.numero_pasaporte}</div>}
            </div>
          </div>
        </div>

        {/* Información de domicilio */}
        <Card className="mb-2"> {/* Reducido mb-4 a mb-2 */}
          <CardHeader className="py-2 px-3"> {/* Reducido py-3 px-4 a py-2 px-3 */}
            <CardTitle className="text-sm">Información de Domicilio</CardTitle> {/* Reducido text-base a text-sm */}
          </CardHeader>
          <CardContent className="pt-1.5 px-3 pb-3"> {/* Reducido pt-2 px-4 pb-4 a pt-1.5 px-3 pb-3 */}
            <div className="grid grid-cols-2 gap-1.5 text-xs"> {/* Reducido gap-2 a gap-1.5 */}
              <div><strong>Domicilio:</strong> {formData.domicilio}</div>
              <div><strong>Provincia:</strong> {formData.provincia}</div>
              <div><strong>Distrito:</strong> {formData.distrito}</div>
            </div>
          </CardContent>
        </Card>

        {/* Información profesional */}
        <Card className="mb-2"> {/* Reducido mb-4 a mb-2 */}
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Información Profesional</CardTitle>
          </CardHeader>
          <CardContent className="pt-1.5 px-3 pb-3">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div><strong>Área profesional:</strong> {formData.area_profesional}</div>
              {formData.especialidad && <div><strong>Especialidad:</strong> {formData.especialidad}</div>}
              <div><strong>Categoría titulación:</strong> {formData.categoria_titulacion}</div>
              <div><strong>Titulación:</strong> {formData.titulacion_especifica_1}</div>
              <div><strong>Institución:</strong> {formData.institucion_1}</div>
              <div><strong>Período formación:</strong> {formData.periodo_formacion}</div>
              <div><strong>País formación:</strong> {formData.pais_formacion_1}</div>
            </div>
          </CardContent>
        </Card>

        {/* Información laboral */}
        <Card className="mb-2">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="pt-1.5 px-3 pb-3">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div><strong>Situación laboral:</strong> {formData.situacion_laboral}</div>
              <div><strong>Centro de trabajo:</strong> {formData.nombre_centro}</div>
              <div><strong>Categoría centro:</strong> {formData.categoria_centro}</div>
              <div><strong>Tipo sector:</strong> {formData.tipo_sector}</div>
              {formData.distrito_sanitario && <div><strong>Distrito sanitario:</strong> {formData.distrito_sanitario}</div>}
              {formData.funcion_publica && (
                <>
                  <div><strong>Función pública:</strong> Sí</div>
                  {formData.estatus_funcionario && (
                    <div><strong>Estatus:</strong> {formData.estatus_funcionario === 'nombrado' ? 'Nombrado' : 'No nombrado'}</div>
                  )}
                  {formData.fecha_nombramiento && (
                    <div><strong>Fecha nombramiento:</strong> {new Date(formData.fecha_nombramiento).toLocaleDateString('es-ES')}</div>
                  )}
                  {formData.estatus_funcionario === 'no_nombrado' && formData.fecha_inicio_trabajo && (
                    <div><strong>Fecha inicio servicio:</strong> {new Date(formData.fecha_inicio_trabajo).toLocaleDateString('es-ES')}</div>
                  )}
                  {formData.numero_funcionario && (
                    <div><strong>Número funcionario:</strong> {formData.numero_funcionario}</div>
                  )}
                </>
              )}
              {formData.pertenece_brigada_medica && (
                <div><strong>Brigada médica:</strong> {formData.tipo_cooperacion}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fecha y firma */}
        <div className="mt-6 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs"><strong>Fecha de solicitud:</strong> {new Date().toLocaleDateString('es-ES')}</p>
              {formData.codigo_expediente && (
                <p className="text-xs"><strong>Código de expediente:</strong> {formData.codigo_expediente}</p>
              )}
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 w-36 mb-0.5"></div>
              <p className="text-xs">Firma del solicitante</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFSummary;