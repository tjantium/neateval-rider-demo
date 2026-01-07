"""
Evolution system for rider populations.
"""
import random
from rider import Rider
from neural_network import SimpleNeuralNetwork, create_random_network


# Rider names pool
RIDER_NAMES = [
    "Chris", "Sepp", "Simon", "Julian", "Nicole",
    "Tadej", "Mathieu", "Geraint", "Mark", "Eddy"
]


def create_initial_population(size=10):
    """Create initial population of riders with random neural networks."""
    riders = []
    for i in range(size):
        name = RIDER_NAMES[i % len(RIDER_NAMES)]
        network = create_random_network()
        rider = Rider(name, network)
        rider.id = i  # Give each rider a unique ID
        riders.append(rider)
    return riders


def select_top_riders(riders, num_top=5):
    """
    Select top N riders based on position.
    
    Args:
        riders: List of riders
        num_top: Number of top riders to select
    
    Returns:
        List of top riders sorted by position (descending)
    """
    sorted_riders = sorted(riders, key=lambda r: r.position, reverse=True)
    return sorted_riders[:num_top]


def evolve_population(top_riders, population_size=10, mutation_size=1.0, num_weights_to_mutate=20):
    """
    Evolve population from top riders.
    
    Args:
        top_riders: List of top-performing riders
        population_size: Size of new population
        mutation_size: Standard deviation for mutations
        num_weights_to_mutate: Number of weights to mutate per mutated individual
    
    Returns:
        New population of riders
    """
    new_population = []
    
    # Keep some exact copies - but give them unique names
    num_copies = min(len(top_riders), population_size // 2)
    for i in range(num_copies):
        rider = top_riders[i % len(top_riders)]
        new_rider = Rider(rider.name, rider.network.copy())
        new_rider.id = len(new_population)  # Unique ID
        # Ensure unique name by cycling through names
        name_idx = len(new_population) % len(RIDER_NAMES)
        new_rider.name = RIDER_NAMES[name_idx]
        new_population.append(new_rider)
    
    # Create mutated versions
    while len(new_population) < population_size:
        # Select a parent (prefer better performers)
        parent_idx = random.choices(
            range(len(top_riders)),
            weights=[len(top_riders) - i for i in range(len(top_riders))],
            k=1
        )[0]
        
        parent = top_riders[parent_idx]
        
        # Create mutated copy
        new_network = parent.network.copy()
        new_network.mutate(mutation_size, num_weights_to_mutate)
        
        # Assign unique name - use parent name but add a variant indicator
        # Cycle through names to ensure variety
        name_idx = len(new_population) % len(RIDER_NAMES)
        new_name = RIDER_NAMES[name_idx]
        
        new_rider = Rider(new_name, new_network)
        new_rider.id = len(new_population)  # Unique ID
        new_population.append(new_rider)
    
    return new_population


def reset_riders(riders):
    """Reset all riders to starting state."""
    from physics import AEROBIC_THRESHOLD, WPRIME
    
    for rider in riders:
        rider.position = 0.0
        rider.velocity = 0.0
        rider.power = AEROBIC_THRESHOLD
        rider.battery = WPRIME
        rider.max_speed = 0.0
        rider.total_energy = 0.0

