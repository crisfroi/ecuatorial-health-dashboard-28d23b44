#!/usr/bin/env python3
"""
Parse SNOMED CT Spanish Release (RF2 format) into canonical CSV tables.
Extracts concepts, descriptions, and relationships for import to terminology schema.

Usage:
    python parse_snomed.py --input-dir <snomed_dir> --output-dir <output_dir> [--test-count 100]

Output files:
    - snomed_concepts.csv: concept_id, lang, status
    - snomed_descriptions.csv: concept_id, description_id, term, fsn, description_type, lang, status
    - snomed_relationships.csv: source_concept_id, target_concept_id, relationship_type, status
"""

import argparse
import csv
import os
from pathlib import Path
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SnomedParser:
    def __init__(self, input_dir, output_dir, test_count=None):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.test_count = test_count
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.concepts = {}  # concept_id -> {lang, status}
        self.descriptions = []  # [{concept_id, description_id, term, fsn, type, lang, status}]
        self.relationships = []  # [{source, target, type, status}]
    
    def find_rf2_files(self):
        """Locate RF2 files in SNOMED directory (Full or Snapshot)."""
        # Try Full first (more data), then Snapshot
        paths_to_try = [
            self.input_dir / 'Full' / 'Terminology',
            self.input_dir / 'Snapshot' / 'Terminology'
        ]

        concept_file = None
        description_file = None
        relationship_file = None

        for search_path in paths_to_try:
            if not search_path.exists():
                continue

            logger.info(f"Searching for RF2 files in {search_path}")

            # Look for any Concept file (Spanish or International)
            concepts = list(search_path.glob('sct2_Concept*Spanish*Full*.txt')) + \
                      list(search_path.glob('sct2_Concept*Spanish*Snapshot*.txt')) + \
                      list(search_path.glob('sct2_Concept*.txt'))
            if concepts:
                concept_file = concepts[0]
                logger.info(f"Found concept file: {concept_file.name}")

            # Look for Description file
            descriptions = list(search_path.glob('sct2_Description*Spanish*Full*.txt')) + \
                          list(search_path.glob('sct2_Description*Spanish*Snapshot*.txt')) + \
                          list(search_path.glob('sct2_Description*.txt'))
            if descriptions:
                description_file = descriptions[0]
                logger.info(f"Found description file: {description_file.name}")

            # Look for Relationship file
            relationships = list(search_path.glob('sct2_Relationship*Full*.txt')) + \
                           list(search_path.glob('sct2_Relationship*Snapshot*.txt')) + \
                           list(search_path.glob('sct2_Relationship*.txt'))
            if relationships:
                relationship_file = relationships[0]
                logger.info(f"Found relationship file: {relationship_file.name}")

            # If found files in this path, use them
            if all([concept_file, description_file, relationship_file]):
                break

        if not all([concept_file, description_file, relationship_file]):
            raise FileNotFoundError(f"Could not find all required RF2 files. Found: concepts={concept_file}, desc={description_file}, rel={relationship_file}")

        return concept_file, description_file, relationship_file
    
    def parse_concepts(self, concept_file):
        """Parse RF2 concept file: id, effectiveTime, active, moduleId, definitionStatusId."""
        logger.info(f"Parsing concepts from {concept_file.name}")
        count = 0
        
        with open(concept_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                if self.test_count and count >= self.test_count:
                    break
                
                concept_id = row['id']
                active = row['active'] == '1'
                status = 'ACTIVE' if active else 'INACTIVE'
                
                self.concepts[concept_id] = {
                    'lang': 'es',
                    'status': status
                }
                count += 1
        
        logger.info(f"Parsed {count} concepts")
    
    def parse_descriptions(self, description_file):
        """Parse RF2 description file: id, effectiveTime, active, moduleId, conceptId, languageCode, typeId, term, caseSignificanceId."""
        logger.info(f"Parsing descriptions from {description_file.name}")
        count = 0
        
        with open(description_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                if self.test_count and count >= self.test_count:
                    break
                
                concept_id = row['conceptId']
                if self.test_count and concept_id not in self.concepts:
                    continue
                
                description_id = row['id']
                term = row['term']
                active = row['active'] == '1'
                status = 'ACTIVE' if active else 'INACTIVE'
                lang = row.get('languageCode', 'es')
                
                # Determine description type (FSN=Fully Specified Name vs PREFERRED vs SYNONYM)
                type_id = row.get('typeId', '')
                if type_id == '900000000000003001':  # FSN typeId
                    fsn = term
                    desc_type = 'FSN'
                    preferred_term = None
                elif type_id == '900000000000013009':  # PREFERRED typeId
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
                    'term': term if desc_type == 'PREFERRED' else preferred_term,
                    'fsn': fsn,
                    'description_type': desc_type,
                    'lang': lang,
                    'status': status
                })
                count += 1
        
        logger.info(f"Parsed {count} descriptions")
    
    def parse_relationships(self, relationship_file):
        """Parse RF2 relationship file: id, effectiveTime, active, moduleId, sourceId, destinationId, relationshipGroup, typeId, characteristicTypeId, modifierIds."""
        logger.info(f"Parsing relationships from {relationship_file.name}")
        count = 0
        
        with open(relationship_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                if self.test_count and count >= self.test_count * 2:  # Allow more relationships
                    break
                
                source = row['sourceId']
                target = row['destinationId']
                
                if self.test_count and (source not in self.concepts or target not in self.concepts):
                    continue
                
                active = row['active'] == '1'
                status = 'ACTIVE' if active else 'INACTIVE'
                type_id = row.get('typeId', '')
                
                # Map typeId to human-readable names
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
                if desc['term'] or desc['fsn']:  # Only write if has term or FSN
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
            
            if not all([concept_file, description_file, relationship_file]):
                raise FileNotFoundError("Could not find all required RF2 files")
            
            self.parse_concepts(concept_file)
            self.parse_descriptions(description_file)
            self.parse_relationships(relationship_file)
            self.write_csv_files()
            
            logger.info("SNOMED parsing completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error parsing SNOMED: {e}", exc_info=True)
            return False


def main():
    parser = argparse.ArgumentParser(description='Parse SNOMED CT Spanish Release into CSV')
    parser.add_argument('--input-dir', required=True, help='Path to SNOMED directory (containing Snapshot/)')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV files')
    parser.add_argument('--test-count', type=int, default=None, help='Limit to N concepts for testing (default: all)')
    
    args = parser.parse_args()
    
    snomed = SnomedParser(args.input_dir, args.output_dir, args.test_count)
    success = snomed.run()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
