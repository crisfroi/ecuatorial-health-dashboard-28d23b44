#!/usr/bin/env python3
"""
Parse LOINC Spanish Linguistic Variants - UNIFIED PARSER
Combines esES12 (España), esMX28 (México), esAR7 (Argentina)
- No repetir LOINC_NUM
- Unificar traducciones de forma inteligente
- Complementar registros faltantes entre variantes
"""

import argparse
import csv
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class LOINCSpanishUnifiedParser:
    def __init__(self, input_dir, output_dir):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Unificado: LOINC_NUM -> mejor registro con todas las variantes
        self.unified_loinc = {}
        self.variants_dir = self.input_dir / 'AccessoryFiles' / 'LinguisticVariants'
        
    def find_spanish_variants(self):
        """Find Spanish linguistic variant files."""
        spanish_files = {
            'es_ES': self.variants_dir / 'esES12LinguisticVariant.csv',
            'es_MX': self.variants_dir / 'esMX28LinguisticVariant.csv',
            'es_AR': self.variants_dir / 'esAR7LinguisticVariant.csv'
        }
        
        found = {}
        for lang, path in spanish_files.items():
            if path.exists():
                try:
                    size_mb = path.stat().st_size / 1024 / 1024
                    logger.info(f"Found {lang}: {path.name} ({size_mb:.1f} MB)")
                    found[lang] = path
                except:
                    logger.info(f"Found {lang}: {path.name}")
                    found[lang] = path
            else:
                logger.warning(f"Not found: {path.name}")
        
        if not found:
            raise FileNotFoundError("No Spanish LOINC variant files found")
        
        return found
    
    def parse_variant(self, variant_name, filepath):
        """Parse a single Spanish variant file."""
        logger.info(f"Parsing {variant_name}...")
        count = 0
        
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    loinc_num = row.get('LOINC_NUM', '').strip()
                    if not loinc_num:
                        continue
                    
                    # Si no existe, crear entrada nueva
                    if loinc_num not in self.unified_loinc:
                        self.unified_loinc[loinc_num] = {
                            'LOINC_NUM': loinc_num,
                            'COMPONENT': row.get('COMPONENT', '').strip() or None,
                            'PROPERTY': row.get('PROPERTY', '').strip() or None,
                            'TIME_ASPCT': row.get('TIME_ASPCT', '').strip() or None,
                            'SYSTEM': row.get('SYSTEM', '').strip() or None,
                            'SCALE_TYP': row.get('SCALE_TYP', '').strip() or None,
                            'METHOD_TYP': row.get('METHOD_TYP', '').strip() or None,
                            'CLASS': row.get('CLASS', '').strip() or None,
                            'SHORTNAME': row.get('SHORTNAME', '').strip() or None,
                            'LONG_COMMON_NAME': row.get('LONG_COMMON_NAME', '').strip() or None,
                            'RELATEDNAMES2': row.get('RELATEDNAMES2', '').strip() or None,
                            f'LinguisticVariantDisplayName_{variant_name}': row.get('LinguisticVariantDisplayName', '').strip() or None,
                            'variant_sources': [variant_name]
                        }
                    else:
                        # Complementar campos vacíos
                        for field in ['COMPONENT', 'PROPERTY', 'TIME_ASPCT', 'SYSTEM', 'SCALE_TYP', 'METHOD_TYP', 'CLASS', 'SHORTNAME', 'LONG_COMMON_NAME', 'RELATEDNAMES2']:
                            if not self.unified_loinc[loinc_num][field]:
                                self.unified_loinc[loinc_num][field] = row.get(field, '').strip() or None
                        
                        # Agregar variante display name específica
                        display_name = row.get('LinguisticVariantDisplayName', '').strip()
                        if display_name:
                            self.unified_loinc[loinc_num][f'LinguisticVariantDisplayName_{variant_name}'] = display_name
                        
                        # Marcar que esta variante contribuyó
                        if variant_name not in self.unified_loinc[loinc_num]['variant_sources']:
                            self.unified_loinc[loinc_num]['variant_sources'].append(variant_name)
                    
                    count += 1
                    if count % 50000 == 0:
                        logger.info(f"  Progress: {count} rows")
        
        except Exception as e:
            logger.error(f"Error parsing {variant_name}: {e}", exc_info=True)
            raise
        
        logger.info(f"Parsed {count} LOINC codes from {variant_name}")
    
    def write_unified_csv(self):
        """Write unified LOINC CSV with all Spanish variants."""
        output_file = self.output_dir / 'loinc_spanish_unified.csv'
        
        if not self.unified_loinc:
            logger.warning("No LOINC codes to write")
            return
        
        # Determinar todos los campos
        first_record = next(iter(self.unified_loinc.values()))
        fieldnames = [
            'LOINC_NUM',
            'COMPONENT',
            'PROPERTY',
            'TIME_ASPCT',
            'SYSTEM',
            'SCALE_TYP',
            'METHOD_TYP',
            'CLASS',
            'SHORTNAME',
            'LONG_COMMON_NAME',
            'RELATEDNAMES2',
            'LinguisticVariantDisplayName_es_ES',
            'LinguisticVariantDisplayName_es_MX',
            'LinguisticVariantDisplayName_es_AR',
            'variant_sources'  # Qué variantes contribuyeron
        ]
        
        try:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                writer.writeheader()
                
                for record in self.unified_loinc.values():
                    # Convertir lista de variantes a string
                    record['variant_sources'] = '|'.join(record['variant_sources'])
                    writer.writerow(record)
        
        except Exception as e:
            logger.error(f"Error writing CSV: {e}", exc_info=True)
            raise
        
        logger.info(f"Wrote {len(self.unified_loinc)} unified LOINC codes to {output_file}")
    
    def write_summary(self):
        """Write summary statistics."""
        summary_file = self.output_dir / 'loinc_spanish_summary.txt'
        
        # Contar variantes
        variant_counts = {'es_ES': 0, 'es_MX': 0, 'es_AR': 0}
        codes_with_translations = 0
        
        for record in self.unified_loinc.values():
            sources = record['variant_sources']
            if 'es_ES' in sources:
                variant_counts['es_ES'] += 1
            if 'es_MX' in sources:
                variant_counts['es_MX'] += 1
            if 'es_AR' in sources:
                variant_counts['es_AR'] += 1
            
            # Contar cuántas variantes contribuyeron
            if len(sources) > 1:
                codes_with_translations += 1
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("LOINC Spanish Unified Parser - Summary\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"Total unique LOINC codes: {len(self.unified_loinc)}\n\n")
            f.write("Codes by variant source:\n")
            f.write(f"  - España (esES): {variant_counts['es_ES']}\n")
            f.write(f"  - México (esMX): {variant_counts['es_MX']}\n")
            f.write(f"  - Argentina (esAR): {variant_counts['es_AR']}\n\n")
            f.write(f"Codes with multiple variant translations: {codes_with_translations}\n")
        
        logger.info(f"Summary written to {summary_file}")
    
    def run(self):
        """Execute parsing."""
        try:
            variants = self.find_spanish_variants()
            
            # Parse cada variante (preferencia: esES > esMX > esAR)
            for variant_name in ['es_ES', 'es_MX', 'es_AR']:
                if variant_name in variants:
                    self.parse_variant(variant_name, variants[variant_name])
            
            self.write_unified_csv()
            self.write_summary()
            
            logger.info("LOINC Spanish parsing completed successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            return False


def main():
    parser = argparse.ArgumentParser(description='Parse LOINC Spanish Linguistic Variants (unified)')
    parser.add_argument('--input-dir', required=True, help='Path to LOINC 2.82 directory')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV')
    
    args = parser.parse_args()
    loinc = LOINCSpanishUnifiedParser(args.input_dir, args.output_dir)
    success = loinc.run()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
