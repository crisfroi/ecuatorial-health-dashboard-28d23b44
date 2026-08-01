#!/usr/bin/env python3
"""
Parse SNOMED CT Spanish Release - CORRECTED VERSION
Data is in sct2_Description and sct2_TextDefinition, not sct2_Concept
"""

import argparse
import csv
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SnomedParserCorrect:
    def __init__(self, input_dir, output_dir, test_count=None):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.test_count = test_count
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.concepts = {}  # conceptId -> status
        self.descriptions = []  # list of description records
        self.definitions = []  # list of definition records
    
    def find_rf2_files(self):
        """Find Description and TextDefinition files (actual data sources)."""
        paths_to_try = [
            self.input_dir / 'Full' / 'Terminology',
            self.input_dir / 'Snapshot' / 'Terminology'
        ]
        
        description_file = None
        definition_file = None
        
        for search_path in paths_to_try:
            if not search_path.exists():
                logger.warning(f"Path not found: {search_path}")
                continue
            
            logger.info(f"Searching for RF2 files in {search_path}")
            
            # Description file (sct2_Description_*Full*-es_*.txt or Snapshot)
            descriptions = list(search_path.glob('sct2_Description*Full*-es*.txt')) + \
                          list(search_path.glob('sct2_Description*Snapshot*-es*.txt'))
            if descriptions:
                description_file = descriptions[0]
                try:
                    size_mb = description_file.stat().st_size / 1024 / 1024
                    logger.info(f"Found description file: {description_file.name} ({size_mb:.1f} MB)")
                except:
                    logger.info(f"Found description file: {description_file.name}")
            
            # TextDefinition file
            definitions = list(search_path.glob('sct2_TextDefinition*Full*-es*.txt')) + \
                         list(search_path.glob('sct2_TextDefinition*Snapshot*-es*.txt'))
            if definitions:
                definition_file = definitions[0]
                try:
                    size_mb = definition_file.stat().st_size / 1024 / 1024
                    logger.info(f"Found definition file: {definition_file.name} ({size_mb:.1f} MB)")
                except:
                    logger.info(f"Found definition file: {definition_file.name}")
            
            if description_file and definition_file:
                break
        
        if not (description_file and definition_file):
            raise FileNotFoundError("Could not find Description and TextDefinition files")
        
        return description_file, definition_file
    
    def parse_descriptions(self, description_file):
        """Parse descriptions (sct2_Description file has actual concept data - 2M+ concepts)."""
        logger.info(f"Parsing descriptions from {description_file.name} (NO limit - reading all)")
        count = 0
        concepts_found = set()

        try:
            with open(description_file, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f, delimiter='\t')

                for row in reader:
                    # NO test limit - read ALL 2M+ concepts
                    # if self.test_count and count >= self.test_count:
                    #     logger.info(f"Reached test limit of {self.test_count}")
                    #     break
                    
                    # Only process active Spanish descriptions
                    active = row.get('active', '0').strip()
                    lang = row.get('languageCode', '').strip()
                    if active != '1' or lang != 'es':
                        continue
                    
                    concept_id = row.get('conceptId', '').strip()
                    term_id = row.get('id', '').strip()
                    term = row.get('term', '').strip()
                    type_id = row.get('typeId', '')
                    
                    if not (concept_id and term_id and term):
                        continue
                    
                    # Track unique concepts
                    if concept_id not in concepts_found:
                        concepts_found.add(concept_id)
                        self.concepts[concept_id] = 'ACTIVE'
                    
                    # Determine type
                    desc_type = 'FSN' if type_id == '900000000000003001' else \
                               'PREFERRED' if type_id == '900000000000013009' else \
                               'SYNONYM'
                    
                    self.descriptions.append({
                        'concept_id': concept_id,
                        'description_id': term_id,
                        'term': term,
                        'fsn': None,
                        'description_type': desc_type,
                        'lang': lang,
                        'status': 'ACTIVE'
                    })
                    count += 1
                    
                    if count % 50000 == 0:
                        logger.info(f"Progress: {count} descriptions, {len(concepts_found)} concepts...")
        
        except Exception as e:
            logger.error(f"Error parsing descriptions: {e}", exc_info=True)
            raise
        
        logger.info(f"Parsed {count} descriptions from {len(concepts_found)} unique concepts")
    
    def parse_definitions(self, definition_file):
        """Parse text definitions (similar structure to descriptions - much smaller file)."""
        logger.info(f"Parsing definitions from {definition_file.name} (NO limit - reading all)")
        count = 0

        try:
            with open(definition_file, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f, delimiter='\t')

                for row in reader:
                    # NO test limit - read ALL definitions
                    # if self.test_count and count >= self.test_count * 5:
                    #     logger.info(f"Reached definition limit")
                    #     break
                    
                    active = row.get('active', '0').strip()
                    lang = row.get('languageCode', '').strip()
                    if active != '1' or lang != 'es':
                        continue
                    
                    concept_id = row.get('conceptId', '').strip()
                    term_id = row.get('id', '').strip()
                    term = row.get('term', '').strip()
                    
                    if not (concept_id and term_id and term):
                        continue
                    
                    # Register concept if new
                    if concept_id not in self.concepts:
                        self.concepts[concept_id] = 'ACTIVE'
                    
                    self.definitions.append({
                        'concept_id': concept_id,
                        'description_id': term_id,
                        'term': term,
                        'fsn': term,  # Definitions are like FSN
                        'description_type': 'DEFINITION',
                        'lang': lang,
                        'status': 'ACTIVE'
                    })
                    count += 1
                    
                    if count % 50000 == 0:
                        logger.info(f"Progress: {count} definitions...")
        
        except Exception as e:
            logger.error(f"Error parsing definitions: {e}", exc_info=True)
            raise
        
        logger.info(f"Parsed {count} definitions")
    
    def write_csv_files(self):
        """Write concepts, descriptions, and text_definitions to separate CSV files."""
        # Write concepts (derived from descriptions)
        concepts_file = self.output_dir / 'snomed_concepts.csv'
        with open(concepts_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['concept_id', 'lang', 'status'])
            writer.writeheader()
            for concept_id, status in self.concepts.items():
                writer.writerow({'concept_id': concept_id, 'lang': 'es', 'status': status})
        logger.info(f"Wrote {len(self.concepts)} concepts to {concepts_file}")

        # Write DESCRIPTIONS ONLY (sct2_Description - sinónimos/nombres)
        descriptions_file = self.output_dir / 'snomed_descriptions.csv'
        with open(descriptions_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['concept_id', 'description_id', 'term', 'description_type', 'lang', 'status']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for desc in self.descriptions:
                if desc['term']:
                    writer.writerow({
                        'concept_id': desc['concept_id'],
                        'description_id': desc['description_id'],
                        'term': desc['term'],
                        'description_type': desc['description_type'],
                        'lang': desc['lang'],
                        'status': desc['status']
                    })
        logger.info(f"Wrote {len(self.descriptions)} descriptions to {descriptions_file}")

        # Write TEXT DEFINITIONS ONLY (sct2_TextDefinition - definiciones clínicas formales)
        definitions_file = self.output_dir / 'snomed_text_definitions.csv'
        with open(definitions_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['concept_id', 'definition_id', 'term', 'lang', 'status']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for defn in self.definitions:
                if defn['term']:
                    writer.writerow({
                        'concept_id': defn['concept_id'],
                        'definition_id': defn['description_id'],
                        'term': defn['term'],
                        'lang': defn['lang'],
                        'status': defn['status']
                    })
        logger.info(f"Wrote {len(self.definitions)} text definitions to {definitions_file}")

        # Write empty relationships file (since RF2 relationships are sparse)
        relationships_file = self.output_dir / 'snomed_relationships.csv'
        with open(relationships_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['source_concept_id', 'target_concept_id', 'relationship_type', 'status'])
            writer.writeheader()
        logger.info(f"Empty relationships file (can be populated from sct2_Relationship if needed)")
    
    def run(self):
        """Execute parsing."""
        try:
            description_file, definition_file = self.find_rf2_files()
            self.parse_descriptions(description_file)
            self.parse_definitions(definition_file)
            self.write_csv_files()
            logger.info("SNOMED parsing completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            return False


def main():
    parser = argparse.ArgumentParser(description='Parse SNOMED CT Spanish Release (from Description/Definition files)')
    parser.add_argument('--input-dir', required=True, help='Path to SNOMED directory')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV files')
    parser.add_argument('--test-count', type=int, default=None, help='Limit to N descriptions for testing')
    
    args = parser.parse_args()
    snomed = SnomedParserCorrect(args.input_dir, args.output_dir, args.test_count)
    success = snomed.run()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
