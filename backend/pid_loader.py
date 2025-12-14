#!/usr/bin/env python3
"""
PID Loader Module
Loads manufacturer-specific PID data from JSON files
"""

import json
from pathlib import Path
from typing import List, Dict, Optional


class PIDLoader:
    """Loads and manages OBD2 PID data from manufacturer JSON files"""
    
    def __init__(self):
        """Initialize PID loader"""
        self.pids_dir = Path(__file__).parent.parent / 'pids'
        self._pid_cache = {}
    
    def load_manufacturer(self, manufacturer: str) -> List[Dict]:
        """
        Load PIDs for a specific manufacturer
        
        Args:
            manufacturer (str): Manufacturer name (case-insensitive)
        
        Returns:
            List[Dict]: List of PID definitions
        
        Raises:
            FileNotFoundError: If manufacturer JSON file doesn't exist
            ValueError: If PID data is invalid
        """
        manufacturer_lower = manufacturer.lower()
        manufacturer_file = self.pids_dir / f"{manufacturer_lower}.json"
        
        if not manufacturer_file.exists():
            raise FileNotFoundError(f"PID file not found for manufacturer: {manufacturer}")
        
        try:
            with open(manufacturer_file, 'r', encoding='utf-8') as f:
                pids_data = json.load(f)
            
            # Validate and process PID data
            validated_pids = self._validate_and_process_pids(pids_data, manufacturer)
            
            # Cache the loaded PIDs
            self._pid_cache[manufacturer_lower] = validated_pids
            
            print(f"Loaded {len(validated_pids)} PIDs for {manufacturer}")
            return validated_pids
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {manufacturer} PID file: {e}")
    
    def load_all(self) -> List[Dict]:
        """
        Load PIDs for all available manufacturers
        
        Returns:
            List[Dict]: Combined list of all PIDs
        """
        all_pids = []
        
        # Find all JSON files in pids directory
        for pid_file in self.pids_dir.glob("*.json"):
            manufacturer = pid_file.stem
            try:
                pids = self.load_manufacturer(manufacturer)
                # Add manufacturer info to each PID
                for pid in pids:
                    pid['manufacturer'] = manufacturer.title()
                all_pids.extend(pids)
            except Exception as e:
                print(f"Warning: Failed to load PIDs for {manufacturer}: {e}")
        
        print(f"Loaded total of {len(all_pids)} PIDs from {len(self._pid_cache)} manufacturers")
        return all_pids
    
    def get_manufacturers(self) -> List[str]:
        """
        Get list of available manufacturers
        
        Returns:
            List[str]: List of manufacturer names
        """
        manufacturers = []
        for pid_file in self.pids_dir.glob("*.json"):
            manufacturers.append(pid_file.stem.title())
        
        return sorted(manufacturers)
    
    def _validate_and_process_pids(self, pids_data: List[Dict], manufacturer: str) -> List[Dict]:
        """
        Validate and process PID data according to schema
        
        Args:
            pids_data (List[Dict]): Raw PID data from JSON
            manufacturer (str): Manufacturer name for error messages
        
        Returns:
            List[Dict]: Validated and processed PID data
        
        Raises:
            ValueError: If PID data doesn't match schema
        """
        required_fields = ['name', 'command', 'type', 'formula', 'unit']
        validated_pids = []
        
        if not isinstance(pids_data, list):
            raise ValueError(f"{manufacturer} PID data must be a list")
        
        for i, pid in enumerate(pids_data):
            try:
                # Validate required fields
                for field in required_fields:
                    if field not in pid:
                        raise ValueError(f"PID {i} missing required field: {field}")
                
                # Validate field types and values
                validated_pid = {
                    'id': pid.get('id', f"{manufacturer}_{i+1:03d}"),
                    'name': self._validate_string(pid['name'], f"{manufacturer} PID {i+1} name"),
                    'command': self._validate_command(pid['command'], f"{manufacturer} PID {i+1} command"),
                    'type': self._validate_string(pid['type'], f"{manufacturer} PID {i+1} type"),
                    'formula': self._validate_string(pid['formula'], f"{manufacturer} PID {i+1} formula"),
                    'unit': self._validate_string(pid['unit'], f"{manufacturer} PID {i+1} unit"),
                    'description': self._validate_optional_string(pid.get('description', '')),
                    'min_value': self._validate_optional_number(pid.get('min_value')),
                    'max_value': self._validate_optional_number(pid.get('max_value')),
                    'supported': pid.get('supported', True)
                }
                
                # Add any additional fields as-is
                for key, value in pid.items():
                    if key not in validated_pid:
                        validated_pid[key] = value
                
                validated_pids.append(validated_pid)
                
            except Exception as e:
                raise ValueError(f"Error validating PID {i} for {manufacturer}: {e}")
        
        return validated_pids
    
    def _validate_string(self, value: str, field_name: str) -> str:
        """Validate string field"""
        if not isinstance(value, str):
            raise ValueError(f"{field_name} must be a string")
        return value.strip()
    
    def _validate_optional_string(self, value: str) -> str:
        """Validate optional string field"""
        if value is None:
            return ""
        if not isinstance(value, str):
            return str(value)
        return value.strip()
    
    def _validate_optional_number(self, value) -> Optional[float]:
        """Validate optional number field"""
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        raise ValueError("Optional number field must be numeric or null")
    
    def _validate_command(self, command: str, field_name: str) -> str:
        """Validate OBD2 command format"""
        if not isinstance(command, str):
            raise ValueError(f"{field_name} must be a string")
        
        command = command.strip().upper()
        
        # Basic OBD2 command validation (hexadecimal)
        if not all(c in '0123456789ABCDEF' for c in command):
            raise ValueError(f"{field_name} must contain only hexadecimal characters")
        
        return command
    
    def get_cached_pids(self, manufacturer: str) -> Optional[List[Dict]]:
        """
        Get cached PID data for a manufacturer
        
        Args:
            manufacturer (str): Manufacturer name
        
        Returns:
            List[Dict] or None: Cached PID data
        """
        return self._pid_cache.get(manufacturer.lower())
    
    def clear_cache(self):
        """Clear the PID cache"""
        self._pid_cache.clear()
        print("PID cache cleared")


# Convenience functions
def load_manufacturer_pids(manufacturer: str) -> List[Dict]:
    """Load PIDs for a specific manufacturer"""
    loader = PIDLoader()
    return loader.load_manufacturer(manufacturer)


def load_all_pids() -> List[Dict]:
    """Load PIDs for all manufacturers"""
    loader = PIDLoader()
    return loader.load_all()


def get_available_manufacturers() -> List[str]:
    """Get list of available manufacturers"""
    loader = PIDLoader()
    return loader.get_manufacturers()