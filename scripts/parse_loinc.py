#!/usr/bin/env python3
"""
Parse LOINC 2.82 table and Spanish linguistic variants into canonical CSV.
Merges base LOINC codes with esES and esMX Spanish translations.

Usage:
    python parse_loinc.py --input-dir <loinc_dir> --output-dir <output_dir> [--test-count 100]

Output files:
    - loinc_codes.csv: loinc_num, component, property, system, spanish_name_es, spanish_name_mx, status_es, status_mx
"""

import argparse
import csv
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class LOINCParser:
    def __init__(self, input_dir, output_dir, test_count=None):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.test_count = test_count
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.loinc_codes = {}  # loinc_num -> {component, property, system, ...}
        self.spanish_es = {}   # loinc_num -> spanish_name_es
        self.spanish_mx = {}   # loinc_num -> spanish_name_mx
    
    def parse_loinc_table(self, loinc_csv_path):
        """Parse main LOINC table CSV."""
        logger.info(f"Parsing LOINC table from {loinc_csv_path.name}")
        count = 0
        
        with open(loinc_csv_path, 'r', encoding='utf-8') as f:
            # LOINC uses CSV with specific column order
            reader = csv.DictReader(f)
            for row in reader:
                if self.test_count and count >= self.test_count:
                    break
                
                loinc_num = row.get('LOINC_NUM', '').strip()
                if not loinc_num:
                    continue
                
                self.loinc_codes[loinc_num] = {
                    'loinc_num': loinc_num,
                    'component': row.get('COMPONENT', ''),
                    'property': row.get('PROPERTY', ''),
                    'time_aspect': row.get('TIME_ASPCT', ''),
                    'system': row.get('SYSTEM', ''),
                    'scale_type': row.get('SCALE_TYP', ''),
                    'method_type': row.get('METHOD_TYP', ''),
                    'english_name': row.get('SHORTNAME', ''),
                    'status_es': 'ACTIVE',  # Default, may be overridden
                    'status_mx': 'ACTIVE',
                    'spanish_name_es': None,
                    'spanish_name_mx': None,
                }
                count += 1
        
        logger.info(f"Parsed {count} LOINC codes")
    
    def parse_spanish_variant(self, variant_file, lang_code):
        """Parse Spanish linguistic variant (esES or esMX)."""
        logger.info(f"Parsing Spanish variant ({lang_code}) from {variant_file.name}")
        count = 0
        target_dict = self.spanish_es if lang_code == 'esES' else self.spanish_mx
        
        with open(variant_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                loinc_num = row.get('LOINC_NUM', '').strip()
                spanish_name = row.get('LONG_COMMON_NAME', '') or row.get('SHORTNAME', '')
                
                if loinc_num and spanish_name:
                    target_dict[loinc_num] = spanish_name
                    count += 1
        
        logger.info(f"Parsed {count} Spanish names for {lang_code}")
    
    def merge_variants(self):
        """Merge Spanish translations into LOINC codes."""
        for loinc_num in self.loinc_codes:
            self.loinc_codes[loinc_num]['spanish_name_es'] = self.spanish_es.get(loinc_num)
            self.loinc_codes[loinc_num]['spanish_name_mx'] = self.spanish_mx.get(loinc_num)
    
    def find_loinc_files(self):
        """Locate LOINC CSV and variant files."""
        loinc_dir = self.input_dir / 'LoincTable'
        variant_dir = self.input_dir / 'AccessoryFiles' / 'LinguisticVariants'
        
        loinc_csv = loinc_dir / 'Loinc.csv' if loinc_dir.exists() else None
        variant_es = variant_dir / 'esES12LinguisticVariant.csv' if variant_dir.exists() else None
        variant_mx = variant_dir / 'esMX28LinguisticVariant.csv' if variant_dir.exists() else None
        
        # Fallback if exact names don't match
        if not loinc_csv:
            csvs = list(loinc_dir.glob('*.csv')) if loinc_dir.exists() else []
            if csvs:
                loinc_csv = csvs[0]
        
        if not variant_es:
            variants = list(variant_dir.glob('*esES*.csv')) if variant_dir.exists() else []
            if variants:
                variant_es = variants[0]
        
        if not variant_mx:
            variants = list(variant_dir.glob('*esMX*.csv')) if variant_dir.exists() else []
            if variants:
                variant_mx = variants[0]
        
        return loinc_csv, variant_es, variant_mx
    
    def write_csv_file(self):
        """Write merged LOINC codes to CSV."""
        output_file = self.output_dir / 'loinc_codes.csv'
        
        fieldnames = [
            'loinc_num', 'component', 'property', 'time_aspect', 'system', 
            'scale_type', 'method_type', 'english_name', 'spanish_name_es', 
            'spanish_name_mx', 'status_es', 'status_mx'
        ]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for loinc_num, data in self.loinc_codes.items():
                writer.writerow({
                    'loinc_num': data['loinc_num'],
                    'component': data.get('component', ''),
                    'property': data.get('property', ''),
                    'time_aspect': data.get('time_aspect', ''),
                    'system': data.get('system', ''),
                    'scale_type': data.get('scale_type', ''),
                    'method_type': data.get('method_type', ''),
                    'english_name': data.get('english_name', ''),
                    'spanish_name_es': data.get('spanish_name_es', ''),
                    'spanish_name_mx': data.get('spanish_name_mx', ''),
                    'status_es': data.get('status_es', 'ACTIVE'),
                    'status_mx': data.get('status_mx', 'ACTIVE'),
                })
        
        logger.info(f"Wrote {len(self.loinc_codes)} LOINC codes to {output_file}")
    
    def run(self):
        """Execute full parsing pipeline."""
        try:
            loinc_csv, variant_es, variant_mx = self.find_loinc_files()
            
            if not loinc_csv:
                raise FileNotFoundError("Could not find LOINC.csv in LoincTable/")
            
            self.parse_loinc_table(loinc_csv)
            
            if variant_es:
                self.parse_spanish_variant(variant_es, 'esES')
            else:
                logger.warning("esES variant not found; will use component names as fallback")
            
            if variant_mx:
                self.parse_spanish_variant(variant_mx, 'esMX')
            else:
                logger.warning("esMX variant not found; will use component names as fallback")
            
            self.merge_variants()
            self.write_csv_file()
            
            logger.info("LOINC parsing completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error parsing LOINC: {e}", exc_info=True)
            return False


def main():
    parser = argparse.ArgumentParser(description='Parse LOINC 2.82 with Spanish variants')
    parser.add_argument('--input-dir', required=True, help='Path to LOINC directory (containing LoincTable/)')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV files')
    parser.add_argument('--test-count', type=int, default=None, help='Limit to N codes for testing (default: all)')
    
    args = parser.parse_args()
    
    loinc = LOINCParser(args.input_dir, args.output_dir, args.test_count)
    success = loinc.run()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
