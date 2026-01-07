"""
Main simulation engine.
"""
import time
from terrain import Terrain
from rider import Rider
from physics import simulate_timestep
from evolution import create_initial_population, select_top_riders, evolve_population, reset_riders


class Simulation:
    def __init__(self, race_distance=2000.0, power_multiplier=5.0, seed=None):
        """
        Initialize simulation.
        
        Args:
            race_distance: Race distance in meters
            power_multiplier: Multiplier for power changes
            seed: Random seed for terrain generation
        """
        self.race_distance = race_distance
        self.power_multiplier = power_multiplier
        self.seed = seed if seed is not None else int(time.time())
        
        # Create terrain
        self.terrain = Terrain(race_distance, self.seed)
        
        # Create initial population
        self.riders = create_initial_population(10)
        
        # Simulation state
        self.running = False
        self.generation = 0
        self.selected_rider_idx = None
        self.dt = 0.1  # Time step in seconds
        self.last_update = time.time()
        
        # Evolution parameters
        self.mutation_size = 1.0
        self.num_weights_to_mutate = 20
        
        # Track evolution history
        self.previous_generation_weights = {}  # Store previous gen weights for comparison
    
    def update(self):
        """Update simulation by one timestep."""
        if not self.running:
            return
        
        # Update each rider
        for rider in self.riders:
            # Get neural network inputs
            inputs = rider.get_inputs(self.terrain, self.riders, self.race_distance)
            
            # Get power change from neural network
            power_change = rider.network.forward(inputs)
            
            # Update rider power
            rider.update_power(power_change, self.power_multiplier)
            
            # Simulate physics
            simulate_timestep(rider, self.terrain, self.riders, self.dt, self.power_multiplier)
            
            # Update stats
            rider.max_speed = max(rider.max_speed, rider.velocity)
            rider.total_energy += rider.power * self.dt
        
        # Check if race is finished
        max_position = max(rider.position for rider in self.riders)
        if max_position >= self.race_distance:
            self.finish_race()
    
    def finish_race(self):
        """Finish current race and evolve population."""
        # Store previous generation weights for comparison (by rider name)
        self.previous_generation_weights = {}
        for rider in self.riders:
            self.previous_generation_weights[rider.name] = rider.network.get_weights()
        
        # Select top 5 riders
        top_riders = select_top_riders(self.riders, 5)
        
        # Evolve population
        self.riders = evolve_population(
            top_riders,
            population_size=10,
            mutation_size=self.mutation_size,
            num_weights_to_mutate=self.num_weights_to_mutate
        )
        
        # Clear selection since riders have changed
        self.selected_rider_idx = None
        
        # Reset riders
        reset_riders(self.riders)
        
        # Generate new terrain
        self.seed = int(time.time())
        self.terrain = Terrain(self.race_distance, self.seed)
        
        # Increment generation
        self.generation += 1
    
    def force_evolution(self):
        """Force evolution before race distance is reached."""
        self.finish_race()
    
    def reset(self):
        """Reset simulation with new riders and terrain."""
        self.seed = int(time.time())
        self.terrain = Terrain(self.race_distance, self.seed)
        self.riders = create_initial_population(10)
        self.generation = 0
        self.selected_rider_idx = None
        reset_riders(self.riders)
    
    def get_state(self):
        """Get current simulation state for API."""
        # Sort riders by position
        sorted_riders = sorted(self.riders, key=lambda r: r.position, reverse=True)
        
        # Get selected rider info
        selected_rider = None
        selected_network_info = None
        selected_sorted_idx = None
        
        if self.selected_rider_idx is not None and 0 <= self.selected_rider_idx < len(self.riders):
            # Get the actual rider from the original list
            try:
                selected_rider = self.riders[self.selected_rider_idx]
                # Find its position in sorted list
                try:
                    selected_sorted_idx = sorted_riders.index(selected_rider)
                except ValueError:
                    selected_sorted_idx = None
            except (IndexError, AttributeError):
                selected_rider = None
                selected_sorted_idx = None
            
            if selected_rider and hasattr(selected_rider, 'network'):
                try:
                    inputs = selected_rider.get_inputs(self.terrain, self.riders, self.race_distance)
                    contributions = selected_rider.network.get_contribution(inputs)
                    
                    # Get hidden node values
                    import numpy as np
                    inputs_arr = np.array(inputs).reshape(-1, 1)
                    hidden = np.dot(selected_rider.network.input_hidden.T, inputs_arr) + selected_rider.network.hidden_bias.reshape(-1, 1)
                    hidden_activated = selected_rider.network.activate(hidden)
                    
                    # Get current weights
                    current_weights = selected_rider.network.get_weights()
                    
                    # Calculate weight changes if we have previous generation data
                    weight_changes = None
                    try:
                        if self.previous_generation_weights:
                            # Match by rider name (most reliable since we store by name)
                            prev_weights = self.previous_generation_weights.get(selected_rider.name)
                            
                            if prev_weights:
                                weight_changes = self._calculate_weight_changes(prev_weights, current_weights)
                    except Exception as e:
                        # If weight change calculation fails, just continue without it
                        print(f"Warning: Could not calculate weight changes: {e}")
                        weight_changes = None
                    
                    selected_network_info = {
                        'inputs': inputs,
                        'input_names': ['Speed', 'Power', 'Anaerobic Battery', 'Avg Gradient 100m', 
                                       'Avg Gradient 1000m', 'Rider Ahead', 'Race Progress'],
                        'contributions': contributions,
                        'hidden_values': hidden_activated.flatten().tolist(),
                        'output': selected_rider.network.forward(inputs),
                        'weights': current_weights,
                        'weight_changes': weight_changes  # Show what changed from previous generation
                    }
                except Exception as e:
                    # If there's an error generating network info, log it but don't crash
                    import traceback
                    print(f"Error generating network info for {selected_rider.name}: {e}")
                    traceback.print_exc()
                    selected_network_info = None
        
        # Debug: Print selection info
        if selected_rider:
            print(f"Selected rider: {selected_rider.name}, Index: {self.selected_rider_idx}, Sorted idx: {selected_sorted_idx}, Network info: {'Yes' if selected_network_info else 'No'}")
        elif self.selected_rider_idx is not None:
            print(f"Warning: selected_rider_idx={self.selected_rider_idx} but rider not found (total riders: {len(self.riders)})")
        
        return {
            'riders': [rider.get_stats() for rider in sorted_riders],
            'generation': self.generation,
            'race_distance': self.race_distance,
            'max_position': max(rider.position for rider in self.riders) if self.riders else 0.0,
            'running': self.running,
            'selected_rider': selected_rider.get_stats() if selected_rider else None,
            'selected_rider_idx': selected_sorted_idx,  # Return sorted index for frontend
            'network_info': selected_network_info,
            'terrain': {
                'distance': self.terrain.distance,
                'gradient_points': [(x, g) for x, g in self.terrain.gradient_points]
            }
        }
    
    def set_selected_rider(self, idx):
        """Set selected rider index (idx is position in sorted leaderboard)."""
        if idx is None or idx < 0:
            self.selected_rider_idx = None
            return
        
        # Sort riders by position
        sorted_riders = sorted(self.riders, key=lambda r: r.position, reverse=True)
        if 0 <= idx < len(sorted_riders):
            rider = sorted_riders[idx]
            self.selected_rider_idx = self.riders.index(rider)
    
    def set_race_distance(self, distance):
        """Set race distance and regenerate terrain."""
        self.race_distance = distance
        self.terrain = Terrain(distance, self.seed)
    
    def set_power_multiplier(self, multiplier):
        """Set power multiplier."""
        self.power_multiplier = multiplier
    
    def set_mutation_size(self, size):
        """Set mutation size."""
        self.mutation_size = size
    
    def set_num_weights_to_mutate(self, num):
        """Set number of weights to mutate."""
        self.num_weights_to_mutate = num
    
    def _calculate_weight_changes(self, prev_weights, current_weights):
        """Calculate how weights changed from previous generation."""
        changes = {
            'input_hidden': [],
            'hidden_bias': [],
            'hidden_output': [],
            'output_bias': [current_weights['output_bias'][0] - prev_weights['output_bias'][0]]
        }
        
        # Calculate input_hidden changes
        for i in range(len(current_weights['input_hidden'])):
            row_changes = []
            for j in range(len(current_weights['input_hidden'][i])):
                change = current_weights['input_hidden'][i][j] - prev_weights['input_hidden'][i][j]
                row_changes.append(change)
            changes['input_hidden'].append(row_changes)
        
        # Calculate hidden_bias changes
        for i in range(len(current_weights['hidden_bias'])):
            change = current_weights['hidden_bias'][i] - prev_weights['hidden_bias'][i]
            changes['hidden_bias'].append(change)
        
        # Calculate hidden_output changes
        for i in range(len(current_weights['hidden_output'])):
            change = current_weights['hidden_output'][i][0] - prev_weights['hidden_output'][i][0]
            changes['hidden_output'].append(change)
        
        return changes

