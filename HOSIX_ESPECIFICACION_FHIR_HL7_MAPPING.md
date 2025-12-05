# HOSIX - Especificación FHIR R4 + HL7 v2.5
## Mapping Completo de Recursos Clínicos

> **Versión**: 1.0  
> **Fecha**: 2025-02-05  
> **Estándar**: FHIR R4 (HL7 FHIR 4.0.1), HL7 v2.5  
> **Objetivo**: Interoperabilidad con sistemas externos (LIS, PACS, e-Receta)

---

## 📋 ÍNDICE

1. [Recursos FHIR Mapeados](#1-recursos-fhir-mapeados)
2. [Patient (Paciente)](#2-patient-paciente)
3. [Encounter (Episodio)](#3-encounter-episodio)
4. [Observation (Observación)](#4-observation-observación)
5. [MedicationRequest (Prescripción)](#5-medicationrequest-prescripción)
6. [DiagnosticReport (Resultado)](#6-diagnosticreport-resultado)
7. [ImagingStudy (Estudio DICOM)](#7-imagingstudy-estudio-dicom)
8. [HL7 v2.5 Messages](#8-hl7-v25-messages)
9. [API Endpoints FHIR](#9-api-endpoints-fhir)
10. [Transformaciones Bidireccionales](#10-transformaciones-bidireccionales)

---

## 1. RECURSOS FHIR MAPEADOS

### Tabla de Recursos Principales

| Recurso FHIR | Tabla HOSIX | Descripción | API Endpoint |
|-------------|------------|-------------|-------------|
| Patient | hosix_pacientes | Datos del paciente | GET/POST /Patient |
| Encounter | hosix_hospitalizacion_episodios | Episodios (consulta, urgencia, hosp) | GET /Encounter |
| Observation | hosix_enfermeria_signos_vitales | Signos vitales, laboratorio, etc | GET /Observation |
| MedicationRequest | hosix_cpoe_prescripciones | Prescripciones electrónicas | POST /MedicationRequest |
| MedicationDispense | hosix_farmacia_dispensaciones | Dispensación de medicamentos | GET /MedicationDispense |
| DiagnosticReport | hosix_laboratorio_resultados | Resultados de laboratorio | GET /DiagnosticReport |
| ImagingStudy | PACS (externo) | Estudios DICOM | GET /ImagingStudy |
| Procedure | hosix_quirofanos_intervenciones | Procedimientos quirúrgicos | GET /Procedure |
| ServiceRequest | hosix_ordenes_medicas | Órdenes clínicas | POST /ServiceRequest |
| Condition | hosix_diagnosticos | Condiciones del paciente | GET /Condition |
| AllergyIntolerance | hosix_pacientes.alergias | Alergias del paciente | GET /AllergyIntolerance |

---

## 2. Patient (Paciente)

### Mapeo HOSIX → FHIR Patient

```json
{
  "resourceType": "Patient",
  "id": "ppi-abc123",
  "identifier": [
    {
      "system": "http://hosix.health/ppi",
      "value": "2500123456"
    },
    {
      "system": "http://hosix.health/cedula",
      "value": "0987654321"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Pérez García",
      "given": ["Juan", "Carlos"],
      "prefix": ["Dr."]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+593999123456",
      "use": "mobile"
    },
    {
      "system": "email",
      "value": "juan.perez@example.com",
      "use": "work"
    }
  ],
  "gender": "male",
  "birthDate": "1985-04-15",
  "address": [
    {
      "use": "home",
      "type": "physical",
      "line": ["Calle Principal 123, Apt 4-B"],
      "city": "Quito",
      "state": "Pichincha",
      "postalCode": "170150",
      "country": "EC"
    }
  ],
  "maritalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
        "code": "M",
        "display": "Married"
      }
    ]
  },
  "contact": [
    {
      "relationship": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
              "code": "N",
              "display": "Next-of-Kin"
            }
          ]
        }
      ],
      "name": {
        "text": "María Pérez (Esposa)"
      },
      "telecom": [
        {
          "system": "phone",
          "value": "+593998765432"
        }
      ]
    }
  ],
  "generalPractitioner": [
    {
      "reference": "Practitioner/med-001",
      "display": "Dr. Luis García"
    }
  ],
  "managingOrganization": [
    {
      "reference": "Organization/hospital-001",
      "display": "Hospital Central"
    }
  ],
  "active": true,
  "meta": {
    "lastUpdated": "2025-02-05T10:30:00Z",
    "source": "#hosix-patient-service",
    "profile": [
      "http://hl7.org/fhir/StructureDefinition/Patient"
    ]
  }
}
```

### Mapeo FHIR → HOSIX Patient (INSERT/UPDATE)

```typescript
// src/lib/fhir/mappers/patient-mapper.ts

export function mapFHIRPatientToDBPatient(
  fhirPatient: FHIR.Patient
): Partial<DBPatient> {
  const nameValue = fhirPatient.name?.[0]
  const phoneValue = fhirPatient.telecom?.find(t => t.system === 'phone')
  const emailValue = fhirPatient.telecom?.find(t => t.system === 'email')
  const addressValue = fhirPatient.address?.[0]
  
  return {
    ppi: fhirPatient.identifier?.find(
      i => i.system === 'http://hosix.health/ppi'
    )?.value,
    numero_documento: fhirPatient.identifier?.find(
      i => i.system === 'http://hosix.health/cedula'
    )?.value,
    primer_nombre: nameValue?.given?.[0],
    segundo_nombre: nameValue?.given?.[1],
    primer_apellido: nameValue?.family?.split(' ')[0],
    segundo_apellido: nameValue?.family?.split(' ')[1],
    fecha_nacimiento: new Date(fhirPatient.birthDate!),
    sexo: fhirPatient.gender?.[0].toUpperCase() as 'M' | 'F' | 'O',
    telefono_movil: phoneValue?.value,
    email: emailValue?.value,
    direccion: addressValue?.line?.join(', '),
    ciudad: addressValue?.city,
    provincia: addressValue?.state,
    codigo_postal: addressValue?.postalCode,
    pais: addressValue?.country || 'EC',
    estado_civil: fhirPatient.maritalStatus?.coding?.[0]?.code,
    activo: fhirPatient.active !== false
  }
}
```

---

## 3. Encounter (Episodio)

### Mapeo HOSIX Urgencias → FHIR Encounter

```json
{
  "resourceType": "Encounter",
  "id": "enc-urg-2025-0001",
  "identifier": [
    {
      "system": "http://hosix.health/encounter-id",
      "value": "2025-0001"
    }
  ],
  "status": "in-progress",
  "statusHistory": [
    {
      "status": "arrived",
      "period": {
        "start": "2025-02-05T08:00:00Z"
      }
    }
  ],
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "EMER",
    "display": "Emergency"
  },
  "type": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "4525004",
          "display": "Emergency department procedure"
        }
      ]
    }
  ],
  "subject": {
    "reference": "Patient/ppi-abc123",
    "display": "Juan Pérez García"
  },
  "episodeOfCare": [
    {
      "reference": "EpisodeOfCare/eoc-2025-001"
    }
  ],
  "basedOn": [
    {
      "reference": "ServiceRequest/sr-lab-2025"
    }
  ],
  "participant": [
    {
      "type": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
              "code": "PPRF",
              "display": "Primary Performer"
            }
          ]
        }
      ],
      "individual": {
        "reference": "Practitioner/med-001",
        "display": "Dr. Luis García"
      }
    },
    {
      "type": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
              "code": "PART",
              "display": "Participant"
            }
          ]
        }
      ],
      "individual": {
        "reference": "Practitioner/enf-001",
        "display": "Lic. María López"
      }
    }
  ],
  "appointment": [
    {
      "reference": "Appointment/appt-2025-001"
    }
  ],
  "period": {
    "start": "2025-02-05T08:00:00Z",
    "end": "2025-02-05T10:30:00Z"
  },
  "reason": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "51344007",
          "display": "Abdominal pain"
        }
      ],
      "text": "Dolor abdominal agudo"
    }
  ],
  "diagnosis": [
    {
      "condition": {
        "reference": "Condition/cond-gastroenteritis"
      },
      "use": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            "code": "AD",
            "display": "Admission diagnosis"
          }
        ]
      },
      "rank": 1
    }
  ],
  "account": [
    {
      "reference": "Account/acc-2025-001"
    }
  ],
  "hospitalization": {
    "admitSource": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/admit-source",
          "code": "emd",
          "display": "From emergency department"
        }
      ]
    },
    "dischargeDisposition": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/discharge-disposition",
          "code": "home",
          "display": "Discharged to home"
        }
      ]
    },
    "destination": {
      "reference": "Location/loc-hospital-central"
    }
  },
  "serviceProvider": {
    "reference": "Organization/org-hospital-central",
    "display": "Hospital Central"
  },
  "meta": {
    "lastUpdated": "2025-02-05T10:30:00Z"
  }
}
```

---

## 4. Observation (Observación)

### Signos Vitales → FHIR Observation

```json
{
  "resourceType": "Observation",
  "id": "obs-vitals-2025-001",
  "identifier": [
    {
      "system": "http://hosix.health/vital-sign-id",
      "value": "vital-20250205-080000"
    }
  ],
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "8480-6",
        "display": "Systolic blood pressure"
      },
      {
        "system": "http://snomed.info/sct",
        "code": "72313002",
        "display": "Systolic arterial pressure"
      }
    ],
    "text": "Presión arterial sistólica"
  },
  "subject": {
    "reference": "Patient/ppi-abc123"
  },
  "encounter": {
    "reference": "Encounter/enc-urg-2025-0001"
  },
  "effectiveDateTime": "2025-02-05T08:30:00Z",
  "issued": "2025-02-05T08:30:00Z",
  "performer": [
    {
      "reference": "Practitioner/enf-001",
      "display": "Lic. María López"
    }
  ],
  "valueQuantity": {
    "value": 138,
    "unit": "mmHg",
    "system": "http://unitsofmeasure.org",
    "code": "mm[Hg]"
  },
  "interpretation": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          "code": "H",
          "display": "High"
        }
      ]
    }
  ],
  "referenceRange": [
    {
      "low": {
        "value": 90,
        "unit": "mmHg"
      },
      "high": {
        "value": 119,
        "unit": "mmHg"
      },
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/referencerange-meaning",
            "code": "normal",
            "display": "Normal Range"
          }
        ]
      },
      "appliesTo": [
        {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "133936004",
              "display": "Adult"
            }
          ]
        }
      ]
    }
  ],
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8462-4",
            "display": "Diastolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 88,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    }
  ],
  "meta": {
    "lastUpdated": "2025-02-05T08:30:00Z"
  }
}
```

### Array de Signos Vitales (Bundle)

```json
{
  "resourceType": "Bundle",
  "id": "bundle-vitals-2025-001",
  "type": "collection",
  "timestamp": "2025-02-05T08:30:00Z",
  "total": 5,
  "entry": [
    {
      "fullUrl": "http://hosix.health/Observation/obs-temp-001",
      "resource": {
        "resourceType": "Observation",
        "id": "obs-temp-001",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "8310-5",
              "display": "Body temperature"
            }
          ]
        },
        "subject": { "reference": "Patient/ppi-abc123" },
        "valueQuantity": {
          "value": 37.5,
          "unit": "°C"
        }
      }
    },
    {
      "fullUrl": "http://hosix.health/Observation/obs-fc-001",
      "resource": {
        "resourceType": "Observation",
        "id": "obs-fc-001",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "8867-4",
              "display": "Heart rate"
            }
          ]
        },
        "subject": { "reference": "Patient/ppi-abc123" },
        "valueQuantity": {
          "value": 78,
          "unit": "lpm"
        }
      }
    }
  ]
}
```

---

## 5. MedicationRequest (Prescripción)

### Prescripción CPOE → FHIR MedicationRequest

```json
{
  "resourceType": "MedicationRequest",
  "id": "rx-2025-001",
  "identifier": [
    {
      "system": "http://hosix.health/prescription-id",
      "value": "RX-2025-001"
    }
  ],
  "status": "active",
  "statusReason": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-status-reason",
        "code": "altchoice",
        "display": "Try another treatment first"
      }
    ]
  },
  "intent": "order",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
          "code": "inpatient",
          "display": "Inpatient"
        }
      ]
    }
  ],
  "medicationReference": {
    "reference": "Medication/med-aspirin-500",
    "display": "Aspirina 500mg"
  },
  "subject": {
    "reference": "Patient/ppi-abc123",
    "display": "Juan Pérez García"
  },
  "encounter": {
    "reference": "Encounter/enc-urg-2025-0001"
  },
  "authoredOn": "2025-02-05T08:45:00Z",
  "requester": {
    "reference": "Practitioner/med-001",
    "display": "Dr. Luis García"
  },
  "reasonCode": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "78650009",
          "display": "Aspirin allergy"
        }
      ],
      "text": "Fiebre y dolor"
    }
  ],
  "priority": "routine",
  "dosageInstruction": [
    {
      "sequence": 1,
      "text": "500mg cada 8 horas",
      "timing": {
        "repeat": {
          "frequency": 3,
          "period": 1.0,
          "periodUnit": "d",
          "dayOfWeek": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        }
      },
      "doseAndRate": [
        {
          "doseQuantity": {
            "value": 500,
            "unit": "mg",
            "system": "http://unitsofmeasure.org",
            "code": "mg"
          }
        }
      ],
      "route": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "26643006",
            "display": "Oral route"
          }
        ]
      },
      "method": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "421521009",
            "display": "Swallow - dosing instruction imperative"
          }
        ]
      }
    }
  ],
  "dispenseRequest": {
    "quantity": {
      "value": 24,
      "unit": "tablets",
      "system": "http://unitsofmeasure.org",
      "code": "{tablets}"
    },
    "expectedSupplyDuration": {
      "value": 8,
      "unit": "days",
      "system": "http://unitsofmeasure.org",
      "code": "d"
    },
    "performer": {
      "reference": "Organization/pharmacy-001",
      "display": "Farmacia Central"
    }
  },
  "substitution": {
    "allowed": true,
    "reason": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ActReason",
          "code": "ECN",
          "display": "Economic"
        }
      ]
    }
  },
  "meta": {
    "lastUpdated": "2025-02-05T08:45:00Z",
    "security": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
        "code": "N",
        "display": "Normal"
      }
    ]
  }
}
```

---

## 6. DiagnosticReport (Resultado)

### Resultado Laboratorio → FHIR DiagnosticReport

```json
{
  "resourceType": "DiagnosticReport",
  "id": "report-lab-2025-001",
  "identifier": [
    {
      "system": "http://hosix.health/lab-report-id",
      "value": "LAB-2025-001"
    }
  ],
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
          "code": "CH",
          "display": "Chemistry"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "24357-6",
        "display": "Glucose [Mass/volume] in Serum or Plasma"
      }
    ],
    "text": "Glucosa en suero"
  },
  "subject": {
    "reference": "Patient/ppi-abc123",
    "display": "Juan Pérez García"
  },
  "encounter": {
    "reference": "Encounter/enc-urg-2025-0001"
  },
  "effectiveDateTime": "2025-02-05T09:00:00Z",
  "issued": "2025-02-05T10:15:00Z",
  "performer": [
    {
      "reference": "Organization/laboratory-001",
      "display": "Laboratorio Central"
    }
  ],
  "specimen": [
    {
      "reference": "Specimen/spec-blood-2025-001",
      "display": "Blood sample"
    }
  ],
  "result": [
    {
      "reference": "Observation/obs-glucose-2025",
      "display": "Glucosa"
    },
    {
      "reference": "Observation/obs-creatinine-2025",
      "display": "Creatinina"
    },
    {
      "reference": "Observation/obs-urea-2025",
      "display": "Urea"
    }
  ],
  "conclusion": "Glucosa elevada (ayuno), función renal normal. Considerar diabetes screening.",
  "conclusionCode": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "250416005",
          "display": "Elevated glucose"
        }
      ]
    }
  ],
  "meta": {
    "lastUpdated": "2025-02-05T10:15:00Z"
  }
}
```

---

## 7. ImagingStudy (Estudio DICOM)

### Integración PACS → FHIR ImagingStudy

```json
{
  "resourceType": "ImagingStudy",
  "id": "img-2025-001",
  "identifier": [
    {
      "system": "urn:dicom:uid",
      "value": "urn:oid:1.2.826.0.1.3680043.8.498.13100413082026141224081231518012"
    }
  ],
  "status": "available",
  "modality": [
    {
      "system": "http://dicom.nema.org/resources/ontology/DCM",
      "code": "CT"
    }
  ],
  "subject": {
    "reference": "Patient/ppi-abc123"
  },
  "encounter": {
    "reference": "Encounter/enc-urg-2025-0001"
  },
  "started": "2025-02-05T11:00:00Z",
  "basedOn": [
    {
      "reference": "ServiceRequest/sr-imaging-2025-001"
    }
  ],
  "referrer": {
    "reference": "Practitioner/med-001",
    "display": "Dr. Luis García"
  },
  "interpreter": [
    {
      "reference": "Practitioner/rad-001",
      "display": "Dr. Radiólogo"
    }
  ],
  "endpoint": [
    {
      "reference": "Endpoint/endpoint-pacs-001"
    }
  ],
  "procedureReference": [
    {
      "reference": "Procedure/proc-ct-scan-2025"
    }
  ],
  "procedureCode": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "77477000",
          "display": "Computerized axial tomography of abdomen"
        }
      ]
    }
  ],
  "reason": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "51344007",
          "display": "Abdominal pain"
        }
      ]
    }
  ],
  "note": [
    {
      "authorString": "Dr. Radiólogo",
      "time": "2025-02-05T11:30:00Z",
      "text": "Estudio sin hallazgos significativos. Órganos intra-abdominales normales. No líquido libre."
    }
  ],
  "series": [
    {
      "uid": "1.2.826.0.1.3680043.8.498.13100413082026141224081231518012.1",
      "number": 1,
      "modality": {
        "system": "http://dicom.nema.org/resources/ontology/DCM",
        "code": "CT"
      },
      "description": "Serie abdominal sin contraste",
      "numberOfInstances": 45,
      "started": "2025-02-05T11:00:00Z",
      "performer": [
        {
          "function": {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                "code": "PRF"
              }
            ]
          },
          "actor": {
            "reference": "Practitioner/tec-001",
            "display": "Técnico en Radiología"
          }
        }
      ],
      "instance": [
        {
          "uid": "1.2.826.0.1.3680043.8.498.13100413082026141224081231518012.1.1",
          "sopClassUid": "1.2.840.10008.5.1.4.1.2",
          "title": "CT Image 1",
          "number": 1,
          "url": "dicom-web://pacs.hosix.com/studies/1.2.826.0.1.3680043.8.498.../series/.../instances/..."
        },
        {
          "uid": "1.2.826.0.1.3680043.8.498.13100413082026141224081231518012.1.2",
          "sopClassUid": "1.2.840.10008.5.1.4.1.2",
          "title": "CT Image 2",
          "number": 2,
          "url": "dicom-web://pacs.hosix.com/studies/.../series/.../instances/..."
        }
      ]
    }
  ]
}
```

---

## 8. HL7 v2.5 Messages

### ORU^R01 - Resultado de Laboratorio

```
MSH|^~\&|LIS|LABCENTRAL|HOSIX|HOSPITAL|20250205101500||ORU^R01|MSG123456|P|2.5
PID|||2500123456||PEREZ^JUAN^CARLOS||19850415|M|||CALLE PRINCIPAL 123^APTO 4B^QUITO^PICHINCHA^170150^EC||0999123456^^^^^C|^juan.perez@example.com|||||EC
OBR|1|LAB2025001|LIS2025001|24357-6^GLUCOSE|||20250205090000|20250205101500
OBX|1|NM|24357-6^GLUCOSE^LN||145|mg/dL|70-100|H|||F
OBX|2|NM|2345-7^CREATININE^LN||0.85|mg/dL|0.7-1.3|N|||F
OBX|3|NM|3094-0^UREA^LN||35|mg/dL|7-20|H|||F
NTE|1||Sin hallazgos significativos excepto glucosa elevada.
```

### ADT^A01 - Admisión/Ingreso Hospitalario

```
MSH|^~\&|HOSIX|HOSPITAL|LIS|LABCENTRAL|20250205120000||ADT^A01|ADT123456|P|2.5
EVN|A01|20250205120000||ADMISSION
PID|||2500123456||PEREZ^JUAN^CARLOS||19850415|M||C|CALLE PRINCIPAL 123^QUITO^PICHINCHA^170150^EC||0999123456|||||S||||||||||EC
PV1|1|I|PISO3^SALA2^CAMA10||||MED001^^^DR^LUIS GARCIA|||||||||||||A|||||||||||||||||||||||||20250205120000
PV2||||||||||||||||||||||||
DG1|1||K29.0^GASTRITIS AGUDA^ICD10|||A
```

### RGV^O15 - Dispensación Farmacéutica

```
MSH|^~\&|HOSIX|HOSPITAL|PHARMACY|FARMACIA|20250205130000||RGV^O15|RGV123456|P|2.5
PID|||2500123456||PEREZ^JUAN^CARLOS
ORC|RE|RX2025001|FARM2025001|||||20250205130000|MED001
RXD|1|||||||||||||||||||||||
RXR|PO|Oral
OBX|1|NM|DOSE||500|MG
OBX|2|ST|FREQ||EVERY 8 HOURS
OBX|3|NM|DURATION||8|DAYS
```

---

## 9. API ENDPOINTS FHIR

### Configuración FHIR Server

```
Base URL: https://api.hosix.com/fhir/r4

Authentication: Bearer <JWT Token>
Content-Type: application/fhir+json
```

### Patient Endpoints

```http
# Búsqueda de paciente por PPI
GET /fhir/r4/Patient?identifier=http://hosix.health/ppi|2500123456
Authorization: Bearer <token>

# Respuesta
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "fullUrl": "https://api.hosix.com/fhir/r4/Patient/ppi-abc123",
      "resource": { ... Patient JSON ... }
    }
  ]
}
```

### Observation Endpoints (Vital Signs)

```http
# Obtener últimos signos vitales de paciente
GET /fhir/r4/Observation?patient=ppi-abc123&category=vital-signs&_sort=-date&_count=10
Authorization: Bearer <token>
Accept: application/fhir+json

# Crear nueva observación (POST)
POST /fhir/r4/Observation
Authorization: Bearer <token>
Content-Type: application/fhir+json

{
  "resourceType": "Observation",
  "code": { "coding": [{ "system": "http://loinc.org", "code": "8480-6" }] },
  "subject": { "reference": "Patient/ppi-abc123" },
  "status": "final",
  "valueQuantity": { "value": 140, "unit": "mmHg" }
}
```

### MedicationRequest Endpoints

```http
# Crear prescripción (CPOE)
POST /fhir/r4/MedicationRequest
Authorization: Bearer <token>
Content-Type: application/fhir+json

{
  "resourceType": "MedicationRequest",
  "status": "active",
  "intent": "order",
  "medicationReference": { "reference": "Medication/med-aspirin-500" },
  "subject": { "reference": "Patient/ppi-abc123" },
  "dosageInstruction": [{ "text": "500mg cada 8 horas" }]
}

# Respuesta
{
  "resourceType": "MedicationRequest",
  "id": "rx-2025-001",
  "status": "active",
  ...
}

# Obtener prescripciones activas
GET /fhir/r4/MedicationRequest?patient=ppi-abc123&status=active
Authorization: Bearer <token>
```

### DiagnosticReport Endpoints

```http
# Obtener resultados de laboratorio
GET /fhir/r4/DiagnosticReport?subject=ppi-abc123&category=CH&_sort=-date
Authorization: Bearer <token>

# Webhook para resultados nuevos (HL7 from LIS)
POST /fhir/r4/DiagnosticReport
Authorization: Bearer <token>
Content-Type: application/fhir+json

{
  "resourceType": "DiagnosticReport",
  "status": "final",
  "category": [{ "coding": [{ "code": "CH" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "24357-6" }] },
  "subject": { "reference": "Patient/ppi-abc123" },
  "result": [ ... observations ... ]
}
```

### ImagingStudy Endpoints

```http
# Obtener estudios DICOM de paciente
GET /fhir/r4/ImagingStudy?patient=ppi-abc123&_sort=-started
Authorization: Bearer <token>

# Crear referencia a estudio DICOM
POST /fhir/r4/ImagingStudy
Authorization: Bearer <token>
Content-Type: application/fhir+json

{
  "resourceType": "ImagingStudy",
  "subject": { "reference": "Patient/ppi-abc123" },
  "status": "available",
  "modality": [{ "system": "http://dicom.nema.org/resources/ontology/DCM", "code": "CT" }],
  "series": [ ... ]
}
```

---

## 10. TRANSFORMACIONES BIDIRECCIONALES

### Pipeline Completo: HOSIX → FHIR → Sistema Externo

```typescript
// src/lib/fhir/transformations.ts

/**
 * Pipeline de transformación completa HOSIX → FHIR → JSON
 */
async function publishPatientToFHIR(patientId: UUID) {
  // 1. Obtener paciente desde HOSIX BD
  const dbPatient = await getPatientFromDB(patientId)
  
  // 2. Mapear a FHIR Patient
  const fhirPatient = mapDBPatientToFHIR(dbPatient)
  
  // 3. Validar contra FHIR spec
  const isValid = validateFHIRResource(fhirPatient)
  if (!isValid) throw new Error('Invalid FHIR Patient')
  
  // 4. Publicar a evento
  await eventBus.emit('PatientPublishedToFHIR', {
    patientId,
    fhirResource: fhirPatient,
    timestamp: new Date()
  })
  
  // 5. Guardar en FHIR store para búsqueda
  await saveFHIRResource(fhirPatient)
  
  // 6. Notificar a consumidores (LIS, PACS, etc)
  await notifyExternalSystems(fhirPatient)
}

/**
 * Pipeline inverso: Sistema Externo → FHIR → HOSIX
 */
async function receiveLabResultFromLIS(hl7Message: string) {
  // 1. Parsear HL7 v2.5
  const parsed = hl7.parse(hl7Message)
  
  // 2. Convertir a FHIR DiagnosticReport
  const fhirReport = convertHL7ToFHIRDiagnosticReport(parsed)
  
  // 3. Validar FHIR
  validateFHIRResource(fhirReport)
  
  // 4. Mapear a BD HOSIX
  const dbReport = mapFHIRDiagnosticReportToDb(fhirReport)
  
  // 5. Guardar en BD
  await saveLaboratoryResult(dbReport)
  
  // 6. Emitir evento para notificaciones
  await eventBus.emit('LabResultReceived', {
    patientId: dbReport.paciente_id,
    resultCode: dbReport.test_code,
    value: dbReport.value,
    timestamp: new Date()
  })
  
  // 7. Alertar si resultado es crítico
  if (isCriticalValue(dbReport)) {
    await notifyPhysician(dbReport)
  }
}
```

### Validación FHIR

```typescript
// src/lib/fhir/validator.ts
import { validate } from 'fhir-validator'

export async function validateFHIRResource(resource: any): Promise<boolean> {
  const result = await validate(resource, {
    version: '4.0.1',
    profile: getProfileURL(resource.resourceType)
  })
  
  if (!result.valid) {
    logger.error('FHIR Validation Error', {
      resourceType: resource.resourceType,
      errors: result.errors
    })
    throw new Error('FHIR validation failed')
  }
  
  return true
}

// Perfiles (StructureDefinition) para validación estricta
const FHIR_PROFILES = {
  'Patient': 'http://hl7.org/fhir/StructureDefinition/Patient',
  'Observation': 'http://hl7.org/fhir/StructureDefinition/Observation',
  'MedicationRequest': 'http://hl7.org/fhir/StructureDefinition/MedicationRequest',
  'DiagnosticReport': 'http://hl7.org/fhir/StructureDefinition/DiagnosticReport',
  'ImagingStudy': 'http://hl7.org/fhir/StructureDefinition/ImagingStudy'
}
```

---

## 11. TERMINOLOGÍA

### Sistemas de Codificación Soportados

| Sistema | URL | Uso | Ejemplos |
|---------|-----|-----|----------|
| LOINC | http://loinc.org | Laboratorio, vitales | 8480-6 (presión sistólica) |
| SNOMED CT | http://snomed.info/sct | Diagnósticos, procedimientos | 51344007 (dolor abdominal) |
| ICD-10 | http://hl7.org/fhir/sid/icd-10-cm | Diagnósticos | K29.0 (gastritis aguda) |
| RxNorm | http://www.nlm.nih.gov/research/umls/rxnorm | Medicamentos | 5884 (aspirin) |
| DICOM | urn:oid:1.2.840.10008.2.16.4 | Modalidades DICOM | CT, XC, US |
| HL7 v3 | http://terminology.hl7.org/CodeSystem/... | Conceptos generales | M (married), H (high) |

---

## MATRIZ DE IMPLEMENTACIÓN

| Recurso | Estado | Sprint | Prioridad | Tests |
|---------|--------|--------|-----------|--------|
| Patient | ✅ | 2 | CRÍTICA | ✅ |
| Encounter | ⏳ | 4 | ALTA | ⏳ |
| Observation | ⏳ | 4 | ALTA | ⏳ |
| MedicationRequest | ⏳ | 5-6 | CRÍTICA | ⏳ |
| DiagnosticReport | ⏳ | 7-8 | ALTA | ⏳ |
| ImagingStudy | ⏳ | 7-8 | MEDIA | ⏳ |
| HL7 Interface | ⏳ | 7-8 | ALTA | ⏳ |

---

**Documento Compilado**: 2025-02-05  
**FHIR Validator**: http://validator.fhir.org  
**Documentación**: http://hl7.org/fhir/r4/index.html  
**Especificación HL7**: http://www.hl7.org/implement/standards/product_brief.cfm?product_id=24
