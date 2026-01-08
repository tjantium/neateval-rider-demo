"""
Evolution system using NEAT (NeuroEvolution of Augmenting Topologies).
"""
import random
import neat
from rider import Rider
from neat_wrapper import NEATNetwork, create_neat_config, get_network_from_genome


# Rider names pool
RIDER_NAMES = [
    "Chris", "Sepp", "Simon", "Julian", "Nicole",
    "Tadej", "Mathieu", "Geraint", "Mark", "Eddy"
]


class NEATEvolution:
    """
    Manages NEAT evolution for the cycling simulation.
    """
    
    def __init__(self, config_path='neat_config.txt', population_size=10):
        """
        Initialize NEAT evolution system.
        
        Args:
            config_path: Path to NEAT config file
            population_size: Size of population
        """
        self.config = create_neat_config(config_path)
        self.config.pop_size = population_size
        self.population = neat.Population(self.config)
        self.generation = 0
        
        # Add reporters for progress tracking
        self.population.add_reporter(neat.StdOutReporter(False))  # Disable verbose output
        
        # Store current generation's genomes and their fitness
        self.current_genomes = []
        self.genome_to_rider = {}  # Map genome_id to rider
    
    def create_riders_from_population(self):
        """
        Create riders from current NEAT population.
        
        Returns:
            List of Rider objects
        """
        riders = []
        self.current_genomes = list(self.population.population.items())
        self.genome_to_rider = {}
        
        for genome_id, genome in self.current_genomes:
            # Create network from genome
            network = get_network_from_genome(genome, self.config)
            
            # Assign name
            name_idx = len(riders) % len(RIDER_NAMES)
            name = RIDER_NAMES[name_idx]
            
            # Create rider
            rider = Rider(name, network)
            rider.id = genome_id
            rider.genome_id = genome_id  # Store for later fitness assignment
            
            riders.append(rider)
            self.genome_to_rider[genome_id] = rider
        
        return riders
    
    def assign_fitness_from_riders(self, riders):
        """
        Assign fitness to genomes based on rider performance.
        Fitness is based on final position in the race.
        
        Args:
            riders: List of Rider objects after race completion
        """
        # Sort riders by position (best first)
        sorted_riders = sorted(riders, key=lambda r: r.position, reverse=True)
        
        # Assign fitness based on position
        # Best rider gets highest fitness
        for i, rider in enumerate(sorted_riders):
            if hasattr(rider, 'genome_id') and rider.genome_id in self.population.population:
                genome = self.population.population[rider.genome_id]
                # Fitness = position (in meters) + bonus for top performers
                fitness = rider.position
                # Add small bonus for top 3 to encourage competition
                if i < 3:
                    fitness += (3 - i) * 10.0
                genome.fitness = fitness
    
    def evolve(self):
        """
        Evolve to next generation using NEAT.
        
        Returns:
            List of new Rider objects
        """
        # Use NEAT's reproduction to create next generation
        # This handles speciation, crossover, and mutation
        self.population.species.speciate(self.config, self.population.population, self.generation)
        self.population.population = self.population.reproduction.reproduce(
            self.config, 
            self.population.species, 
            self.config.pop_size,
            self.generation
        )
        self.generation += 1
        
        # Create new riders from evolved population
        return self.create_riders_from_population()
    
    def get_best_genome(self):
        """Get the best genome from current population."""
        if not self.current_genomes:
            return None
        
        # Find genome with highest fitness
        best_genome = None
        best_fitness = float('-inf')
        
        for genome_id, genome in self.current_genomes:
            if genome.fitness is not None and genome.fitness > best_fitness:
                best_fitness = genome.fitness
                best_genome = genome
        
        return best_genome
    
    def reset_population(self):
        """Reset to initial population (new random genomes)."""
        self.population = neat.Population(self.config)
        self.generation = 0
        self.current_genomes = []
        self.genome_to_rider = {}


# Global NEAT evolution instance
_neat_evolution = None


def initialize_neat_evolution(config_path='neat_config.txt', population_size=10):
    """Initialize the global NEAT evolution system."""
    global _neat_evolution
    _neat_evolution = NEATEvolution(config_path, population_size)
    return _neat_evolution


def get_neat_evolution():
    """Get the global NEAT evolution instance."""
    global _neat_evolution
    if _neat_evolution is None:
        _neat_evolution = initialize_neat_evolution()
    return _neat_evolution


def create_initial_population(size=10):
    """Create initial population of riders using NEAT."""
    evolution = get_neat_evolution()
    return evolution.create_riders_from_population()


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


def evolve_population(riders, population_size=10, mutation_size=1.0, num_weights_to_mutate=20):
    """
    Evolve population using NEAT.
    
    Args:
        riders: List of riders from current race
        population_size: Size of population (ignored, uses NEAT config)
        mutation_size: Mutation size (ignored, uses NEAT config)
        num_weights_to_mutate: Number of weights to mutate (ignored, uses NEAT config)
    
    Returns:
        New population of riders
    """
    evolution = get_neat_evolution()
    
    # Assign fitness to genomes based on rider performance
    evolution.assign_fitness_from_riders(riders)
    
    # Evolve to next generation
    new_riders = evolution.evolve()
    
    return new_riders


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


def reset_evolution():
    """Reset the evolution system (creates new random population)."""
    evolution = get_neat_evolution()
    evolution.reset_population()
    return evolution.create_riders_from_population()
