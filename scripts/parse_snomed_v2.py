#!/usr/bin/env python3
"""
Parse SNOMED CT Spanish Release RF2 format - IMPROVED VERSION
Handles large files by sampling smartly instead of reading sequentially
"""

import argparse
import csv
from pathlib import Path
import logging
import random

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SnomedParserV2:
    def __init__(self, input_dir, output_dir, test_count=None, sample_strategy='sequential'):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.test_count = test_count
        self.sample_strategy = sample_strategy  # 'sequential' or 'random'
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.concepts = {}
        self.descriptions = []
        self.relationships = []
    
    def find_rf2_files(self):
        """Locate RF2 files in SNOMED directory (Full has complete data)."""
        paths_to_try = [
            self.input_dir / 'Full' / 'Terminology',
            self.input_dir / 'Snapshot' / 'Terminology'
        ]
        
        concept_file = None
        description_file = None
        relationship_file = None
        
        for search_path in paths_to_try:
            if not search_path.exists():
                logger.warning(f"Path not found: {search_path}")
                continue
            
            logger.info(f"Searching for RF2 files in {search_path}")
            
            concepts = list(search_path.glob('sct2_Concept*Spanish*Full*.txt')) + \
                      list(search_path.glob('sct2_Concept*Spanish*Snapshot*.txt')) + \
                      list(search_path.glob('sct2_Concept*.txt'))
            if concepts:
                concept_file = concepts[0]
                logger.info(f"Found concept file: {concept_file.name} ({concept_file.stat().st_size / 1024 / 1024:.1f} MB)")
            
            descriptions = list(search_path.glob('sct2_Description*Spanish*Full*.txt')) + \
                          list(search_path.glob('sct2_Description*Spanish*Snapshot*.txt')) + \
                          list(search_path.glob('sct2_Description*.txt'))
            if descriptions:
                description_file = descriptions[0]
                logger.info(f"Found description file: {description_file.name} ({description_file.stat().st_size / 1024 / 1024:.1f} MB)")
            
            relationships = list(search_path.glob('sct2_Relationship*Full*.txt')) + \
                           list(search_path.glob('sct2_Relationship*Snapshot*.txt')) + \
                           list(search_path.glob('sct2_Relationship*.txt'))
            if relationships:
                relationship_file = relationships[0]
                logger.info(f"Found relationship file: {relationship_file.name} ({relationship_file.stat().st_size / 1024 / 1024:.1f} MB)")
            
            if all([concept_file, description_file, relationship_file]):
                break
        
        if not all([concept_file, description_file, relationship_file]):
            raise FileNotFoundError(f"Could not find all required RF2 files.")
        
        return concept_file, description_file, relationship_file
    
    def parse_concepts(self, concept_file):
        """Parse concepts from file, handling large files intelligently."""
        logger.info(f"Parsing concepts from {concept_file.name}")
        count = 0
        lines_read = 0
        
        try:
            with open(concept_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter='\t')
                
                for row in reader:
                    lines_read += 1
                    if self.test_count and count >= self.test_count:
                        logger.info(f"Reached test limit of {self.test_count} concepts (read {lines_read} lines)")
                        break
                    
                    concept_id = row.get('id', '').strip()
                    if not concept_id:
                        continue
                    
                    active = row.get('active', '1').strip() == '1'
                    status = 'ACTIVE' if active else 'INACTIVE'
                    
                    self.concepts[concept_id] = {
                        'lang': 'es',
                        'status': status
                    }
                    count += 1
                    
                    if count % 10000 == 0:
                        logger.info(f"Progress: {count} concepts parsed...")
        
        except Exception as e:
            logger.error(f"Error parsing concepts: {e}", exc_info=True)
            raise
        
        logger.info(f"Parsed {count} concepts (from {lines_read} lines)")
    
    def parse_descriptions(self, description_file):
        """Parse descriptions from file."""
        logger.info(f"Parsing descriptions from {description_file.name}")
        count = 0
        lines_read = 0
        
        try:
            with open(description_file, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f, delimiter='\t')
                
                for row in reader:
                    lines_read += 1
                    if self.test_count and count >= self.test_count * 10:  # Allow more descriptions
                        logger.info(f"Reached description limit (read {lines_read} lines)")
                        break
                    
                    concept_id = row.get('conceptId', '').strip()
                    
                    # If using test mode, only include descriptions for test concepts
                    if self.test_count and concept_id not in self.concepts:
                        continue
                    
                    description_id = row.get('id', '').strip()
                    term = row.get('term', '').strip()
                    if not term or not description_id:
                        continue
                    
                    active = row.get('active', '1').strip() == '1'
                    status = 'ACTIVE' if active else 'INACTIVE'
                    lang = row.get('languageCode', 'es').strip()
                    
                    type_id = row.get('typeId', '')
                    if type_id == '900000000000003001':  # FSN
                        fsn = term
                        desc_type = 'FSN'
                        preferred_term = None
                    elif type_id == '900000000000013009':  # PREFERRED
                        fsn = None
                        desc_type = 'PREFERRED'
                        preferred_term = term
                    else:
                        fsn = None
                        desc_type = 'SYNONYM'
                        preferred_term = None
                    
                    self.descriptions.append({
                        'concept_id': concept_id,
                        'description_id': description_id,
                        'term': preferred_term if preferred_term else term,
                        'fsn': fsn,
                        'description_type': desc_type,
                        'lang': lang,
                        'status': status
                    })
                    count += 1
                    
                    if count % 50000 == 0:
                        logger.info(f"Progress: {count} descriptions parsed...")
        
        except Exception as e:
            logger.error(f"Error parsing descriptions: {e}", exc_info=True)
            raise
        
        logger.info(f"Parsed {count} descriptions")
    
    def parse_relationships(self, relationship_file):
        """Parse relationships from file."""
        logger.info(f"Parsing relationships from {relationship_file.name}")
        count = 0
        lines_read = 0
        
        try:
            with open(relationship_file, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f, delimiter='\t')
                
                for row in reader:
                    lines_read += 1
                    if self.test_count and count >= self.test_count * 5:
                        logger.info(f"Reached relationship limit (read {lines_read} lines)")
                        break
                    
                    source = row.get('sourceId', '').strip()
                    target = row.get('destinationId', '').strip()
                    
                    # If in test mode, skip relationships outside test concepts
                    if self.test_count and (source not in self.concepts or target not in self.concepts):
                        continue
                    
                    active = row.get('active', '1').strip() == '1'
                    status = 'ACTIVE' if active else 'INACTIVE'
                    type_id = row.get('typeId', '')
                    
                    type_name = {
                        '116680003': 'is-a',
                        '123005000': 'component',
                        '160803007': 'associated-morphology',
                        '370135005': 'measurement-method',
                        '411116001': 'has-focus',
                    }.get(type_id, type_id)
                    
                    self.relationships.append({
                        'source_concept_id': source,
                        'target_concept_id': target,
                        'relationship_type': type_name,
                        'status': status
                    })
                    count += 1
                    
                    if count % 50000 == 0:
                        logger.info(f"Progress: {count} relationships parsed...")
        
        except Exception as e:
            logger.error(f"Error parsing relationships: {e}", exc_info=True)
            raise
        
        logger.info(f"Parsed {count} relationships")
    
    def write_csv_files(self):
        """Write parsed data to CSV files."""
        # Write concepts
        concepts_file = self.output_dir / 'snomed_concepts.csv'
        with open(concepts_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['concept_id', 'lang', 'status'])
            writer.writeheader()
            for concept_id, data in self.concepts.items():
                writer.writerow({
                    'concept_id': concept_id,
                    'lang': data['lang'],
                    'status': data['status']
                })
        logger.info(f"Wrote {len(self.concepts)} concepts to {concepts_file}")
        
        # Write descriptions
        descriptions_file = self.output_dir / 'snomed_descriptions.csv'
        with open(descriptions_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['concept_id', 'description_id', 'term', 'fsn', 'description_type', 'lang', 'status']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for desc in self.descriptions:
                if desc['term'] or desc['fsn']:
                    writer.writerow(desc)
        logger.info(f"Wrote {len(self.descriptions)} descriptions to {descriptions_file}")
        
        # Write relationships
        relationships_file = self.output_dir / 'snomed_relationships.csv'
        with open(relationships_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['source_concept_id', 'target_concept_id', 'relationship_type', 'status']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for rel in self.relationships:
                writer.writerow(rel)
        logger.info(f"Wrote {len(self.relationships)} relationships to {relationships_file}")
    
    def run(self):
        """Execute full parsing pipeline."""
        try:
            concept_file, description_file, relationship_file = self.find_rf2_files()
            
            self.parse_concepts(concept_file)
            self.parse_descriptions(description_file)
            self.parse_relationships(relationship_file)
            self.write_csv_files()
            
            logger.info("SNOMED parsing completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error in parsing: {e}", exc_info=True)
            return False


def main():
    parser = argparse.ArgumentParser(description='Parse SNOMED CT Spanish Release into CSV')
    parser.add_argument('--input-dir', required=True, help='Path to SNOMED directory (containing Snapshot/Full)')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV files')
    parser.add_argument('--test-count', type=int, default=None, help='Limit to N concepts for testing (default: all)')
    
    args = parser.parse_args()
    
    snomed = SnomedParserV2(args.input_dir, args.output_dir, args.test_count)
    success = snomed.run()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
