#!/usr/bin/env python3
"""
Configuration Management Module
Handles JSON configuration files with environment variable overrides
"""

import json
import os
from pathlib import Path


class Config:
    """Configuration manager for OBD2 Diagnostic Tool"""
    
    DEFAULT_CONFIG = {
        'server': {
            'port': int(os.environ.get('PORT', 8000)),
            'host': os.environ.get('HOST', '0.0.0.0')
        },
        'serial': {
            'port': os.environ.get('SERIAL_PORT', '/dev/ttyUSB0'),
            'baudrate': int(os.environ.get('SERIAL_BAUDRATE', 38400)),
            'timeout': float(os.environ.get('SERIAL_TIMEOUT', 1.0)),
            'protocol': os.environ.get('SERIAL_PROTOCOL', 'elm327')
        },
        'bluetooth': {
            'enabled': os.environ.get('BT_ENABLED', 'false').lower() == 'true',
            'rfcomm_channel': int(os.environ.get('BT_RFCOMM_CHANNEL', 1))
        },
        'logging': {
            'level': os.environ.get('LOG_LEVEL', 'INFO'),
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        }
    }
    
    _instance = None
    _config = None
    _config_file = None
    
    def __new__(cls):
        """Singleton pattern implementation"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize configuration"""
        if self._config is None:
            self._config_file = Path(__file__).parent.parent / 'config.json'
            self.load_config()
    
    def load_config(self):
        """Load configuration from file or create default"""
        if self._config_file.exists():
            try:
                with open(self._config_file, 'r') as f:
                    self._config = json.load(f)
                print(f"Loaded configuration from {self._config_file}")
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading config file: {e}. Using default configuration.")
                self._config = self.DEFAULT_CONFIG.copy()
        else:
            self._config = self.DEFAULT_CONFIG.copy()
            self.save_config()
    
    def save_config(self):
        """Save current configuration to file"""
        try:
            with open(self._config_file, 'w') as f:
                json.dump(self._config, f, indent=2)
            print(f"Saved configuration to {self._config_file}")
        except IOError as e:
            print(f"Error saving config file: {e}")
    
    def get(self, key_path, default=None):
        """
        Get configuration value using dot notation (e.g., 'serial.baudrate')
        
        Args:
            key_path (str): Configuration key in dot notation
            default: Default value if key not found
        
        Returns:
            Configuration value or default
        """
        keys = key_path.split('.')
        value = self._config
        
        try:
            for key in keys:
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key_path, value):
        """
        Set configuration value using dot notation
        
        Args:
            key_path (str): Configuration key in dot notation
            value: Value to set
        """
        keys = key_path.split('.')
        config = self._config
        
        # Navigate to the parent dict
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        # Set the final value
        config[keys[-1]] = value
    
    def update(self, config_dict):
        """
        Update configuration with dictionary
        
        Args:
            config_dict (dict): Dictionary of configuration values
        """
        def deep_update(base_dict, update_dict):
            """Recursively update nested dictionaries"""
            for key, value in update_dict.items():
                if isinstance(value, dict) and key in base_dict and isinstance(base_dict[key], dict):
                    deep_update(base_dict[key], value)
                else:
                    base_dict[key] = value
        
        deep_update(self._config, config_dict)
        self.save_config()
    
    @classmethod
    def get_config(cls):
        """Get full configuration dictionary"""
        if cls._instance is None:
            cls._instance = Config()
        return cls._instance._config
    
    @classmethod
    def update_config(cls, config_dict):
        """Update configuration"""
        if cls._instance is None:
            cls._instance = Config()
        cls._instance.update(config_dict)
    
    def reset_to_defaults(self):
        """Reset configuration to default values"""
        self._config = self.DEFAULT_CONFIG.copy()
        self.save_config()


# Module-level convenience functions
def get_config():
    """Get full configuration dictionary"""
    return Config.get_config()


def get_setting(key_path, default=None):
    """Get configuration setting using dot notation"""
    return Config().get(key_path, default)


def set_setting(key_path, value):
    """Set configuration setting using dot notation"""
    Config().set(key_path, value)


def update_config(config_dict):
    """Update configuration with dictionary"""
    Config.update_config(config_dict)