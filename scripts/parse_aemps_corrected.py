#!/usr/bin/env python3
"""
Parse AEMPS Nomenclátor Nacional - CORRECTED VERSION
Reads Prescripcion.xml (large, streaming) + support dictionaries
Outputs: medicamentos and ATC codes

This parser:
1. Streams Prescripcion.xml (too large for memory)
2. Reads support dictionaries (principios, formas, vías, etc)
3. Maps everything to standard fields
"""

import argparse
import csv
import xml.etree.ElementTree as ET
from xml.etree.ElementTree import iterparse
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AEMPSCorrectedParser:
    def __init__(self, input_dir, output_dir, test_count=None):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.test_count = test_count
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.medicamentos = {}  # cn -> medicamento record
        self.atc_codes = {}     # codigoatc -> atc record
        self.principios_activos = {}  # codigoprincipioactivo -> nombre
        self.formas_farm = {}   # codigoforma -> forma
        self.vias_admin = {}    # codigovia -> via
        self.laboratorios = {}  # codigolaboratorio -> laboratorio
        self.situaciones = {}   # codigosituacion -> situacion
        self.envases = {}       # codigoenvase -> envase
    
    def parse_dictionary(self, dict_file, element_name, key_field, value_field):
        """Generic method to parse any AEMPS dictionary XML."""
        logger.info(f"Parsing {dict_file.name}")
        count = 0
        result = {}
        
        try:
            for event, elem in iterparse(dict_file, events=('end',)):
                if elem.tag == element_name:
                    key = elem.findtext(key_field, '').strip()
                    value = elem.findtext(value_field, '').strip()
                    
                    if key and value:
                        result[key] = value
                        count += 1
                    
                    elem.clear()
                    
                    if self.test_count and count >= self.test_count:
                        break
        
        except Exception as e:
            logger.warning(f"Error parsing {dict_file.name}: {e}")
        
        logger.info(f"Parsed {count} entries from {element_name}")
        return result
    
    def _strip_namespace(self, tag):
        """Remove XML namespace from tag name."""
        if '}' in tag:
            return tag.split('}')[1]
        return tag

    def _get_text(self, elem, child_tag):
        """Get text from child element, ignoring namespace."""
        # Try direct findtext first (no namespace)
        text = elem.findtext(child_tag, '')
        if text:
            return text.strip()

        # If not found, search with namespace wildcard
        for child in elem.iter():
            if self._strip_namespace(child.tag) == child_tag:
                if child.text:
                    return child.text.strip()

        return ''

    def load_support_dictionaries(self):
        """Load all support dictionaries."""
        logger.info("Loading support dictionaries...")

        # ATC Dictionary
        atc_file = self.input_dir / 'DICCIONARIO_ATC.xml'
        if atc_file.exists():
            for event, elem in iterparse(atc_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'atc':
                    codigo = self._get_text(elem, 'codigoatc')
                    descri = self._get_text(elem, 'descatc')
                    if codigo and descri:
                        self.atc_codes[codigo] = {
                            'code': codigo,
                            'nombre_es': descri,
                            'parent_code': None,
                            'nivel': None
                        }
                    elem.clear()
            logger.info(f"Loaded {len(self.atc_codes)} ATC codes")
        else:
            logger.warning("DICCIONARIO_ATC.xml not found")

        # Principios Activos
        pa_file = self.input_dir / 'DICCIONARIO_PRINCIPIOS_ACTIVOS.xml'
        if pa_file.exists():
            for event, elem in iterparse(pa_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'principiosactivos':
                    codigo = self._get_text(elem, 'codigoprincipioactivo')
                    nombre = self._get_text(elem, 'principioactivo')
                    if codigo and nombre:
                        self.principios_activos[codigo] = nombre
                    elem.clear()
            logger.info(f"Loaded {len(self.principios_activos)} principios activos")
        else:
            logger.warning("DICCIONARIO_PRINCIPIOS_ACTIVOS.xml not found")

        # Formas Farmacéuticas (tag is formasfarmaceuticas)
        forma_file = self.input_dir / 'DICCIONARIO_FORMA_FARMACEUTICA.xml'
        if forma_file.exists():
            for event, elem in iterparse(forma_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'formasfarmaceuticas':
                    codigo = self._get_text(elem, 'codigoformafarmaceutica')
                    nombre = self._get_text(elem, 'formafarmaceutica')
                    if codigo and nombre:
                        self.formas_farm[codigo] = nombre
                    elem.clear()
            logger.info(f"Loaded {len(self.formas_farm)} formas farmacéuticas")
        else:
            logger.warning("DICCIONARIO_FORMA_FARMACEUTICA.xml not found")

        # Vías de Administración (tag is viasadministracion)
        via_file = self.input_dir / 'DICCIONARIO_VIAS_ADMINISTRACION.xml'
        if via_file.exists():
            for event, elem in iterparse(via_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'viasadministracion':
                    codigo = self._get_text(elem, 'codigoviaadministracion')
                    nombre = self._get_text(elem, 'viaadministracion')
                    if codigo and nombre:
                        self.vias_admin[codigo] = nombre
                    elem.clear()
            logger.info(f"Loaded {len(self.vias_admin)} vías de administración")
        else:
            logger.warning("DICCIONARIO_VIAS_ADMINISTRACION.xml not found")

        # Laboratorios (tag is laboratorios)
        lab_file = self.input_dir / 'DICCIONARIO_LABORATORIOS.xml'
        if lab_file.exists():
            for event, elem in iterparse(lab_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'laboratorios':
                    codigo = self._get_text(elem, 'codigolaboratorio')
                    nombre = self._get_text(elem, 'laboratorio')
                    if codigo and nombre:
                        self.laboratorios[codigo] = nombre
                    elem.clear()
            logger.info(f"Loaded {len(self.laboratorios)} laboratorios")
        else:
            logger.warning("DICCIONARIO_LABORATORIOS.xml not found")

        # Situación de Registro (tag is situacionesregistro)
        sit_file = self.input_dir / 'DICCIONARIO_SITUACION_REGISTRO.xml'
        if sit_file.exists():
            for event, elem in iterparse(sit_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'situacionesregistro':
                    codigo = self._get_text(elem, 'codigosituacionregistro')
                    nombre = self._get_text(elem, 'situacionregistro')
                    if codigo and nombre:
                        self.situaciones[codigo] = nombre
                    elem.clear()
            logger.info(f"Loaded {len(self.situaciones)} situaciones")
        else:
            logger.warning("DICCIONARIO_SITUACION_REGISTRO.xml not found")

        # Envases
        env_file = self.input_dir / 'DICCIONARIO_ENVASES.xml'
        if env_file.exists():
            for event, elem in iterparse(env_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'envases':
                    codigo = self._get_text(elem, 'codigoenvase')
                    nombre = self._get_text(elem, 'envase')
                    if codigo and nombre:
                        self.envases[codigo] = nombre
                    elem.clear()
            logger.info(f"Loaded {len(self.envases)} envases")
        else:
            logger.warning("DICCIONARIO_ENVASES.xml not found")
    
    def parse_prescripcion(self):
        """Parse main Prescripcion.xml file with streaming."""
        prescripcion_file = self.input_dir / 'Prescripcion.xml'

        if not prescripcion_file.exists():
            logger.error("Prescripcion.xml not found")
            return

        logger.info(f"Streaming {prescripcion_file.name} (large file)...")
        count = 0

        try:
            for event, elem in iterparse(prescripcion_file, events=('end',)):
                if self._strip_namespace(elem.tag) == 'medicamento':
                    # Extract fields from medicamento element
                    cn = self._get_text(elem, 'cn')
                    if not cn:
                        elem.clear()
                        continue

                    # Basic fields
                    ean13 = self._get_text(elem, 'ean13') or None
                    nombre_comercial = self._get_text(elem, 'nombre_comercial') or ''

                    # Resolve codigo to actual name (using dictionaries)
                    codigo_pa = self._get_text(elem, 'codigo_principio_activo')
                    principio_activo = self.principios_activos.get(codigo_pa, codigo_pa) if codigo_pa else ''

                    codigo_atc = self._get_text(elem, 'codigo_atc')
                    atc_code = codigo_atc if codigo_atc else None

                    codigo_forma = self._get_text(elem, 'codigo_forma')
                    forma = self.formas_farm.get(codigo_forma, codigo_forma) if codigo_forma else None

                    codigo_via = self._get_text(elem, 'codigo_via')
                    via = self.vias_admin.get(codigo_via, codigo_via) if codigo_via else None

                    codigo_lab = self._get_text(elem, 'codigo_laboratorio')
                    laboratorio = self.laboratorios.get(codigo_lab, codigo_lab) if codigo_lab else None

                    codigo_sit = self._get_text(elem, 'codigo_situacion')
                    situacion = self.situaciones.get(codigo_sit, 'COMERCIALIZADO')
                    
                    # Map situacion to estado
                    estado = 'COMERCIALIZADO'  # default
                    if 'descatalog' in situacion.lower():
                        estado = 'DESCATALOGADO'
                    elif 'tramite' in situacion.lower() or 'procedimiento' in situacion.lower():
                        estado = 'EN_TRAMITE'
                    
                    # Store medicamento
                    self.medicamentos[cn] = {
                        'cn': cn,
                        'ean13': ean13,
                        'nombre_comercial': nombre_comercial,
                        'principio_activo': principio_activo,
                        'atc_code': atc_code,
                        'forma': forma,
                        'via': via,
                        'cnvs': self._get_text(elem, 'cnvs') or None,
                        'ps': self._get_text(elem, 'ps') or None,
                        'dosis': self._get_text(elem, 'dosis') or None,
                        'envase': self._get_text(elem, 'envase') or None,
                        'presentacion': self._get_text(elem, 'presentacion') or None,
                        'laboratorio': laboratorio,
                        'estado': estado,
                    }
                    
                    count += 1
                    elem.clear()  # Free memory
                    
                    if self.test_count and count >= self.test_count:
                        break
                    
                    if count % 10000 == 0:
                        logger.info(f"Progress: {count} medicamentos parsed...")
        
        except Exception as e:
            logger.error(f"Error streaming Prescripcion.xml: {e}", exc_info=True)
        
        logger.info(f"Parsed {count} medicamentos from Prescripcion.xml")
    
    def write_csv_files(self):
        """Write parsed data to CSV files."""
        # Write ATC codes
        atc_file = self.output_dir / 'aemps_atc.csv'
        with open(atc_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['code', 'nombre_es', 'parent_code', 'nivel']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for code, data in sorted(self.atc_codes.items()):
                writer.writerow(data)
        logger.info(f"Wrote {len(self.atc_codes)} ATC codes to {atc_file}")

        # Write Principios Activos (separate table)
        pa_file = self.output_dir / 'aemps_principios_activos.csv'
        with open(pa_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['codigo_pa', 'nombre_pa']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for codigo, nombre in sorted(self.principios_activos.items()):
                writer.writerow({'codigo_pa': codigo, 'nombre_pa': nombre})
        logger.info(f"Wrote {len(self.principios_activos)} principios activos to {pa_file}")

        # Write medicamentos
        med_file = self.output_dir / 'aemps_medicamentos.csv'
        with open(med_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'cn', 'ean13', 'nombre_comercial', 'principio_activo', 'atc_code',
                'forma', 'via', 'cnvs', 'ps', 'dosis', 'envase', 'presentacion',
                'laboratorio', 'estado'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for cn, data in sorted(self.medicamentos.items()):
                writer.writerow(data)
        logger.info(f"Wrote {len(self.medicamentos)} medicamentos to {med_file}")
    
    def run(self):
        """Execute full parsing pipeline."""
        try:
            self.load_support_dictionaries()
            self.parse_prescripcion()
            self.write_csv_files()
            logger.info("AEMPS parsing completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            return False


def main():
    parser = argparse.ArgumentParser(description='Parse AEMPS Nomenclátor Nacional (Prescripcion.xml)')
    parser.add_argument('--input-dir', required=True, help='Path to AEMPS directory')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV files')
    parser.add_argument('--test-count', type=int, default=None, help='Limit to N items for testing')
    
    args = parser.parse_args()
    
    aemps = AEMPSCorrectedParser(args.input_dir, args.output_dir, args.test_count)
    success = aemps.run()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
