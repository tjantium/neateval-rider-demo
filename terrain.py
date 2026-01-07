"""
Terrain generation and gradient calculation.
"""
import numpy as np
import random


class Terrain:
    def __init__(self, distance, seed=None):
        """
        Generate random terrain for a race.
        
        Args:
            distance: Total race distance in meters
            seed: Random seed for reproducibility
        """
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
        
        self.distance = distance
        self.seed = seed
        
        # Generate terrain profile using multi-scale noise
        # Create a series of control points
        num_points = int(distance / 50) + 1  # One point every 50m
        x = np.linspace(0, distance, num_points)
        
        # Generate terrain using multiple frequency layers for more interesting terrain
        gradients = np.zeros(num_points)
        
        # Layer 1: Large-scale features (hills, valleys) - every ~500m
        if num_points > 10:
            large_scale = np.random.normal(0, 4, num_points // 10 + 1)
            # Interpolate to full resolution
            large_scale_interp = np.interp(x, np.linspace(0, distance, len(large_scale)), large_scale)
            gradients += large_scale_interp * 0.5
        
        # Layer 2: Medium-scale features (rolling hills) - every ~200m
        if num_points > 5:
            medium_scale = np.random.normal(0, 2.5, num_points // 4 + 1)
            medium_scale_interp = np.interp(x, np.linspace(0, distance, len(medium_scale)), medium_scale)
            gradients += medium_scale_interp * 0.3
        
        # Layer 3: Small-scale features (variation) - every ~50m
        small_scale = np.random.normal(0, 1.5, num_points)
        gradients += small_scale * 0.2
        
        # Smooth the gradients with multiple passes for natural transitions
        for _ in range(3):  # Multiple smoothing passes
            smoothed = gradients.copy()
            for i in range(1, num_points - 1):
                # Weighted average with neighbors
                smoothed[i] = 0.5 * gradients[i] + 0.25 * gradients[i-1] + 0.25 * gradients[i+1]
            gradients = smoothed
        
        # Clamp extreme gradients to realistic cycling values (-15% to +15%)
        gradients = np.clip(gradients, -15, 15)
        
        # Store gradient at each point
        self.gradient_points = list(zip(x, gradients))
    
    def get_gradient(self, position):
        """
        Get gradient at a specific position.
        
        Args:
            position: Position along track in meters
        
        Returns:
            Gradient as percentage (e.g., 5.0 = 5% uphill)
        """
        if position <= 0:
            return self.gradient_points[0][1]
        if position >= self.distance:
            return self.gradient_points[-1][1]
        
        # Linear interpolation between nearest points
        for i in range(len(self.gradient_points) - 1):
            x1, g1 = self.gradient_points[i]
            x2, g2 = self.gradient_points[i + 1]
            
            if x1 <= position <= x2:
                # Linear interpolation
                t = (position - x1) / (x2 - x1) if x2 != x1 else 0
                return g1 + t * (g2 - g1)
        
        return 0.0
    
    def get_average_gradient(self, position, distance):
        """
        Get average gradient over a distance ahead.
        
        Args:
            position: Current position
            distance: Distance ahead to average over
        
        Returns:
            Average gradient as percentage
        """
        samples = max(10, int(distance / 10))
        total_gradient = 0.0
        
        for i in range(samples):
            sample_pos = position + (i / samples) * distance
            total_gradient += self.get_gradient(sample_pos)
        
        return total_gradient / samples

