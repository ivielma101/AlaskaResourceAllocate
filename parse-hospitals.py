#!/usr/bin/env python3
"""
Parse Alaska hospital CSV data and generate TypeScript hospital configuration files.

Usage:
    python parse-hospitals.py <input_csv_file> [--output-file hospitals.ts] [--extended]

Example:
    python parse-hospitals.py ak_processed.csv
    python parse-hospitals.py ak_supp.csv --extended --output-file hospitals-extended.ts
"""

import csv
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional


class HospitalParser:
    """Parse CSV hospital data and generate TypeScript configurations."""

    def __init__(self, processed: bool = True):
        """
        Initialize parser.
        
        Args:
            processed: If True, parse ak_processed.csv format. If False, parse ak_supp.csv format.
        """
        self.processed = processed

    def parse_processed_csv(self, csv_file: str) -> List[Dict[str, Any]]:
        """Parse the processed CSV format (ak_processed.csv)."""
        hospitals = []
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    trauma_text = row['TraumaLevel'].replace('Level ', '').split(' ')[0]
                    trauma_level = int(trauma_text) if trauma_text.isdigit() else 3
                    
                    helipad = row.get('Helipad', 'N').strip().upper() == 'Y'
                    
                    hospital = {
                        'id': row['Hospital'].lower().replace(' ', '-').replace('.', ''),
                        'name': row['Hospital'].strip(),
                        'city': row['City'].strip(),
                        'location': {
                            'lat': float(row['Y']),
                            'lng': float(row['X'])
                        },
                        'airborneCapable': helipad,
                        'traumaLevel': min(max(trauma_level, 1), 5),
                        'capacity': int(row['Beds']) if row['Beds'].isdigit() else 50,
                    }
                    hospitals.append(hospital)
                except (ValueError, KeyError) as e:
                    print(f"Warning: Skipping row due to parsing error: {e}")
                    continue
        
        return hospitals

    def parse_supplementary_csv(self, csv_file: str) -> List[Dict[str, Any]]:
        """Parse the supplementary CSV format (ak_supp.csv)."""
        hospitals = []
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    trauma_text = row.get('TRAUMA', 'LEVEL III').replace('LEVEL ', '')
                    if trauma_text in ['II', '2']:
                        trauma_level = 2
                    elif trauma_text in ['IV', '4']:
                        trauma_level = 4
                    else:
                        trauma_level = 3
                    
                    helipad = row.get('HELIPAD', 'N').strip().upper() == 'Y'
                    
                    # Handle population field that may have invalid values
                    try:
                        beds = int(row.get('BEDS', '50'))
                        if beds < 0:
                            beds = 50
                    except ValueError:
                        beds = 50
                    
                    hospital = {
                        'id': row['NAME'].lower().replace(' ', '-').replace('.', ''),
                        'name': row['NAME'].strip(),
                        'city': row['CITY'].strip(),
                        'location': {
                            'lat': float(row['LATITUDE']),
                            'lng': float(row['LONGITUDE'])
                        },
                        'airborneCapable': helipad,
                        'traumaLevel': min(max(trauma_level, 1), 5),
                        'capacity': beds,
                        'phone': row.get('TELEPHONE', '').strip(),
                        'address': row.get('ADDRESS', '').strip(),
                        'state': row.get('STATE', 'AK').strip(),
                        'zip': row.get('ZIP', '').strip(),
                        'county': row.get('COUNTY', '').strip(),
                        'owner': row.get('OWNER', '').strip(),
                        'status': row.get('STATUS', 'OPEN').strip(),
                    }
                    hospitals.append(hospital)
                except (ValueError, KeyError) as e:
                    print(f"Warning: Skipping row due to parsing error: {e}")
                    continue
        
        return hospitals

    def generate_standard_typescript(self, hospitals: List[Dict[str, Any]]) -> str:
        """Generate standard TypeScript hospital configuration."""
        
        # Only include base hospital fields
        base_hospitals = []
        for h in hospitals:
            base_hospitals.append({
                'id': h['id'],
                'name': h['name'],
                'city': h['city'],
                'location': h['location'],
                'airborneCapable': h['airborneCapable'],
                'traumaLevel': h['traumaLevel'],
                'capacity': h['capacity']
            })
        
        hospitals_json = json.dumps(base_hospitals, indent=2)
        
        ts_code = f'''import type {{ LatLng }} from '@/types/geo';
import type {{ Hospital }} from '@/types/domain';
import {{ haversineKm }} from '@/lib/geo';

export const HOSPITAL_SEARCH_RADIUS_KM = 350;

export type HospitalWithDistance = Hospital & {{
  distanceKm: number | null;
}};

export type NearbyHospital = HospitalWithDistance;

const hospitals: Hospital[] = {hospitals_json};

export const getHospitals = () => hospitals;

export const getHospitalsInScope = (origin: LatLng | null): HospitalWithDistance[] => {{
  const withDistance = hospitals.map((hospital) => ({{
    ...hospital,
    distanceKm: origin ? haversineKm(origin, hospital.location) : null
  }}));

  if (!origin) {{
    return withDistance.sort((a, b) => b.traumaLevel - a.traumaLevel || a.name.localeCompare(b.name));
  }}

  return withDistance.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
}};

export const findHospitalsWithinRadius = (
  origin: LatLng | null,
  radiusKm: number = HOSPITAL_SEARCH_RADIUS_KM
): NearbyHospital[] => {{
  if (!origin) return [];
  return getHospitalsInScope(origin).filter((hospital) => (hospital.distanceKm ?? Number.POSITIVE_INFINITY) <= radiusKm);
}};
'''
        return ts_code

    def generate_extended_typescript(self, hospitals: List[Dict[str, Any]]) -> str:
        """Generate extended TypeScript hospital configuration with additional metadata."""
        
        # Create base hospitals array
        base_hospitals = []
        extended_hospitals = []
        
        seen_ids = set()
        
        for h in hospitals:
            base_hospital = {
                'id': h['id'],
                'name': h['name'],
                'city': h['city'],
                'location': h['location'],
                'airborneCapable': h['airborneCapable'],
                'traumaLevel': h['traumaLevel'],
                'capacity': h['capacity']
            }
            
            # Track unique hospitals
            if h['id'] not in seen_ids:
                base_hospitals.append(base_hospital)
                seen_ids.add(h['id'])
            
            # Extended data with optional fields
            extended_hospital = base_hospital.copy()
            for key in ['phone', 'address', 'state', 'zip', 'county', 'owner', 'status']:
                if key in h and h[key]:
                    extended_hospital[key] = h[key]
            
            extended_hospitals.append(extended_hospital)
        
        base_json = json.dumps(base_hospitals, indent=2)
        extended_json = json.dumps(extended_hospitals, indent=2)
        
        ts_code = f'''import type {{ LatLng }} from '@/types/geo';
import type {{ Hospital }} from '@/types/domain';
import {{ haversineKm }} from '@/lib/geo';

export const HOSPITAL_SEARCH_RADIUS_KM = 350;

export type HospitalWithDistance = Hospital & {{
  distanceKm: number | null;
}};

export type NearbyHospital = HospitalWithDistance;

/**
 * Extended Hospital type with additional metadata
 * Includes contact info, address details, and administrative classification
 */
export type HospitalExtended = Hospital & {{
  phone?: string;
  address?: string;
  state?: string;
  zip?: string;
  county?: string;
  owner?: string;
  status?: string;
}};

const hospitals: Hospital[] = {base_json};

/**
 * Extended hospital data with comprehensive metadata
 */
export const hospitalExtendedData: HospitalExtended[] = {extended_json};

export const getHospitals = () => hospitals;

export const getHospitalsInScope = (origin: LatLng | null): HospitalWithDistance[] => {{
  const withDistance = hospitals.map((hospital) => ({{
    ...hospital,
    distanceKm: origin ? haversineKm(origin, hospital.location) : null
  }}));

  if (!origin) {{
    return withDistance.sort((a, b) => b.traumaLevel - a.traumaLevel || a.name.localeCompare(b.name));
  }}

  return withDistance.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
}};

export const findHospitalsWithinRadius = (
  origin: LatLng | null,
  radiusKm: number = HOSPITAL_SEARCH_RADIUS_KM
): NearbyHospital[] => {{
  if (!origin) return [];
  return getHospitalsInScope(origin).filter((hospital) => (hospital.distanceKm ?? Number.POSITIVE_INFINITY) <= radiusKm);
}};
'''
        return ts_code


def main():
    parser = argparse.ArgumentParser(
        description='Parse Alaska hospital CSV data and generate TypeScript files'
    )
    parser.add_argument('input_file', help='Input CSV file (ak_processed.csv or ak_supp.csv)')
    parser.add_argument('--output-file', default='hospitals.ts', help='Output TypeScript file')
    parser.add_argument('--extended', action='store_true', help='Generate extended format with metadata')
    parser.add_argument('--supplementary', action='store_true', help='Parse supplementary CSV format')
    
    args = parser.parse_args()
    
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: Input file '{args.input_file}' not found")
        return 1
    
    # Determine parser type
    is_supplementary = args.supplementary or 'supp' in input_path.name.lower()
    hospital_parser = HospitalParser(processed=not is_supplementary)
    
    # Parse data
    print(f"Parsing {input_path.name}...")
    if is_supplementary:
        hospitals = hospital_parser.parse_supplementary_csv(str(input_path))
    else:
        hospitals = hospital_parser.parse_processed_csv(str(input_path))
    
    print(f"Found {len(hospitals)} hospitals")
    
    # Generate TypeScript
    if args.extended or is_supplementary:
        print("Generating extended TypeScript...")
        ts_code = hospital_parser.generate_extended_typescript(hospitals)
    else:
        print("Generating standard TypeScript...")
        ts_code = hospital_parser.generate_standard_typescript(hospitals)
    
    # Write output
    output_path = Path(args.output_file)
    output_path.write_text(ts_code, encoding='utf-8')
    print(f"✓ Generated {output_path}")
    
    return 0


if __name__ == '__main__':
    exit(main())
