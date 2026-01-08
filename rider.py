"""
Rider class with neural network controller.
Supports both NEAT networks and simple networks.
"""
import numpy as np
import random
from physics import AEROBIC_THRESHOLD, WPRIME


class Rider:
    def __init__(self, name, network=None):
        """
        Initialize a rider.
        
        Args:
            name: Rider name
            network: Neural network (NEATNetwork or SimpleNeuralNetwork)
        """
        self.name = name
        if network is None:
            # Fallback: create simple network if NEAT not available
            try:
                from neural_network import create_random_network
                self.network = create_random_network()
            except ImportError:
                raise ValueError("Network must be provided")
        else:
            self.network = network
        
        # Physical state
        self.position = 0.0  # meters
        self.velocity = 0.0  # m/s
        self.power = AEROBIC_THRESHOLD  # W (start at aerobic threshold)
        self.battery = WPRIME  # J (start with full battery)
        
        # Stats
        self.max_speed = 0.0
        self.total_energy = 0.0
    
    def get_inputs(self, terrain, riders, race_distance):
        """
        Get neural network inputs (percepts).
        
        Returns:
            List of 7 input values:
            - Speed (normalized)
            - Power (normalized)
            - Anaerobic battery (normalized)
            - Avg gradient 100m (normalized)
            - Avg gradient 1000m (normalized)
            - Distance to rider ahead (normalized)
            - Race progress (0-1)
        """
        # Normalize speed (assume max ~25 m/s = 90 km/h)
        speed_norm = min(1.0, self.velocity / 25.0)
        
        # Normalize power (max is MAX_SPRINT_POWER = 750W)
        power_norm = min(1.0, self.power / 750.0)
        
        # Normalize battery (0-1)
        battery_norm = self.battery / WPRIME
        
        # Get gradients
        grad_100m = terrain.get_average_gradient(self.position, 100.0)
        grad_1000m = terrain.get_average_gradient(self.position, 1000.0)
        # Normalize gradients (assume range -10% to +10%)
        grad_100m_norm = (grad_100m + 10.0) / 20.0
        grad_1000m_norm = (grad_1000m + 10.0) / 20.0
        
        # Distance to rider ahead
        distance_ahead = float('inf')
        for rider in riders:
            if rider.position > self.position and rider != self:
                distance_ahead = min(distance_ahead, rider.position - self.position)
        # Normalize (assume max 100m)
        distance_ahead_norm = min(1.0, distance_ahead / 100.0) if distance_ahead < float('inf') else 1.0
        
        # Race progress
        progress = min(1.0, self.position / race_distance) if race_distance > 0 else 0.0
        
        return [
            speed_norm,
            power_norm,
            battery_norm,
            grad_100m_norm,
            grad_1000m_norm,
            distance_ahead_norm,
            progress
        ]
    
    def update_power(self, power_change, power_multiplier):
        """
        Update power based on neural network output.
        
        Args:
            power_change: Output from neural network (-1 to 1)
            power_multiplier: Scaling factor for power changes
        """
        # Scale the change
        delta_power = power_change * power_multiplier
        
        # Update power (clamp to reasonable range)
        self.power = max(0.0, min(750.0, self.power + delta_power))
    
    def get_stats(self):
        """Get current rider statistics."""
        return {
            'name': self.name,
            'position': self.position,
            'velocity': self.velocity * 3.6,  # Convert to km/h
            'power': self.power,
            'battery': self.battery,
            'battery_percent': (self.battery / WPRIME) * 100.0,
            'max_speed': self.max_speed * 3.6
        }

