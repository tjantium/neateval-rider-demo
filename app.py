"""
Flask backend server for cycling neuroevolution simulation.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
from simulation import Simulation

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Global simulation instance
sim = Simulation()
sim.running = True  # Start running by default

# Simulation update thread
def simulation_loop():
    """Run simulation updates in background thread."""
    while True:
        sim.update()
        time.sleep(0.05)  # ~20 updates per second

sim_thread = threading.Thread(target=simulation_loop, daemon=True)
sim_thread.start()


@app.route('/api/state', methods=['GET', 'OPTIONS'])
def get_state():
    """Get current simulation state."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        return response
    return jsonify(sim.get_state())


@app.route('/api/controls', methods=['POST', 'OPTIONS'])
def update_controls():
    """Update simulation controls."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        return response
    data = request.json
    
    if 'race_distance' in data:
        sim.set_race_distance(float(data['race_distance']))
    
    if 'power_multiplier' in data:
        sim.set_power_multiplier(float(data['power_multiplier']))
    
    if 'mutation_size' in data:
        sim.set_mutation_size(float(data['mutation_size']))
    
    if 'num_weights_to_mutate' in data:
        sim.set_num_weights_to_mutate(int(data['num_weights_to_mutate']))
    
    if 'running' in data:
        sim.running = bool(data['running'])
    
    if 'force_evolution' in data and data['force_evolution']:
        sim.force_evolution()
    
    if 'reset' in data and data['reset']:
        sim.reset()
    
    return jsonify({'status': 'ok'})


@app.route('/api/select_rider', methods=['POST', 'OPTIONS'])
def select_rider():
    """Select a rider to view."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        return response
    data = request.json
    idx = data.get('index')
    if idx is not None and idx < 0:
        idx = None
    sim.set_selected_rider(idx)
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)

