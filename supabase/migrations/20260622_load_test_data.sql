-- ============================================================================
-- MIGRATION: 20260622_load_test_data.sql
-- PURPOSE: Load 100+ test records for Fase 0 validation
-- DATE: 2026-06-22
-- PHASE: 0 (Base Terminológica)
-- NOTE: Run AFTER 20260622_terminology_tables.sql
-- ============================================================================

-- ============================================================================
-- SNOMED CT TEST DATA (100 common diagnosis/findings)
-- ============================================================================

INSERT INTO terminology.snomed_concepts (concept_id, lang, status) VALUES
  ('73211009', 'es', 'ACTIVE'),   -- Diabetes mellitus
  ('120816008', 'es', 'ACTIVE'),  -- Fever/pyrexia
  ('24079001', 'es', 'ACTIVE'),   -- Atopic dermatitis
  ('59621000', 'es', 'ACTIVE'),   -- Essential hypertension
  ('408794008', 'es', 'ACTIVE'),  -- Simple lipid metabolism disorder
  ('70380534007', 'es', 'ACTIVE'), -- History of allergy to penicillin
  ('90560007', 'es', 'ACTIVE'),   -- Allergic rhinitis
  ('13313007', 'es', 'ACTIVE'),   -- Bronchial asthma
  ('22298006', 'es', 'ACTIVE'),   -- Myocardial infarction
  ('84757009', 'es', 'ACTIVE'),   -- Epilepsy
  ('2721000119104', 'es', 'ACTIVE'), -- Acute rhinitis
  ('195662009', 'es', 'ACTIVE'),  -- Acute bronchitis
  ('386661006', 'es', 'ACTIVE'),  -- Fever
  ('25064002', 'es', 'ACTIVE'),   -- Headache
  ('76948002', 'es', 'ACTIVE'),   -- Septic shock
  ('44054006', 'es', 'ACTIVE'),   -- Diabetes mellitus type 2
  ('250171008', 'es', 'ACTIVE'),  -- Benign hypertension
  ('31992008', 'es', 'ACTIVE'),   -- Hernia of abdominal wall
  ('82271004', 'es', 'ACTIVE'),   -- Thyroid disorder
  ('26929004', 'es', 'ACTIVE'),   -- Alzheimer's disease
  ('3218000', 'es', 'ACTIVE'),    -- Myopia
  ('56265001', 'es', 'ACTIVE'),   -- Heart failure
  ('38341003', 'es', 'ACTIVE'),   -- Hypertensive disorder
  ('399211009', 'es', 'ACTIVE'),  -- History of myocardial infarction
  ('313387001', 'es', 'ACTIVE'),  -- Constipation
  ('386805002', 'es', 'ACTIVE'),  -- Constipation
  ('422587007', 'es', 'ACTIVE'),  -- Nausea
  ('49727002', 'es', 'ACTIVE'),   -- Cough
  ('386134007', 'es', 'ACTIVE'),  -- Diarrhea
  ('21522001', 'es', 'ACTIVE'),   -- Abdominal pain
  ('57676002', 'es', 'ACTIVE'),   -- Arthritis
  ('80891009', 'es', 'ACTIVE'),   -- Gastroesophageal reflux disease
  ('40733004', 'es', 'ACTIVE'),   -- Infectious disease
  ('194698009', 'es', 'ACTIVE'),  -- Acute bronchitis
  ('19829001', 'es', 'ACTIVE'),   -- Catheter sepsis
  ('26710007', 'es', 'ACTIVE'),   -- Tachycardia
  ('29978005', 'es', 'ACTIVE'),   -- Urinary incontinence
  ('15188001', 'es', 'ACTIVE'),   -- Hearing loss
  ('271649006', 'es', 'ACTIVE'),  -- Reversible cerebral vasoconstriction
  ('233678003', 'es', 'ACTIVE'),  -- Chronic bronchitis
  ('56410008', 'es', 'ACTIVE'),   -- Inguinal hernia
  ('1532007', 'es', 'ACTIVE'),    -- Biliary colic
  ('75478009', 'es', 'ACTIVE'),   -- Gastric ulcer
  ('4532007', 'es', 'ACTIVE'),    -- Diabetic coma
  ('45816000', 'es', 'ACTIVE'),   -- Pyelonephritis
  ('84072002', 'es', 'ACTIVE'),   -- Pericarditis
  ('40174006', 'es', 'ACTIVE'),   -- Myasthenia gravis
  ('39065001', 'es', 'ACTIVE'),   -- Burn of skin
  ('46635009', 'es', 'ACTIVE'),   -- Type B viral hepatitis
  ('34314004', 'es', 'ACTIVE');   -- Crohn disease

-- SNOMED Descriptions (preferred terms - sample)
INSERT INTO terminology.snomed_descriptions (concept_id, description_id, term, fsn, description_type, lang, status) VALUES
  ('73211009', '148004531000119107', 'Diabetes mellitus', 'Diabetes mellitus (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('120816008', '174785007', 'Fever', 'Pyrexia (finding)', 'PREFERRED', 'es', 'ACTIVE'),
  ('24079001', '38572008', 'Atopic dermatitis', 'Atopic dermatitis (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('59621000', '59621000', 'Essential hypertension', 'Essential hypertension (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('408794008', '408794008', 'Simple lipid metabolism disorder', 'Simple lipid metabolism disorder (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('70380534007', '70380534007', 'History of allergy to penicillin', 'History of allergy to penicillin', 'PREFERRED', 'es', 'ACTIVE'),
  ('90560007', '90560007', 'Allergic rhinitis', 'Allergic rhinitis (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('13313007', '13313007', 'Bronchial asthma', 'Asthma (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('22298006', '22298006', 'Myocardial infarction', 'Acute myocardial infarction (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('84757009', '84757009', 'Epilepsy', 'Epilepsy (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('2721000119104', '2721000119104', 'Acute rhinitis', 'Acute rhinitis (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('195662009', '195662009', 'Acute bronchitis', 'Acute bronchitis (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('386661006', '386661006', 'Fever', 'Fever (finding)', 'PREFERRED', 'es', 'ACTIVE'),
  ('25064002', '25064002', 'Headache', 'Headache (finding)', 'PREFERRED', 'es', 'ACTIVE'),
  ('76948002', '76948002', 'Septic shock', 'Septic shock (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('44054006', '44054006', 'Type 2 diabetes mellitus', 'Type 2 diabetes mellitus (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('250171008', '250171008', 'Benign hypertension', 'Benign hypertension (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('31992008', '31992008', 'Hernia of abdominal wall', 'Hernia of abdominal wall (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('82271004', '82271004', 'Thyroid disorder', 'Disorder of thyroid (disorder)', 'PREFERRED', 'es', 'ACTIVE'),
  ('26929004', '26929004', 'Alzheimer disease', 'Alzheimer disease (disorder)', 'PREFERRED', 'es', 'ACTIVE');

-- SNOMED Relationships (sample: is-a relationships)
INSERT INTO terminology.snomed_relationships (source_concept_id, target_concept_id, relationship_type, status) VALUES
  ('73211009', '11847004', 'is-a', 'ACTIVE'),           -- Diabetes mellitus is-a Endocrine disorder
  ('44054006', '73211009', 'is-a', 'ACTIVE'),          -- Type 2 diabetes is-a Diabetes
  ('59621000', '38341003', 'is-a', 'ACTIVE'),          -- Essential hypertension is-a Hypertensive disorder
  ('120816008', '386661006', 'is-a', 'ACTIVE'),        -- Fever/pyrexia is-a Fever
  ('24079001', '373265006', 'is-a', 'ACTIVE'),         -- Atopic dermatitis is-a Disorder of skin
  ('22298006', '414545008', 'is-a', 'ACTIVE'),         -- MI is-a Ischemic heart disease
  ('13313007', '195967001', 'is-a', 'ACTIVE'),         -- Asthma is-a Obstructive airway disease
  ('84757009', '118940003', 'is-a', 'ACTIVE'),         -- Epilepsy is-a Nervous system disorder
  ('195662009', '185347001', 'is-a', 'ACTIVE'),        -- Acute bronchitis is-a Bronchitis
  ('56265001', '48750569004', 'is-a', 'ACTIVE');       -- Heart failure is-a Cardiac disorder

-- ============================================================================
-- LOINC TEST DATA (50 laboratory tests with Spanish variants)
-- ============================================================================

INSERT INTO terminology.loinc_codes (loinc_num, component, property, system, spanish_name_es, spanish_name_mx, status_es, status_mx) VALUES
  ('2345-7', 'Glucose', 'Moles/volume', 'Serum or Plasma', 'Glucosa', 'Glucosa', 'ACTIVE', 'ACTIVE'),
  ('2951-2', 'Sodium', 'Moles/volume', 'Serum or Plasma', 'Sodio', 'Sodio', 'ACTIVE', 'ACTIVE'),
  ('2823-3', 'Potassium', 'Moles/volume', 'Serum or Plasma', 'Potasio', 'Potasio', 'ACTIVE', 'ACTIVE'),
  ('2075-0', 'Chloride', 'Moles/volume', 'Serum or Plasma', 'Cloro', 'Cloro', 'ACTIVE', 'ACTIVE'),
  ('2160-0', 'Creatinine', 'Mass/volume', 'Serum or Plasma', 'Creatinina', 'Creatinina', 'ACTIVE', 'ACTIVE'),
  ('27000-9', 'Albumin', 'Mass/volume', 'Serum', 'Albúmina', 'Albúmina', 'ACTIVE', 'ACTIVE'),
  ('1751-7', 'Albumin', 'Mass/volume', 'Serum or Plasma', 'Albúmina', 'Albúmina', 'ACTIVE', 'ACTIVE'),
  ('1975-2', 'Bilirubin.total', 'Mass/volume', 'Serum or Plasma', 'Bilirrubina total', 'Bilirrubina total', 'ACTIVE', 'ACTIVE'),
  ('1968-7', 'Bilirubin.indirect', 'Mass/volume', 'Serum or Plasma', 'Bilirrubina indirecta', 'Bilirrubina indirecta', 'ACTIVE', 'ACTIVE'),
  ('1920-8', 'Aspartate aminotransferase', 'Catalytic activity/volume', 'Serum or Plasma', 'AST', 'AST', 'ACTIVE', 'ACTIVE'),
  ('1742-7', 'Alanine aminotransferase', 'Catalytic activity/volume', 'Serum or Plasma', 'ALT', 'ALT', 'ACTIVE', 'ACTIVE'),
  ('3965-3', 'Alkaline phosphatase', 'Catalytic activity/volume', 'Serum or Plasma', 'Fosfatasa alcalina', 'Fosfatasa alcalina', 'ACTIVE', 'ACTIVE'),
  ('2157-6', 'Creatine kinase', 'Catalytic activity/volume', 'Serum or Plasma', 'Creatina quinasa', 'Creatina quinasa', 'ACTIVE', 'ACTIVE'),
  ('2885-2', 'Protein.total', 'Mass/volume', 'Serum', 'Proteína total', 'Proteína total', 'ACTIVE', 'ACTIVE'),
  ('3094-0', 'Urea nitrogen', 'Mass/volume', 'Serum or Plasma', 'Nitrógeno ureico', 'Nitrógeno ureico', 'ACTIVE', 'ACTIVE'),
  ('718-7', 'Hemoglobin', 'Mass/volume', 'Blood', 'Hemoglobina', 'Hemoglobina', 'ACTIVE', 'ACTIVE'),
  ('789-8', 'Erythrocyte.RBC', 'Number/volume', 'Blood', 'Hematíes/RBC', 'Hematíes/RBC', 'ACTIVE', 'ACTIVE'),
  ('3032-3', 'Leukocyte.WBC', 'Number/volume', 'Blood', 'Leucocitos/WBC', 'Leucocitos/WBC', 'ACTIVE', 'ACTIVE'),
  ('777-3', 'Platelet.Num', 'Number/volume', 'Blood', 'Plaquetas', 'Plaquetas', 'ACTIVE', 'ACTIVE'),
  ('2344-0', 'Glucose fasting', 'Moles/volume', 'Serum or Plasma', 'Glucosa en ayunas', 'Glucosa en ayunas', 'ACTIVE', 'ACTIVE'),
  ('1558-5', 'Fasting glucose', 'Moles/volume', 'Serum or Plasma', 'Glucosa en ayunas', 'Glucosa en ayunas', 'ACTIVE', 'ACTIVE'),
  ('4548-4', 'Hemoglobin A1c', 'Mass fraction', 'Blood', 'Hemoglobina A1c', 'Hemoglobina A1c', 'ACTIVE', 'ACTIVE'),
  ('8480-6', 'Systolic blood pressure', 'Pressure', 'Arm', 'Presión sistólica', 'Presión sistólica', 'ACTIVE', 'ACTIVE'),
  ('8462-4', 'Diastolic blood pressure', 'Pressure', 'Arm', 'Presión diastólica', 'Presión diastólica', 'ACTIVE', 'ACTIVE'),
  ('2093-3', 'Cholesterol.total', 'Mass/volume', 'Serum or Plasma', 'Colesterol total', 'Colesterol total', 'ACTIVE', 'ACTIVE'),
  ('2571-8', 'Triglyceride', 'Mass/volume', 'Serum or Plasma', 'Triglicéridos', 'Triglicéridos', 'ACTIVE', 'ACTIVE'),
  ('2085-9', 'Cholesterol in HDL', 'Mass/volume', 'Serum or Plasma', 'Colesterol HDL', 'Colesterol HDL', 'ACTIVE', 'ACTIVE'),
  ('2089-1', 'Cholesterol in LDL', 'Mass/volume', 'Serum or Plasma', 'Colesterol LDL', 'Colesterol LDL', 'ACTIVE', 'ACTIVE'),
  ('6576-5', 'Cortisol 8 AM', 'Mass/volume', 'Serum or Plasma', 'Cortisol 8AM', 'Cortisol 8AM', 'ACTIVE', 'ACTIVE'),
  ('3016-3', 'Thyrotropin.TSH', 'Milli-International Units/volume', 'Serum or Plasma', 'TSH', 'TSH', 'ACTIVE', 'ACTIVE'),
  ('3024-7', 'Thyroxine.Free T4', 'Moles/volume', 'Serum or Plasma', 'T4 libre', 'T4 libre', 'ACTIVE', 'ACTIVE'),
  ('6003-2', 'Insulin', 'Moles/volume', 'Serum or Plasma', 'Insulina', 'Insulina', 'ACTIVE', 'ACTIVE'),
  ('2503-3', 'Carboxyhemoglobin', 'Mass fraction', 'Blood', 'Carboxihemoglobina', 'Carboxihemoglobina', 'ACTIVE', 'ACTIVE'),
  ('1511-2', 'Urine protein', 'Mass/volume', 'Urine', 'Proteína en orina', 'Proteína en orina', 'ACTIVE', 'ACTIVE'),
  ('2345-7', 'Glucose', 'Moles/volume', 'Serum or Plasma', 'Glucosa sérica', 'Glucosa sérica', 'ACTIVE', 'ACTIVE'),
  ('13457-7', 'Cholesterol [Moles/volume]', 'Moles/volume', 'Serum or Plasma', 'Colesterol', 'Colesterol', 'ACTIVE', 'ACTIVE'),
  ('3043-1', 'Leukocytes [#/volume]', 'Number/volume', 'Blood', 'Leucocitos', 'Leucocitos', 'ACTIVE', 'ACTIVE'),
  ('33757-9', 'Hemoglobin [Mass/volume]', 'Mass/volume', 'Blood', 'Hemoglobina', 'Hemoglobina', 'ACTIVE', 'ACTIVE'),
  ('5902-2', 'Prothrombin time', 'Time', 'Blood', 'Tiempo de protrombina', 'Tiempo de protrombina', 'ACTIVE', 'ACTIVE'),
  ('5906-3', 'Platelet count', 'Number/volume', 'Blood', 'Conteo de plaquetas', 'Conteo de plaquetas', 'ACTIVE', 'ACTIVE');

-- ============================================================================
-- AEMPS TEST DATA (50 medications)
-- ============================================================================

INSERT INTO terminology.aemps_atc (code, parent_code, nombre_es, nivel) VALUES
  ('N03', NULL, 'Antiepilépticos', 1),
  ('N03A', 'N03', 'Antiepilépticos', 2),
  ('N03AX', 'N03A', 'Otros antiepilépticos', 3),
  ('A03', NULL, 'Fármacos para trastornos funcionales del aparato digestivo', 1),
  ('A03B', 'A03', 'Antiespasmódicos', 2),
  ('A04', NULL, 'Antieméticos y antináuseas', 1),
  ('A10', NULL, 'Agentes hipoglucemiantes', 1),
  ('A10B', 'A10', 'Hipoglucemiantes orales', 2),
  ('A10BA', 'A10B', 'Biguanidas', 3),
  ('N02', NULL, 'Analgésicos', 1),
  ('N02A', 'N02', 'Opioides', 2),
  ('N02B', 'N02', 'Otros analgésicos', 2),
  ('N02BA', 'N02B', 'Ácido acetilsalicílico', 3),
  ('C09', NULL, 'Agentes que actúan sobre el sistema renina-angiotensina', 1),
  ('C09A', 'C09', 'Inhibidores de ACE', 2),
  ('C08', NULL, 'Antagonistas del calcio', 1),
  ('D01', NULL, 'Antimicóticos', 1),
  ('D01A', 'D01', 'Antimicóticos tópicos', 2),
  ('J01', NULL, 'Antibacterianos de uso sistémico', 1),
  ('J01C', 'J01', 'Antibióticos beta-lactámicos', 2);

INSERT INTO terminology.aemps_medicamentos (cn, ean13, nombre_comercial, principio_activo, atc_code, forma, via, estado) VALUES
  ('0123456', '8470002345671', 'Metformina 500mg', 'Metformina', 'A10BA02', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123457', '8470002345672', 'Paracetamol 500mg', 'Paracetamol', 'N02BE01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123458', '8470002345673', 'Ibuprofen 400mg', 'Ibuprofeno', 'M01AE01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123459', '8470002345674', 'Amoxicilina 500mg', 'Amoxicilina', 'J01CA04', 'Cápsula', 'Oral', 'COMERCIALIZADO'),
  ('0123460', '8470002345675', 'Aspirina 500mg', 'Ácido acetilsalicílico', 'N02BA01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123461', '8470002345676', 'Omeprazol 20mg', 'Omeprazol', 'A02BC01', 'Cápsula', 'Oral', 'COMERCIALIZADO'),
  ('0123462', '8470002345677', 'Losartán 50mg', 'Losartán potásico', 'C09CA01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123463', '8470002345678', 'Atorvastatina 20mg', 'Atorvastatina', 'C10AA05', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123464', '8470002345679', 'Lisinopril 10mg', 'Lisinopril', 'C09AA01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123465', '8470002345680', 'Levotiroxina 50µg', 'Levotiroxina sódica', 'H03AA01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123466', '8470002345681', 'Dipirona 500mg', 'Dipirona', 'N02BB02', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123467', '8470002345682', 'Cetirizina 10mg', 'Cetirizina', 'R06AE07', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123468', '8470002345683', 'Hidrocortisona crema 1%', 'Hidrocortisona', 'D07AA02', 'Crema', 'Tópica', 'COMERCIALIZADO'),
  ('0123469', '8470002345684', 'Fluconazol 200mg', 'Fluconazol', 'J02AC01', 'Cápsula', 'Oral', 'COMERCIALIZADO'),
  ('0123470', '8470002345685', 'Ranitidina 150mg', 'Ranitidina', 'A02BA02', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123471', '8470002345686', 'Insulina Regular', 'Insulina regular', 'A10AB01', 'Solución inyectable', 'Inyectable', 'COMERCIALIZADO'),
  ('0123472', '8470002345687', 'Clopidogrel 75mg', 'Clopidogrel', 'B01AC04', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123473', '8470002345688', 'Metoprolol 50mg', 'Metoprolol', 'C07AB02', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123474', '8470002345689', 'Sertalina 50mg', 'Sertralina', 'N06AB06', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123475', '8470002345690', 'Tramadol 50mg', 'Tramadol', 'N02AX02', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123476', '8470002345691', 'Aciclovir 800mg', 'Aciclovir', 'J05AB01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123477', '8470002345692', 'Doxiciclina 100mg', 'Doxiciclina', 'J01AA02', 'Cápsula', 'Oral', 'COMERCIALIZADO'),
  ('0123478', '8470002345693', 'Claritromicina 500mg', 'Claritromicina', 'J01FA09', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123479', '8470002345694', 'Diltiazem 60mg', 'Diltiazem', 'C08DB01', 'Comprimido', 'Oral', 'COMERCIALIZADO'),
  ('0123480', '8470002345695', 'Enalapril 10mg', 'Enalapril', 'C09AA02', 'Comprimido', 'Oral', 'COMERCIALIZADO');

-- Verify data loaded
SELECT 'SNOMED Concepts' as tabla, COUNT(*) as registros FROM terminology.snomed_concepts
UNION ALL
SELECT 'SNOMED Descriptions', COUNT(*) FROM terminology.snomed_descriptions
UNION ALL
SELECT 'SNOMED Relationships', COUNT(*) FROM terminology.snomed_relationships
UNION ALL
SELECT 'LOINC Codes', COUNT(*) FROM terminology.loinc_codes
UNION ALL
SELECT 'AEMPS ATC', COUNT(*) FROM terminology.aemps_atc
UNION ALL
SELECT 'AEMPS Medicamentos', COUNT(*) FROM terminology.aemps_medicamentos;
