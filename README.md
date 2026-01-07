# Cycling Neuroevolution Simulation

An interactive simulation demonstrating neuroevolution applied to cycling races using NEAT (NeuroEvolution of Augmenting Topologies).

## Features

- Real-time cycling race simulation with physics-based mechanics
- Neural network-controlled riders that evolve over generations
- Interactive visualization of neural networks and race progress
- Configurable evolution parameters and race settings

## Setup

### Quick Start

```bash
# Make start script executable (if needed)
chmod +x start.sh

# Run the application (starts both backend and frontend)
./start.sh
```

Or manually:

### Backend (Python)

**Using Conda (recommended if you have a conda environment):**

```bash
# Activate your conda environment
conda activate neat-back

# Start server
python app.py
```

Or use the startup script:
```bash
./start_backend.sh
```

**Using virtual environment:**

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
python app.py
```

The backend will run on http://localhost:5000

### Frontend (Node.js)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will run on http://localhost:3000

## Usage

1. Start the backend server (runs on port 5000)
2. Start the frontend dev server (runs on port 3000)
3. Open http://localhost:3000 in your browser
4. Watch riders evolve and improve their strategies over multiple races!

## Controls

- Click or use up/down arrow keys to select a rider and see their neural controller
- Press 'r' or wait to return to default race view showing top 5 riders
- Space to force evolution before race distance
- Reload (Ctrl+R or Cmd+R) to reset with new riders and randomly generated terrain

## Credits & Citations

### Inspiration

This project is inspired by and is a replication/tweak of the original **Cycling Neuroevolution** simulation created by **Andrew Davison** (Imperial College London, 2025).

- **Original Demo**: https://www.doc.ic.ac.uk/~ajd/Cycling/
- **Original Twitter Post**: https://x.com/AjdDavison/status/2006038878986129765

### Author

**Thiwanka Jayasiri** - For educational purposes

This repository is a reimplementation and modification of Andrew Davison's cycling neuroevolution simulation, adapted to use NEAT (NeuroEvolution of Augmenting Topologies) for neural network evolution.

### Libraries & Packages

- **neat-python** (v0.92): [NEAT-Python](https://github.com/CodeReclaimers/neat-python) - NeuroEvolution of Augmenting Topologies implementation for Python
