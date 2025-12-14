#!/usr/bin/env python3
"""
Server-Sent Events Handler
Manages SSE connections and broadcasting for data streaming
"""

import json
import threading
import time
from datetime import datetime
from typing import Dict, List


class SSEHandler:
    """Server-Sent Events connection manager"""
    
    _connections: Dict[str, List] = {}
    _connection_lock = threading.Lock()
    _heartbeat_thread = None
    _stop_heartbeat = False
    _heartbeat_interval = 30  # seconds
    
    @classmethod
    def add_connection(cls, event_type: str, connection):
        """
        Add a new SSE connection
        
        Args:
            event_type (str): Type of events for this connection
            connection: SSE connection object
        """
        with cls._connection_lock:
            if event_type not in cls._connections:
                cls._connections[event_type] = []
            cls._connections[event_type].append(connection)
        
        print(f"Added SSE connection for event type: {event_type}")
        
        # Start heartbeat thread if not already running
        if cls._heartbeat_thread is None or not cls._heartbeat_thread.is_alive():
            cls._start_heartbeat()
    
    @classmethod
    def remove_connection(cls, event_type: str, connection):
        """
        Remove an SSE connection
        
        Args:
            event_type (str): Type of events for this connection
            connection: SSE connection to remove
        """
        with cls._connection_lock:
            if event_type in cls._connections:
                try:
                    cls._connections[event_type].remove(connection)
                    if not cls._connections[event_type]:
                        del cls._connections[event_type]
                except ValueError:
                    pass  # Connection already removed
        
        print(f"Removed SSE connection for event type: {event_type}")
    
    @classmethod
    def broadcast(cls, event_type: str, data):
        """
        Broadcast data to all connections of a specific event type
        
        Args:
            event_type (str): Type of event to broadcast
            data: Data to broadcast (will be JSON serialized)
        """
        with cls._connection_lock:
            connections = cls._connections.get(event_type, [])
        
        if not connections:
            return
        
        # Prepare broadcast message
        message = {
            'event': event_type,
            'data': data,
            'timestamp': time.time()
        }
        
        # Send to all connections
        dead_connections = []
        for connection in connections:
            try:
                connection.send_sse_event(event_type, data)
            except Exception as e:
                print(f"Failed to send SSE to connection: {e}")
                dead_connections.append(connection)
        
        # Clean up dead connections
        if dead_connections:
            with cls._connection_lock:
                for dead_conn in dead_connections:
                    try:
                        cls._connections[event_type].remove(dead_conn)
                    except (ValueError, KeyError):
                        pass
                
                if event_type in cls._connections and not cls._connections[event_type]:
                    del cls._connections[event_type]
    
    @classmethod
    def broadcast_to_all(cls, data):
        """
        Broadcast data to all SSE connections regardless of event type
        
        Args:
            data: Data to broadcast
        """
        with cls._connection_lock:
            event_types = list(cls._connections.keys())
        
        for event_type in event_types:
            cls.broadcast(event_type, data)
    
    @classmethod
    def get_connection_count(cls, event_type: str = None) -> int:
        """
        Get number of active connections
        
        Args:
            event_type (str): Specific event type, or None for all connections
        
        Returns:
            int: Number of active connections
        """
        with cls._connection_lock:
            if event_type:
                return len(cls._connections.get(event_type, []))
            else:
                return sum(len(conns) for conns in cls._connections.values())
    
    @classmethod
    def get_active_event_types(cls) -> List[str]:
        """
        Get list of event types with active connections
        
        Returns:
            List[str]: List of active event types
        """
        with cls._connection_lock:
            return list(cls._connections.keys())
    
    @classmethod
    def _start_heartbeat(cls):
        """Start the heartbeat thread"""
        cls._stop_heartbeat = False
        cls._heartbeat_thread = threading.Thread(target=cls._heartbeat_loop)
        cls._heartbeat_thread.daemon = True
        cls._heartbeat_thread.start()
        print("SSE heartbeat thread started")
    
    @classmethod
    def _heartbeat_loop(cls):
        """Heartbeat loop to keep connections alive"""
        while not cls._stop_heartbeat:
            try:
                time.sleep(cls._heartbeat_interval)
                
                with cls._connection_lock:
                    if not cls._connections:
                        break  # No connections, stop heartbeat
                
                # Send heartbeat to all connections
                heartbeat_data = {
                    'type': 'heartbeat',
                    'timestamp': time.time(),
                    'datetime': datetime.now().isoformat(),
                    'connections': cls.get_connection_count()
                }
                
                cls.broadcast_to_all(heartbeat_data)
                
            except Exception as e:
                print(f"Heartbeat error: {e}")
                break
        
        print("SSE heartbeat thread stopped")
    
    @classmethod
    def stop_heartbeat(cls):
        """Stop the heartbeat thread"""
        cls._stop_heartbeat = True
        if cls._heartbeat_thread and cls._heartbeat_thread.is_alive():
            cls._heartbeat_thread.join(timeout=2.0)
    
    @classmethod
    def reset(cls):
        """Reset all connections and stop heartbeat"""
        cls.stop_heartbeat()
        with cls._connection_lock:
            cls._connections.clear()
        print("SSE handler reset")


# Convenience functions for common event types
def broadcast_obd_data(data):
    """Broadcast OBD2 data"""
    SSEHandler.broadcast('obd-data', data)


def broadcast_connection_status(status):
    """Broadcast connection status changes"""
    SSEHandler.broadcast('connection-status', {
        'status': status,
        'timestamp': time.time()
    })


def broadcast_error(error_message):
    """Broadcast error messages"""
    SSEHandler.broadcast('error', {
        'message': error_message,
        'timestamp': time.time()
    })


def broadcast_pid_update(manufacturer, count):
    """Broadcast PID loading updates"""
    SSEHandler.broadcast('pid-update', {
        'manufacturer': manufacturer,
        'count': count,
        'timestamp': time.time()
    })