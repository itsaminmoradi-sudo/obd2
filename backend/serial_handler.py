#!/usr/bin/env python3
"""
Serial Communication Handler
Supports USB serial (termios/fcntl) and Bluetooth RFCOMM
"""

import fcntl
import json
import os
import select
import socket
import struct
import sys
import termios
import threading
import time
from pathlib import Path

try:
    from config import get_setting
    from pid_loader import PIDLoader
except ImportError:
    from .config import get_setting
    from .pid_loader import PIDLoader


class SerialHandler:
    """Serial communication handler for OBD2 devices"""
    
    _instance = None
    _connected = False
    _serial_port = None
    _bluetooth_socket = None
    _current_port = None
    _current_baudrate = None
    _rfcomm_channel = 1
    _read_thread = None
    _stop_reading = False
    _loaded_pids = []
    
    def __new__(cls):
        """Singleton pattern implementation"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize serial handler"""
        if not self._connected:
            self._rfcomm_channel = get_setting('bluetooth.rfcomm_channel', 1)
    
    @classmethod
    def list_ports(cls):
        """
        List available serial ports
        
        Returns:
            list: List of available port dictionaries
        """
        ports = []
        
        # Check for USB serial ports on Linux
        try:
            for device in Path('/dev').glob('ttyUSB*'):
                ports.append({
                    'port': str(device),
                    'type': 'usb',
                    'description': 'USB Serial Port',
                    'available': True
                })
        except (OSError, PermissionError):
            pass
        
        # Check for hardware serial ports
        try:
            for device in Path('/dev').glob('ttyS*'):
                if 'ttyS0' in str(device):  # Usually the main serial port
                    ports.append({
                        'port': str(device),
                        'type': 'hardware',
                        'description': 'Hardware Serial Port',
                        'available': True
                    })
        except (OSError, PermissionError):
            pass
        
        # Check for Bluetooth RFCOMM devices
        try:
            bluetooth_enabled = get_setting('bluetooth.enabled', False)
            if bluetooth_enabled:
                # Try to discover Bluetooth devices (this is a simplified approach)
                rfcomm_devices = cls._scan_bluetooth_devices()
                ports.extend(rfcomm_devices)
        except Exception:
            pass
        
        # Add a default port if none found
        if not ports:
            default_port = get_setting('serial.port', '/dev/ttyUSB0')
            ports.append({
                'port': default_port,
                'type': 'usb',
                'description': 'Default USB Serial Port',
                'available': False  # Don't assume it's available
            })
        
        return ports
    
    @classmethod
    def _scan_bluetooth_devices(cls):
        """Scan for Bluetooth devices that support RFCOMM"""
        devices = []
        try:
            # This is a simplified Bluetooth device discovery
            # In a real implementation, you'd use bluetooth sockets or system commands
            test_addresses = [
                '00:00:00:00:00:01',  # Placeholder addresses
                '00:00:00:00:00:02'
            ]
            
            for address in test_addresses:
                devices.append({
                    'port': f'rfcomm:{address}:{cls._instance._rfcomm_channel}',
                    'type': 'bluetooth',
                    'description': f'Bluetooth RFCOMM {address}',
                    'available': False  # Would need actual discovery to determine
                })
        except Exception as e:
            print(f"Bluetooth scanning error: {e}")
        
        return devices
    
    @classmethod
    def connect(cls, port, baudrate=None):
        """
        Connect to serial port
        
        Args:
            port (str): Port to connect to
            baudrate (int): Baud rate (defaults to config value)
        """
        if cls._connected:
            cls.disconnect()
        
        cls._current_port = port
        cls._current_baudrate = baudrate or get_setting('serial.baudrate', 38400)
        timeout = get_setting('serial.timeout', 1.0)
        
        try:
            if port.startswith('rfcomm:'):
                # Bluetooth RFCOMM connection
                cls._connect_bluetooth(port)
            else:
                # USB/Hardware serial connection
                cls._connect_serial(port, cls._current_baudrate, timeout)
            
            cls._connected = True
            print(f"Connected to {port} at {cls._current_baudrate} baud")
            
            # Start read thread for continuous data
            cls._start_read_thread()
            
        except Exception as e:
            cls._connected = False
            raise Exception(f"Failed to connect to {port}: {e}")
    
    @classmethod
    def _connect_serial(cls, port, baudrate, timeout):
        """Connect to USB/Hardware serial port using termios"""
        try:
            # Open serial port with termios
            cls._serial_port = os.open(port, os.O_RDWR | os.O_NOCTTY | os.O_NONBLOCK)
            
            # Get current terminal attributes
            attrs = termios.tcgetattr(cls._serial_port)
            
            # Set baud rate
            baud_map = {
                9600: termios.B9600,
                19200: termios.B19200,
                38400: termios.B38400,
                57600: termios.B57600,
                115200: termios.B115200
            }
            
            if baudrate in baud_map:
                attrs[4] = baud_map[baudrate]  # Input baud rate
                attrs[5] = baud_map[baudrate]  # Output baud rate
            
            # Set character size to 8 bits, no parity
            attrs[3] = attrs[3] & ~termios.PARENB  # No parity
            attrs[3] = attrs[3] & ~termios.CSIZE   # Clear character size bits
            attrs[3] = attrs[3] | termios.CS8      # 8 data bits
            
            # Set flow control
            attrs[3] = attrs[3] & ~termios.CRTSCTS  # No hardware flow control
            
            # Set timeout
            if timeout > 0:
                attrs[6][termios.VTIME] = int(timeout * 10)  # Timeout in deciseconds
                attrs[6][termios.VMIN] = 0
            
            # Apply attributes
            termios.tcsetattr(cls._serial_port, termios.TCSANOW, attrs)
            
        except Exception as e:
            raise Exception(f"Serial connection failed: {e}")
    
    @classmethod
    def _connect_bluetooth(cls, rfcomm_path):
        """Connect to Bluetooth RFCOMM socket"""
        try:
            # Extract MAC address and channel from rfcomm path
            # Format: rfcomm:MAC_ADDRESS:CHANNEL
            parts = rfcomm_path.split(':')
            if len(parts) >= 3:
                mac_address = parts[1]
                channel = int(parts[2])
            else:
                raise ValueError("Invalid RFCOMM path format")
            
            # Create RFCOMM socket
            cls._bluetooth_socket = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM)
            cls._bluetooth_socket.settimeout(get_setting('serial.timeout', 1.0))
            
            # Connect to RFCOMM channel
            addr = (mac_address, channel)
            cls._bluetooth_socket.connect(addr)
            
        except Exception as e:
            raise Exception(f"Bluetooth connection failed: {e}")
    
    @classmethod
    def disconnect(cls):
        """Disconnect from current port"""
        cls._stop_reading = True
        
        if cls._read_thread and cls._read_thread.is_alive():
            cls._read_thread.join(timeout=1.0)
        
        if cls._serial_port:
            try:
                os.close(cls._serial_port)
            except OSError:
                pass
            cls._serial_port = None
        
        if cls._bluetooth_socket:
            try:
                cls._bluetooth_socket.close()
            except OSError:
                pass
            cls._bluetooth_socket = None
        
        cls._connected = False
        cls._current_port = None
        cls._current_baudrate = None
        print("Disconnected from serial port")
    
    @classmethod
    def is_connected(cls):
        """Check if connected to serial port"""
        return cls._connected
    
    @classmethod
    def send_command(cls, command):
        """
        Send command to OBD2 device
        
        Args:
            command (str): OBD2 command (e.g., '010C')
        
        Returns:
            str: Response from device
        """
        if not cls._connected:
            raise Exception("Not connected to any device")
        
        # Format command (add AT prefix if needed)
        if not command.startswith('AT'):
            full_command = command.strip() + '\r'
        else:
            full_command = command.strip() + '\r'
        
        try:
            if cls._serial_port:
                # Send via serial port
                os.write(cls._serial_port, full_command.encode('utf-8'))
                
                # Read response with timeout
                response = cls._read_serial_response()
                
            elif cls._bluetooth_socket:
                # Send via Bluetooth
                cls._bluetooth_socket.send(full_command.encode('utf-8'))
                
                # Read response
                response = cls._read_bluetooth_response()
            
            return response.strip()
            
        except Exception as e:
            raise Exception(f"Failed to send command: {e}")
    
    @classmethod
    def _read_serial_response(cls, timeout=None):
        """Read response from serial port"""
        timeout = timeout or get_setting('serial.timeout', 1.0)
        response = b""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                # Use select to wait for data
                ready, _, _ = select.select([cls._serial_port], [], [], 0.1)
                if ready:
                    chunk = os.read(cls._serial_port, 1024)
                    if chunk:
                        response += chunk
                        # Check for end of response (OBD2 responses usually end with '>' or newlines)
                        if b'>' in chunk or b'\r\r\n' in chunk:
                            break
                    else:
                        break
            except OSError:
                break
        
        return response.decode('utf-8', errors='ignore')
    
    @classmethod
    def _read_bluetooth_response(cls, timeout=None):
        """Read response from Bluetooth socket"""
        timeout = timeout or get_setting('serial.timeout', 1.0)
        cls._bluetooth_socket.settimeout(timeout)
        
        try:
            response = cls._bluetooth_socket.recv(1024)
            return response.decode('utf-8', errors='ignore')
        except socket.timeout:
            return ""
    
    @classmethod
    def _start_read_thread(cls):
        """Start background thread for continuous reading"""
        cls._stop_reading = False
        cls._read_thread = threading.Thread(target=cls._continuous_read)
        cls._read_thread.daemon = True
        cls._read_thread.start()
    
    @classmethod
    def _continuous_read(cls):
        """Continuous reading loop for background data"""
        while not cls._stop_reading:
            try:
                if cls._connected:
                    # Send a polling command if needed
                    # This could be extended to poll for OBD2 data regularly
                    time.sleep(1)  # Avoid busy waiting
                else:
                    break
            except Exception:
                break
    
    @classmethod
    def get_loaded_pids(cls):
        """Get currently loaded PIDs"""
        return cls._loaded_pids
    
    @classmethod
    def load_pids(cls, manufacturer):
        """Load PIDs for a specific manufacturer"""
        try:
            pid_loader = PIDLoader()
            pids = pid_loader.load_manufacturer(manufacturer)
            cls._loaded_pids = pids
            return pids
        except Exception as e:
            raise Exception(f"Failed to load PIDs for {manufacturer}: {e}")
    
    @classmethod
    def load_all_pids(cls):
        """Load PIDs for all manufacturers"""
        try:
            pid_loader = PIDLoader()
            all_pids = pid_loader.load_all()
            cls._loaded_pids = all_pids
            return all_pids
        except Exception as e:
            raise Exception(f"Failed to load PIDs: {e}")


# Module-level convenience functions
def list_ports():
    """List available serial ports"""
    return SerialHandler.list_ports()


def connect(port, baudrate=None):
    """Connect to serial port"""
    return SerialHandler.connect(port, baudrate)


def disconnect():
    """Disconnect from serial port"""
    return SerialHandler.disconnect()


def is_connected():
    """Check if connected"""
    return SerialHandler.is_connected()


def send_command(command):
    """Send OBD2 command"""
    return SerialHandler.send_command(command)