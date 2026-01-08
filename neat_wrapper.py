"""
Wrapper to integrate NEAT with the cycling simulation.
Converts between NEAT genomes and the simulation's network interface.
"""
import neat
import numpy as np
from typing import List, Dict, Any


class NEATNetwork:
    """
    Wrapper around NEAT genome/phenotype to provide the same interface
    as SimpleNeuralNetwork for the simulation.
    """
    
    def __init__(self, genome, config):
        """
        Initialize NEAT network.
        
        Args:
            genome: NEAT genome object
            config: NEAT config object
        """
        self.genome = genome
        self.config = config
        self.phenotype = None
        self._build_phenotype()
    
    def _build_phenotype(self):
        """Build the phenotype (actual network) from genome."""
        self.phenotype = neat.nn.FeedForwardNetwork.create(self.genome, self.config)
    
    def forward(self, inputs):
        """
        Forward pass through the network.
        
        Args:
            inputs: Array of 7 input values
        
        Returns:
            Single output value (-1 to 1)
        """
        # NEAT networks output a list, we need a single value
        output = self.phenotype.activate(inputs)
        # Clamp to [-1, 1] range using tanh
        return np.tanh(output[0])
    
    def get_contribution(self, inputs):
        """
        Get contribution of each input to the output (for visualization).
        This traces through the actual network structure.
        
        Returns:
            List of 7 contribution values (positive/negative)
        """
        contributions = [0.0] * 7
        
        # Get output node ID (should be 7)
        output_node = 7
        
        # For each input, trace its contribution to output
        for input_idx in range(7):
            contrib = 0.0
            
            # Check for direct input->output connections
            if (input_idx, output_node) in self.genome.connections:
                conn = self.genome.connections[(input_idx, output_node)]
                if conn.enabled:
                    contrib += conn.weight * inputs[input_idx]
            
            # Trace through hidden nodes
            # Get all hidden nodes (node IDs >= 8)
            hidden_nodes = [node_id for node_id in self.genome.nodes.keys() if node_id >= 8]
            
            for hidden_node in hidden_nodes:
                # Check input->hidden connection
                if (input_idx, hidden_node) in self.genome.connections:
                    input_hidden_conn = self.genome.connections[(input_idx, hidden_node)]
                    if input_hidden_conn.enabled:
                        # Check hidden->output connection
                        if (hidden_node, output_node) in self.genome.connections:
                            hidden_output_conn = self.genome.connections[(hidden_node, output_node)]
                            if hidden_output_conn.enabled:
                                # Approximate contribution through this path
                                contrib += (input_hidden_conn.weight * 
                                          hidden_output_conn.weight * 
                                          inputs[input_idx] * 0.5)  # Scale down for multi-hop
            
            contributions[input_idx] = contrib
        
        return contributions
    
    def get_weights(self):
        """
        Get network structure and weights for visualization.
        Returns a dictionary compatible with the frontend visualization.
        """
        # Build a representation of the network structure
        # Input nodes: 0-6, Output node: 7, Hidden nodes: 8+
        
        # Get all nodes
        input_nodes = list(range(7))
        output_node = 7
        hidden_nodes = [node_id for node_id in self.genome.nodes.keys() if node_id >= 8]
        
        # Build connection matrices
        input_hidden = []
        hidden_output = []
        input_output = []  # Direct connections
        
        # Initialize matrices
        for i in range(7):
            input_hidden.append([0.0] * len(hidden_nodes))
            input_output.append(0.0)
        
        for h in range(len(hidden_nodes)):
            hidden_output.append(0.0)
        
        # Process connections
        for connection_key, connection in self.genome.connections.items():
            if not connection.enabled:
                continue
                
            input_id, output_id = connection_key
            weight = connection.weight
            
            if input_id < 7 and output_id == 7:
                # Direct input to output
                input_output[input_id] = weight
            elif input_id < 7 and output_id >= 8:
                # Input to hidden
                if output_id in hidden_nodes:
                    hidden_idx = hidden_nodes.index(output_id)
                    input_hidden[input_id][hidden_idx] = weight
            elif input_id >= 8 and output_id == 7:
                # Hidden to output
                if input_id in hidden_nodes:
                    hidden_idx = hidden_nodes.index(input_id)
                    hidden_output[hidden_idx] = weight
        
        # Get node biases (NEAT uses node responses/bias)
        hidden_bias = []
        for hidden_node_id in hidden_nodes:
            if hidden_node_id in self.genome.nodes:
                node = self.genome.nodes[hidden_node_id]
                # NEAT uses response value as bias
                hidden_bias.append(getattr(node, 'bias', 0.0))
            else:
                hidden_bias.append(0.0)
        
        # Output bias
        output_bias = 0.0
        if output_node in self.genome.nodes:
            output_node_obj = self.genome.nodes[output_node]
            output_bias = getattr(output_node_obj, 'bias', 0.0)
        
        # Convert to format expected by frontend
        return {
            'input_hidden': input_hidden,
            'hidden_output': hidden_output,
            'input_output': input_output,  # Direct connections
            'hidden_bias': hidden_bias,
            'output_bias': [output_bias],
            'hidden_nodes': hidden_nodes,  # List of hidden node IDs
            'num_hidden': len(hidden_nodes)
        }
    
    def copy(self):
        """Create a copy of this network (creates new genome)."""
        # This will be handled by NEAT's reproduction
        raise NotImplementedError("Use NEAT's reproduction instead")
    
    def mutate(self, mutation_size, num_weights_to_mutate):
        """
        Mutate the network. In NEAT, mutation is handled by the algorithm.
        This is kept for compatibility but doesn't do anything.
        """
        # NEAT handles mutation internally
        pass


def create_neat_config(config_path='neat_config.txt'):
    """Load NEAT configuration from file."""
    return neat.Config(neat.DefaultGenome, neat.DefaultReproduction,
                       neat.DefaultSpeciesSet, neat.DefaultStagnation,
                       config_path)


def create_neat_population(config, size=10):
    """
    Create a NEAT population.
    
    Args:
        config: NEAT config object
        size: Population size
    
    Returns:
        NEAT population object
    """
    return neat.Population(config)


def evaluate_genome(genome, config, fitness_function):
    """
    Evaluate a single genome and assign fitness.
    
    Args:
        genome: NEAT genome
        config: NEAT config
        fitness_function: Function that takes a NEATNetwork and returns fitness
    """
    network = NEATNetwork(genome, config)
    fitness = fitness_function(network)
    return fitness


def get_network_from_genome(genome, config):
    """Create a NEATNetwork from a genome."""
    return NEATNetwork(genome, config)

