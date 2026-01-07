#!/bin/bash

# Start backend server with conda environment

echo "Activating conda environment: neat-back"
source $(conda info --base)/etc/profile.d/conda.sh
conda activate neat-back

echo "Starting backend server on http://localhost:5000"
cd /Users/thiwankajayasiri/Documents/GitHub/neateval-rider-demo
python app.py

