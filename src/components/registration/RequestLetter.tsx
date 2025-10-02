import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FuncionarioStatus = 'nombrado' | 'no_nombrado';

type NullableString = string | null | undefined;

interface RequestLetterData {
  nombre: string;
  apellidos: string;
  nacionalidad: string;
  numero_dip?: NullableString;
  numero_pasaporte?: NullableString;
  domicilio?: NullableString;
  distrito?: NullableString;
  provincia?: NullableString;
  telefono?: NullableString;
  area_profesional?: NullableString;
  especialidad?: NullableString;
  titulacion_especifica_1?: NullableString;
  institucion_1?: NullableString;
  pais_formacion_1?: NullableString;
  periodo_formacion?: NullableString;
  situacion_laboral?: NullableString;
  funcion_publica?: boolean | null;
  estatus_funcionario?: FuncionarioStatus | null;
  numero_funcionario?: NullableString;
  fecha_nombramiento?: NullableString;
  fecha_inicio_trabajo?: NullableString;
  nombre_centro?: NullableString;
  categoria_centro?: NullableString;
  tipo_sector?: NullableString;
  distrito_sanitario?: NullableString;
  pertenece_brigada_medica?: boolean | null;
  tipo_cooperacion?: NullableString;
}

interface RequestLetterProps {
  formData: RequestLetterData;
}

const formatDateLong = (value?: NullableString) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const removeDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getCenterArticle = (category?: NullableString) => {
  if (!category) return null;
  const normalized = removeDiacritics(category).toUpperCase().trim();
  const feminine = new Set(['CLINICA', 'CLINICAS', 'FARMACIA', 'FARMACIAS']);
  const masculine = new Set([
    'CONSULTORIO',
    'CONSULTORIOS',
    'HOSPITAL',
    'HOSPITALES',
    'CENTRO DE SALUD',
    'CENTROS DE SALUD',
    'LABORATORIO',
    'LABORATORIOS',
  ]);

  if (feminine.has(normalized)) {
    return 'la';
  }
  if (masculine.has(normalized)) {
    return 'el';
  }
  return null;
};

const RequestLetter = ({ formData }: RequestLetterProps) => {
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nombramientoDate = formatDateLong(formData.fecha_nombramiento);
  const inicioTrabajoDate = formatDateLong(formData.fecha_inicio_trabajo);
  const centerArticle = getCenterArticle(formData.categoria_centro);

  const identificacion = formData.numero_dip
    ? `número de DIP ${formData.numero_dip}`
    : formData.numero_pasaporte
      ? `número de pasaporte ${formData.numero_pasaporte}`
      : 'documento de identificación vigente';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Carta de Instancia de Solicitud</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 px-4 pb-4">
          <div
            id="letter-content"
            className="max-w-[210mm] mx-auto bg-white"
            style={{ padding: '15mm 20mm', minHeight: '297mm', fontSize: '10.5px', lineHeight: '1.4' }}
          >
            <div className="text-center mb-4 mt-0">
              <h1 className="text-base font-bold mb-0.5">REPÚBLICA DE GUINEA ECUATORIAL</h1>
              <h2 className="text-sm font-semibold">MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL</h2>
              <div className="border-b-2 border-black mt-2 mb-3" />
            </div>

            <div className="text-right mb-4">
              <p className="text-sm">Malabo, {today}</p>
            </div>

            <div className="mb-3">
              <p className="font-semibold text-sm">AL SEÑOR MINISTRO DE SANIDAD Y BIENESTAR SOCIAL</p>
              <p className="text-sm">REPÚBLICA DE GUINEA ECUATORIAL</p>
              <p className="mt-0.5 text-sm">
                <span className="font-semibold">ASUNTO:</span> Solicitud de Acreditación Profesional Sanitaria
              </p>
            </div>

            <div className="mb-3">
              <p className="text-sm">Muy respetuosamente me dirijo a usted para lo siguiente:</p>
            </div>

            <div className="mb-5 space-y-2.5 text-justify">
              <p>
                Yo, <span className="font-semibold">{formData.nombre} {formData.apellidos}</span>, de nacionalidad{' '}
                <span className="font-semibold">{formData.nacionalidad}</span>, con {identificacion}, con domicilio en{' '}
                <span className="font-semibold">
                  {formData.domicilio}
                  {formData.distrito ? `, ${formData.distrito}` : ''}
                  {formData.provincia ? `, ${formData.provincia}` : ''}
                </span>
                , y teléfono de contacto <span className="font-semibold">{formData.telefono}</span>, me presento ante usted con el debido respeto para solicitar formalmente la{' '}
                <span className="font-semibold">acreditación profesional sanitaria</span> correspondiente a mi área de especialización.
              </p>

              <p>
                Soy profesional en el área de <span className="font-semibold">{formData.area_profesional}</span>
                {formData.especialidad && (
                  <>
                    , con especialización en <span className="font-semibold">{formData.especialidad}</span>
                  </>
                )}
                , habiendo obtenido mi titulación de <span className="font-semibold">{formData.titulacion_especifica_1}</span>{' '}
                en la institución <span className="font-semibold">{formData.institucion_1}</span>{' '}
                en <span className="font-semibold">{formData.pais_formacion_1}</span>, durante el período{' '}
                <span className="font-semibold">{formData.periodo_formacion}</span>.
              </p>

              <p>
                Actualmente, mi situación laboral es <span className="font-semibold">{formData.situacion_laboral}</span>
                {formData.funcion_publica ? (
                  <>
                    , desempeñándome como funcionario público{' '}
                    {formData.estatus_funcionario === 'nombrado' ? (
                      <>
                        nombrado
                        {nombramientoDate && (
                          <>
                            , con nombramiento oficial otorgado en fecha{' '}
                            <span className="font-semibold">{nombramientoDate}</span>
                          </>
                        )}
                        {formData.numero_funcionario && (
                          <>
                            , bajo el número de funcionario{' '}
                            <span className="font-semibold">{formData.numero_funcionario}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        no nombrado
                        {inicioTrabajoDate && (
                          <>
                            , desempeñándome desde el{' '}
                            <span className="font-semibold">{inicioTrabajoDate}</span>
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : null}
                {formData.nombre_centro ? (
                  <>
                    , prestando mis servicios profesionales en{' '}
                    {centerArticle ? `${centerArticle} ` : ''}
                    <span className="font-semibold">{formData.nombre_centro}</span>
                    {formData.categoria_centro && (
                      <>
                        {' '}
                        (categoría: <span className="font-semibold">{formData.categoria_centro}</span>)
                      </>
                    )}
                    {formData.tipo_sector && (
                      <>
                        , perteneciente al sector{' '}
                        <span className="font-semibold">{formData.tipo_sector}</span>
                      </>
                    )}
                    {formData.distrito_sanitario && (
                      <>
                        , correspondiente al{' '}
                        <span className="font-semibold">{formData.distrito_sanitario}</span>
                      </>
                    )}
                  </>
                ) : null}
                .
              </p>

              {formData.pertenece_brigada_medica ? (
                <p>
                  Además, formo parte de una brigada médica de cooperación internacional, específicamente en el tipo de cooperación{' '}
                  <span className="font-semibold">{formData.tipo_cooperacion}</span>, contribuyendo al fortalecimiento del sistema sanitario nacional y a la colaboración internacional en materia de salud.
                </p>
              ) : (
                <p>
                  En la actualidad no integro brigadas médicas de cooperación internacional, manteniendo mis funciones dentro del sistema sanitario nacional.
                </p>
              )}

              <p>
                Mi formación académica en el campo de la salud pública
                {formData.funcion_publica && formData.estatus_funcionario === 'nombrado' && (
                  <> , mi condición de funcionario público nombrado del sistema sanitario nacional,</>
                )}
                {formData.funcion_publica && formData.estatus_funcionario === 'no_nombrado' && (
                  <> , mi participación como personal contratado en el servicio público de salud,</>
                )}{' '}
                y mi firme compromiso con el ejercicio ético y profesional de la medicina me motivan a solicitar esta acreditación oficial, la cual me permitirá continuar contribuyendo al desarrollo del sistema sanitario de Guinea Ecuatorial con la debida autorización y reconocimiento profesional
                {formData.funcion_publica && formData.estatus_funcionario === 'nombrado' && (
                  <> en mi calidad de servidor público de carrera</>
                )}
                {formData.funcion_publica && formData.estatus_funcionario === 'no_nombrado' && (
                  <> en el marco del servicio público sanitario</>
                )}.
              </p>

              <p>
                Adjunto a la presente solicitud toda la documentación requerida para el proceso de evaluación, incluyendo mis certificados académicos, documentos de identificación, fotografía tamaño carnet y cualquier otra documentación que el Ministerio considere necesaria para el procedimiento.
              </p>

              <p>
                Quedo a la espera de una respuesta favorable a mi solicitud y me comprometo a cumplir con todos los requisitos y procedimientos establecidos por el Ministerio de Sanidad y Bienestar Social para el ejercicio profesional en el territorio nacional.
              </p>
            </div>

            <div className="mb-5">
              <p className="text-sm">Sin otro particular, aprovecho la oportunidad para expresarle las muestras de mi más alta consideración y estima.</p>
            </div>

            <div className="text-center">
              <p className="mb-8 text-sm">Atentamente,</p>
              <div className="border-t border-black w-60 mx-auto mb-1" />
              <p className="font-semibold text-sm">{formData.nombre} {formData.apellidos}</p>
              <p className="text-xs">{formData.area_profesional}</p>
              <p className="text-xs">
                {formData.numero_dip ? `DIP: ${formData.numero_dip}` : formData.numero_pasaporte ? `Pasaporte: ${formData.numero_pasaporte}` : ''}
              </p>
              <p className="text-xs">Tel: {formData.telefono}</p>
            </div>

            <div className="mt-6 text-xs text-gray-600 text-center">
              <p>Solicitud generada el {today} a través del Sistema RENAPROSA</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestLetter;
