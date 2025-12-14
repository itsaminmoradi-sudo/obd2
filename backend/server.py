#!/usr/bin/env python3
"""
OBD2 Diagnostic Tool - HTTP Server
Pure stdlib HTTP server with routing and SSE support
"""

import json
import os
import threading
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

try:
    from config import Config
    from serial_handler import SerialHandler
    from sse_handler import SSEHandler
except ImportError:
    from .config import Config
    from .serial_handler import SerialHandler
    from .sse_handler import SSEHandler


class RESTRequestHandler(SimpleHTTPRequestHandler):
    """Custom handler for REST endpoints and static file serving"""
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve static files from (frontend build)
        self.static_dir = Path(__file__).parent.parent / 'frontend'
        super().__init__(*args, directory=str(self.static_dir), **kwargs)
    
    def do_GET(self):
        """Handle GET requests with routing"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        # API routes
        if path.startswith('/api/'):
            self.handle_api_request('GET', path, query_params)
        # SSE endpoints
        elif path.startswith('/events/'):
            self.handle_sse_request('GET', path, query_params)
        # Health check
        elif path == '/health':
            self.handle_health_check()
        # Static files or SPA fallback
        else:
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        if path.startswith('/api/'):
            self.handle_api_request('POST', path, query_params)
        else:
            self.send_error(404, "Not Found")
    
    def do_PUT(self):
        """Handle PUT requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        if path.startswith('/api/'):
            self.handle_api_request('PUT', path, query_params)
        else:
            self.send_error(404, "Not Found")
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        if path.startswith('/api/'):
            self.handle_api_request('DELETE', path, query_params)
        else:
            self.send_error(404, "Not Found")
    
    def handle_api_request(self, method, path, query_params):
        """Handle API requests"""
        try:
            if path == '/api/config' and method == 'GET':
                self.handle_get_config()
            elif path == '/api/config' and method == 'PUT':
                self.handle_update_config()
            elif path == '/api/serial/ports' and method == 'GET':
                self.handle_get_ports()
            elif path == '/api/serial/connect' and method == 'POST':
                self.handle_serial_connect()
            elif path == '/api/serial/disconnect' and method == 'POST':
                self.handle_serial_disconnect()
            elif path == '/api/pids' and method == 'GET':
                self.handle_get_pids()
            elif path == '/api/pids/load' and method == 'POST':
                self.handle_load_pids()
            else:
                self.send_error(404, f"API endpoint not found: {path}")
        except Exception as e:
            self.send_json_error(500, f"Server error: {str(e)}")
    
    def handle_sse_request(self, method, path, query_params):
        """Handle Server-Sent Events requests"""
        try:
            if method == 'GET':
                # Extract event type from path
                event_type = path.replace('/events/', '')
                SSEHandler.add_connection(event_type, self)
                # Send initial connection confirmation
                self.send_sse_event('connected', {'event_type': event_type})
                # Keep connection alive
                while not self.connection_closed:
                    time.sleep(1)
        except Exception as e:
            self.send_json_error(500, f"SSE error: {str(e)}")
    
    def handle_health_check(self):
        """Handle health check requests"""
        health_data = {
            'status': 'healthy',
            'timestamp': time.time(),
            'version': '1.0.0'
        }
        self.send_json_response(200, health_data)
    
    def handle_get_config(self):
        """Get current configuration"""
        config = Config.get_config()
        self.send_json_response(200, config)
    
    def handle_update_config(self):
        """Update configuration"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        config_data = json.loads(post_data.decode('utf-8'))
        
        Config.update_config(config_data)
        self.send_json_response(200, {'message': 'Configuration updated successfully'})
    
    def handle_get_ports(self):
        """Get available serial ports"""
        ports = SerialHandler.list_ports()
        self.send_json_response(200, {'ports': ports})
    
    def handle_serial_connect(self):
        """Connect to serial port"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        connect_data = json.loads(post_data.decode('utf-8'))
        
        port = connect_data.get('port')
        baudrate = connect_data.get('baudrate', Config.get_config()['serial']['baudrate'])
        
        SerialHandler.connect(port, baudrate)
        self.send_json_response(200, {'message': f'Connected to {port} at {baudrate} baud'})
    
    def handle_serial_disconnect(self):
        """Disconnect from serial port"""
        SerialHandler.disconnect()
        self.send_json_response(200, {'message': 'Disconnected from serial port'})
    
    def handle_get_pids(self):
        """Get loaded PIDs"""
        pids = SerialHandler.get_loaded_pids()
        self.send_json_response(200, {'pids': pids})
    
    def handle_load_pids(self):
        """Load PID data from files"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        load_data = json.loads(post_data.decode('utf-8'))
        
        manufacturer = load_data.get('manufacturer')
        if manufacturer:
            pids = SerialHandler.load_pids(manufacturer)
            self.send_json_response(200, {'message': f'Loaded PIDs for {manufacturer}', 'count': len(pids)})
        else:
            # Load all manufacturers
            pids = SerialHandler.load_all_pids()
            self.send_json_response(200, {'message': 'Loaded all PIDs', 'count': len(pids)})
    
    def send_json_response(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_json = json.dumps(data, indent=2)
        self.wfile.write(response_json.encode('utf-8'))
    
    def send_json_error(self, status_code, message):
        """Send JSON error response"""
        error_data = {'error': message}
        self.send_json_response(status_code, error_data)
    
    def send_sse_event(self, event_type, data):
        """Send Server-Sent Event"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        event_data = json.dumps(data)
        self.wfile.write(f'event: {event_type}\n'.encode('utf-8'))
        self.wfile.write(f'data: {event_data}\n\n'.encode('utf-8'))
        self.wfile.flush()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Override to add custom logging"""
        print(f"[{self.address_string()}] {format % args}")


def main():
    """Main server entry point"""
    config = Config()
    port = config.get('server.port', 8000)
    
    print(f"Starting OBD2 Diagnostic Server on port {port}")
    print(f"Static files served from: {Path(__file__).parent.parent / 'frontend'}")
    
    server = ThreadingHTTPServer(('', port), RESTRequestHandler)
    
    try:
        print("Server is running. Press Ctrl+C to stop.")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()