#!/usr/bin/env python3
"""
Parse AEMPS nomenclator (medications) and ATC dictionary into canonical CSV.
Handles XML and CSV formats from AEMPS data files.

Usage:
    python parse_aemps.py --input-dir <aemps_dir> --output-dir <output_dir> [--test-count 100]

Output files:
    - aemps_medicamentos.csv: cn, ean13, nombre_comercial, principio_activo, atc_code, forma, via, estado
    - aemps_atc.csv: code, parent_code, nombre_es, nivel
"""

import argparse
import csv
import xml.etree.ElementTree as ET
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AEMPSParser:
    def __init__(self, input_dir, output_dir, test_count=None):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.test_count = test_count
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.medicamentos = {}  # cn -> {ean13, nombre_comercial, principio_activo, atc_code, ...}
        self.atc_codes = {}     # atc_code -> {code, parent_code, nombre_es, nivel}
    
    def parse_atc_dictionary(self, atc_file):
        """Parse AEMPS ATC dictionary (XML with namespace support)."""
        logger.info(f"Parsing ATC dictionary from {atc_file.name}")
        count = 0

        try:
            tree = ET.parse(atc_file)
            root = tree.getroot()

            # Extract namespace from root tag if present
            ns = {}
            if '}' in root.tag:
                uri = root.tag.split('}')[0][1:]
                ns = {'aemps': uri}
                logger.info(f"Found XML namespace: {uri}")

            # Try with namespace first, then without
            atc_elements = root.findall('.//aemps:atc', ns) if ns else []
            if not atc_elements:
                atc_elements = root.findall('.//atc')

            logger.info(f"Found {len(atc_elements)} ATC elements")

            for atc_node in atc_elements:
                if self.test_count and count >= self.test_count:
                    break

                # Try with namespace, then without
                if ns:
                    codigo = atc_node.findtext('aemps:codigoatc', '', ns) or atc_node.findtext('codigoatc', '')
                    descri = atc_node.findtext('aemps:descatc', '', ns) or atc_node.findtext('descatc', '')
                else:
                    codigo = atc_node.findtext('codigoatc', '')
                    descri = atc_node.findtext('descatc', '')

                codigo = codigo.strip() if codigo else ''
                descri = descri.strip() if descri else ''

                if codigo and descri:
                    self.atc_codes[codigo] = {
                        'code': codigo,
                        'parent_code': None,
                        'nombre_es': descri,
                        'nivel': None,
                    }
                    count += 1

            logger.info(f"Parsed {count} ATC codes")
        except Exception as e:
            logger.warning(f"Error parsing XML ATC file: {e}. Will try CSV fallback.")
            self.parse_atc_dictionary_csv(atc_file)
    
    def parse_atc_dictionary_csv(self, atc_file):
        """Fallback: parse ATC from CSV if available."""
        try:
            with open(atc_file, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    code = row.get('ATC_CODE') or row.get('code')
                    name = row.get('NOMBRE_ES') or row.get('nombre_es')
                    parent = row.get('PARENT_CODE') or row.get('parent')
                    
                    if code and name:
                        self.atc_codes[code] = {
                            'code': code,
                            'parent_code': parent,
                            'nombre_es': name,
                            'nivel': None,
                        }
        except Exception as e:
            logger.error(f"Could not parse ATC from CSV: {e}")
    
    def parse_medicamentos(self, med_file):
        """Parse AEMPS medicamentos (medications) from CSV or XML."""
        logger.info(f"Parsing medicamentos from {med_file.name}")
        count = 0
        
        if med_file.suffix.lower() == '.csv':
            self.parse_medicamentos_csv(med_file, count)
        elif med_file.suffix.lower() in ['.xml', '.xlsx']:
            self.parse_medicamentos_xml(med_file, count)
    
    def parse_medicamentos_csv(self, med_file, count):
        """Parse medicamentos from CSV."""
        with open(med_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if self.test_count and count >= self.test_count:
                    break
                
                cn = row.get('CN') or row.get('cn')
                if not cn:
                    continue
                
                self.medicamentos[cn] = {
                    'cn': cn,
                    'ean13': row.get('EAN13') or row.get('ean13'),
                    'nombre_comercial': row.get('NOMBRE_COMERCIAL') or row.get('nombre_comercial') or '',
                    'principio_activo': row.get('PRINCIPIO_ACTIVO') or row.get('principio_activo') or '',
                    'atc_code': row.get('ATC_CODE') or row.get('atc_code'),
                    'forma': row.get('FORMA') or row.get('forma'),
                    'via': row.get('VIA') or row.get('via'),
                    'cnvs': row.get('CNVS') or row.get('cnvs'),
                    'ps': row.get('PS') or row.get('ps'),
                    'dosis': row.get('DOSIS') or row.get('dosis'),
                    'envase': row.get('ENVASE') or row.get('envase'),
                    'presentacion': row.get('PRESENTACION') or row.get('presentacion'),
                    'laboratorio': row.get('LABORATORIO') or row.get('laboratorio'),
                    'estado': row.get('ESTADO') or row.get('estado') or 'COMERCIALIZADO',
                }
                count += 1
    
    def parse_medicamentos_xml(self, med_file, count):
        """Parse medicamentos from large XML using iterative parsing (streaming)."""
        try:
            context = ET.iterparse(med_file, events=('end',))

            for event, elem in context:
                if self.test_count and count >= self.test_count:
                    break

                # Look for 'medicamento' elements (AEMPS standard)
                if elem.tag in ['medicamento', 'medicina', 'drug', 'MEDICAMENTO']:
                    cn = elem.findtext('cn') or elem.findtext('CN') or elem.get('cn')
                    if not cn:
                        elem.clear()
                        continue

                    # Extract fields from nested structure
                    nombre = elem.findtext('nombre_comercial') or elem.findtext('nombreComercial') or elem.get('nombre', '')
                    principio = elem.findtext('principio_activo') or elem.findtext('principioActivo') or elem.get('ingrediente', '')
                    atc = elem.findtext('atc') or elem.findtext('ATC') or elem.get('atc_code')
                    forma = elem.findtext('forma') or elem.get('forma')
                    via = elem.findtext('via') or elem.get('via')
                    ean = elem.findtext('ean13') or elem.findtext('EAN13') or elem.get('ean13')

                    self.medicamentos[cn] = {
                        'cn': cn,
                        'ean13': ean,
                        'nombre_comercial': nombre,
                        'principio_activo': principio,
                        'atc_code': atc,
                        'forma': forma,
                        'via': via,
                        'cnvs': None,
                        'ps': None,
                        'dosis': None,
                        'envase': None,
                        'presentacion': None,
                        'laboratorio': None,
                        'estado': 'COMERCIALIZADO',
                    }
                    count += 1
                    elem.clear()  # Free memory for large files
        except Exception as e:
            logger.error(f"Error parsing XML medicamentos with streaming: {e}. This file might have a different structure.")
    
    def find_aemps_files(self):
        """Locate AEMPS data files."""
        atc_file = None
        med_file = None
        
        for f in self.input_dir.glob('*ATC*'):
            atc_file = f
            break
        
        for f in self.input_dir.glob('*Prescripcion*'):
            med_file = f
            break
        
        if not med_file:
            for f in self.input_dir.glob('*.csv'):
                if 'medicamentos' in f.name.lower() or 'med' in f.name.lower():
                    med_file = f
                    break
        
        return atc_file, med_file
    
    def write_csv_files(self):
        """Write parsed data to CSV files."""
        # Write ATC codes
        atc_file = self.output_dir / 'aemps_atc.csv'
        with open(atc_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['code', 'parent_code', 'nombre_es', 'nivel']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for code, data in self.atc_codes.items():
                writer.writerow(data)
        logger.info(f"Wrote {len(self.atc_codes)} ATC codes to {atc_file}")
        
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
            for cn, data in self.medicamentos.items():
                writer.writerow(data)
        logger.info(f"Wrote {len(self.medicamentos)} medicamentos to {med_file}")
    
    def run(self):
        """Execute full parsing pipeline."""
        try:
            atc_file, med_file = self.find_aemps_files()
            
            if atc_file:
                self.parse_atc_dictionary(atc_file)
            else:
                logger.warning("ATC file not found; skipping ATC parsing")
            
            if med_file:
                self.parse_medicamentos(med_file)
            else:
                logger.warning("Medicamentos file not found; creating empty output")
            
            self.write_csv_files()
            logger.info("AEMPS parsing completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error parsing AEMPS: {e}", exc_info=True)
            return False


def main():
    parser = argparse.ArgumentParser(description='Parse AEMPS nomenclator and ATC dictionary')
    parser.add_argument('--input-dir', required=True, help='Path to AEMPS directory')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV files')
    parser.add_argument('--test-count', type=int, default=None, help='Limit to N items for testing (default: all)')
    
    args = parser.parse_args()
    
    aemps = AEMPSParser(args.input_dir, args.output_dir, args.test_count)
    success = aemps.run()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
