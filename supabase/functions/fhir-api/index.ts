import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // GET /fhir/r4/Patient?identifier=ppi|2500123456
    if (path === '/fhir/r4/Patient' && method === 'GET') {
      const identifier = url.searchParams.get('identifier');
      const name = url.searchParams.get('name');

      if (identifier) {
        const [system, value] = identifier.split('|');
        let query = supabaseClient.from('hosix_pacientes').select('*').eq('activo', true);

        if (system === 'http://hosix.health/ppi' || system === 'ppi') {
          query = query.eq('ppi', value);
        } else if (system === 'http://hosix.health/cedula' || system === 'cedula') {
          query = query.eq('numero_documento', value);
        }

        const { data: patient, error } = await query.single();

        if (error || !patient) {
          return fhirError('Patient not found', 404);
        }

        const fhirPatient = mapDBPatientToFHIR(patient);
        return fhirResponse(fhirPatient);
      }

      if (name) {
        const { data: patients, error } = await supabaseClient
          .from('hosix_pacientes')
          .select('*')
          .eq('activo', true)
          .or(`primer_nombre.ilike.%${name}%,primer_apellido.ilike.%${name}%`)
          .limit(20);

        if (error) {
          return fhirError('Error searching patients', 500);
        }

        const bundle = {
          resourceType: 'Bundle',
          type: 'searchset',
          total: patients?.length || 0,
          entry: (patients || []).map((p: any) => ({
            fullUrl: `http://hosix.health/fhir/Patient/${p.ppi}`,
            resource: mapDBPatientToFHIR(p),
          })),
        };

        return fhirResponse(bundle);
      }

      return fhirError('Missing identifier or name parameter', 400);
    }

    // GET /fhir/r4/Patient/:id
    if (path.startsWith('/fhir/r4/Patient/') && method === 'GET') {
      const patientId = path.split('/').pop();
      const { data: patient, error } = await supabaseClient
        .from('hosix_pacientes')
        .select('*')
        .or(`id.eq.${patientId},ppi.eq.${patientId}`)
        .single();

      if (error || !patient) {
        return fhirError('Patient not found', 404);
      }

      const fhirPatient = mapDBPatientToFHIR(patient);
      return fhirResponse(fhirPatient);
    }

    // GET /fhir/r4/MedicationRequest?subject=Patient/:id
    if (path === '/fhir/r4/MedicationRequest' && method === 'GET') {
      const subject = url.searchParams.get('subject');
      if (!subject) {
        return fhirError('Missing subject parameter', 400);
      }

      const patientId = subject.replace('Patient/', '');
      const { data: prescriptions, error } = await supabaseClient
        .from('hosix_prescripciones' as any)
        .select('*')
        .eq('paciente_id', patientId)
        .eq('estado', 'activa')
        .order('fecha_prescripcion', { ascending: false });

      if (error) {
        return fhirError('Error fetching prescriptions', 500);
      }

      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: prescriptions?.length || 0,
        entry: (prescriptions || []).map((rx: any) => ({
          fullUrl: `http://hosix.health/fhir/MedicationRequest/${rx.id}`,
          resource: mapDBPrescriptionToFHIR(rx),
        })),
      };

      return fhirResponse(bundle);
    }

    // POST /fhir/r4/MedicationRequest
    if (path === '/fhir/r4/MedicationRequest' && method === 'POST') {
      const fhirRx = await req.json();

      if (fhirRx.resourceType !== 'MedicationRequest') {
        return fhirError('Invalid resource type', 400);
      }

      const dbRx = mapFHIRMedicationRequestToDB(fhirRx);
      const { data: prescription, error } = await supabaseClient
        .from('hosix_prescripciones' as any)
        .insert(dbRx)
        .select()
        .single();

      if (error) {
        return fhirError(error.message, 500);
      }

      fhirRx.id = prescription.id;
      return fhirResponse(fhirRx, 201);
    }

    // GET /fhir/r4/Observation?subject=Patient/:id
    if (path === '/fhir/r4/Observation' && method === 'GET') {
      const subject = url.searchParams.get('subject');
      if (!subject) {
        return fhirError('Missing subject parameter', 400);
      }

      const patientId = subject.replace('Patient/', '');
      const { data: observations, error } = await supabaseClient
        .from('hosix_enfermeria_constantes' as any)
        .select('*')
        .eq('paciente_id', patientId)
        .order('fecha_registro', { ascending: false })
        .limit(100);

      if (error) {
        return fhirError('Error fetching observations', 500);
      }

      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: observations?.length || 0,
        entry: (observations || []).map((obs: any) => ({
          fullUrl: `http://hosix.health/fhir/Observation/${obs.id}`,
          resource: mapDBObservationToFHIR(obs),
        })),
      };

      return fhirResponse(bundle);
    }

    return fhirError('Not found', 404);
  } catch (error) {
    return fhirError(error.message, 500);
  }
});

// Helper functions
function fhirResponse(resource: any, status = 200): Response {
  return new Response(JSON.stringify(resource), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/fhir+json',
    },
  });
}

function fhirError(message: string, status: number): Response {
  return fhirResponse(
    {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'processing',
          details: { text: message },
        },
      ],
    },
    status
  );
}

function mapDBPatientToFHIR(patient: any): any {
  return {
    resourceType: 'Patient',
    id: patient.ppi || patient.id,
    identifier: [
      {
        system: 'http://hosix.health/ppi',
        value: patient.ppi,
        use: 'official',
      },
      ...(patient.numero_documento
        ? [
            {
              system: 'http://hosix.health/cedula',
              value: patient.numero_documento,
              use: 'official',
            },
          ]
        : []),
    ],
    name: [
      {
        use: 'official',
        family: [patient.primer_apellido, patient.segundo_apellido].filter(Boolean).join(' '),
        given: [patient.primer_nombre, patient.segundo_nombre].filter(Boolean),
      },
    ],
    telecom: [
      ...(patient.telefono_movil
        ? [{ system: 'phone', value: patient.telefono_movil, use: 'mobile' }]
        : []),
      ...(patient.email ? [{ system: 'email', value: patient.email, use: 'work' }] : []),
    ],
    gender: patient.sexo?.toLowerCase(),
    birthDate: patient.fecha_nacimiento
      ? new Date(patient.fecha_nacimiento).toISOString().split('T')[0]
      : undefined,
    address: [
      {
        use: 'home',
        type: 'physical',
        line: patient.direccion ? [patient.direccion] : undefined,
        city: patient.ciudad,
        state: patient.provincia,
        postalCode: patient.codigo_postal,
        country: patient.pais || 'GQ',
      },
    ],
    active: patient.activo !== false,
    meta: {
      lastUpdated: patient.updated_at || patient.created_at,
      source: '#hosix-fhir-api',
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
  };
}

function mapDBPrescriptionToFHIR(prescription: any): any {
  return {
    resourceType: 'MedicationRequest',
    id: prescription.id,
    status: prescription.estado === 'activa' ? 'active' : 'stopped',
    intent: 'order',
    priority: prescription.urgente ? 'urgent' : 'routine',
    medicationCodeableConcept: {
      text: prescription.medicamento_texto || 'Medicamento',
    },
    subject: {
      reference: `Patient/${prescription.paciente_id}`,
    },
    authoredOn: prescription.fecha_prescripcion,
    dosageInstruction: [
      {
        text: `${prescription.dosis || ''} ${prescription.frecuencia || ''} ${prescription.via_administracion || ''}`.trim(),
        route: prescription.via_administracion
          ? {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
                  display: prescription.via_administracion,
                },
              ],
            }
          : undefined,
      },
    ],
    meta: {
      lastUpdated: prescription.updated_at || prescription.created_at,
      source: '#hosix-fhir-api',
    },
  };
}

function mapFHIRMedicationRequestToDB(fhirRx: any): any {
  const subjectId = fhirRx.subject?.reference?.replace('Patient/', '');
  const dosage = fhirRx.dosageInstruction?.[0];

  return {
    paciente_id: subjectId,
    medicamento_texto: fhirRx.medicationCodeableConcept?.text,
    dosis: dosage?.doseQuantity?.value?.toString() || dosage?.text,
    frecuencia: dosage?.timing?.repeat
      ? `${dosage.timing.repeat.frequency}x al día`
      : undefined,
    via_administracion: dosage?.route?.coding?.[0]?.display || dosage?.route?.text,
    fecha_prescripcion: fhirRx.authoredOn || new Date().toISOString(),
    estado: fhirRx.status === 'active' ? 'activa' : 'suspendida',
    urgente: fhirRx.priority === 'urgent',
  };
}

function mapDBObservationToFHIR(observation: any): any {
  return {
    resourceType: 'Observation',
    id: observation.id,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '85354-9',
          display: 'Blood pressure panel',
        },
      ],
    },
    subject: {
      reference: `Patient/${observation.paciente_id}`,
    },
    effectiveDateTime: observation.fecha_registro,
    valueQuantity: observation.tension_arterial_sistolica
      ? {
          value: observation.tension_arterial_sistolica,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]',
        }
      : undefined,
    meta: {
      lastUpdated: observation.updated_at || observation.created_at,
      source: '#hosix-fhir-api',
    },
  };
}

