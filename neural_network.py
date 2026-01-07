"""
Simple neural network implementation for rider control.
This is a simplified version - for full NEAT, we'd use neat-python library.
"""
import numpy as np
import random
import json


class SimpleNeuralNetwork:
    """
    A simple feedforward neural network with:
    - 7 inputs
    - 3 hidden nodes
    - 1 output
    """
    
    def __init__(self, weights=None):
        """
        Initialize network.
        
        Args:
            weights: Optional dict with 'input_hidden' and 'hidden_output' weight matrices
        """
        if weights is None:
            # Random initialization
            self.input_hidden = np.random.randn(7, 3) * 0.5
            self.hidden_bias = np.random.randn(3) * 0.1
            self.hidden_output = np.random.randn(3, 1) * 0.5
            self.output_bias = np.random.randn(1) * 0.1
        else:
            self.input_hidden = np.array(weights['input_hidden'])
            self.hidden_bias = np.array(weights['hidden_bias'])
            self.hidden_output = np.array(weights['hidden_output'])
            self.output_bias = np.array(weights['output_bias'])
    
    def activate(self, x):
        """Tanh activation function."""
        return np.tanh(x)
    
    def forward(self, inputs):
        """
        Forward pass through the network.
        
        Args:
            inputs: Array of 7 input values
        
        Returns:
            Single output value (-1 to 1)
        """
        inputs = np.array(inputs).reshape(-1, 1)
        
        # Input to hidden
        hidden = np.dot(self.input_hidden.T, inputs) + self.hidden_bias.reshape(-1, 1)
        hidden_activated = self.activate(hidden)
        
        # Hidden to output
        output = np.dot(self.hidden_output.T, hidden_activated) + self.output_bias
        output_activated = self.activate(output)
        
        return output_activated[0, 0]
    
    def get_contribution(self, inputs):
        """
        Get contribution of each input to the output (for visualization).
        
        Returns:
            List of 7 contribution values (positive/negative)
        """
        inputs = np.array(inputs).reshape(-1, 1)
        
        # Calculate contribution through hidden layer
        hidden = np.dot(self.input_hidden.T, inputs) + self.hidden_bias.reshape(-1, 1)
        hidden_activated = self.activate(hidden)
        
        # Contribution of each input = sum of (input * weight * hidden_output) for each hidden node
        contributions = []
        for i in range(7):
            contrib = 0.0
            for h in range(3):
                contrib += inputs[i, 0] * self.input_hidden[i, h] * self.hidden_output[h, 0]
            contributions.append(contrib)
        
        return contributions
    
    def get_weights(self):
        """Get all weights as a dictionary."""
        return {
            'input_hidden': self.input_hidden.tolist(),
            'hidden_bias': self.hidden_bias.tolist(),
            'hidden_output': self.hidden_output.tolist(),
            'output_bias': self.output_bias.tolist()
        }
    
    def mutate(self, mutation_size, num_weights_to_mutate):
        """
        Mutate the network by randomly modifying weights.
        
        Args:
            mutation_size: Standard deviation of mutation (sigma)
            num_weights_to_mutate: Number of weights to mutate
        """
        total_weights = (7 * 3) + 3 + (3 * 1) + 1  # input_hidden + hidden_bias + hidden_output + output_bias
        
        # Select random weights to mutate
        weights_to_mutate = random.sample(range(total_weights), min(num_weights_to_mutate, total_weights))
        
        weight_idx = 0
        
        # Mutate input_hidden weights
        for i in range(7):
            for j in range(3):
                if weight_idx in weights_to_mutate:
                    self.input_hidden[i, j] += np.random.normal(0, mutation_size)
                weight_idx += 1
        
        # Mutate hidden_bias
        for i in range(3):
            if weight_idx in weights_to_mutate:
                self.hidden_bias[i] += np.random.normal(0, mutation_size)
            weight_idx += 1
        
        # Mutate hidden_output weights
        for i in range(3):
            if weight_idx in weights_to_mutate:
                self.hidden_output[i, 0] += np.random.normal(0, mutation_size)
            weight_idx += 1
        
        # Mutate output_bias
        if weight_idx in weights_to_mutate:
            self.output_bias[0] += np.random.normal(0, mutation_size)
    
    def copy(self):
        """Create a copy of this network."""
        return SimpleNeuralNetwork(self.get_weights())


def create_random_network():
    """Create a new random neural network."""
    return SimpleNeuralNetwork()

