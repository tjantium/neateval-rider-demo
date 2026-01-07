import React from 'react'
import './ControlPanel.css'

function ControlPanel({ controls, onUpdateControl, onForceEvolution, onReset }) {
  return (
    <div className="control-panel">
      <h2>Controls</h2>
      
      <div className="control-section">
        <h3>Race Settings</h3>
        
        <div className="control-item">
          <label>
            Race Distance: {controls.raceDistance}m
            <input
              type="range"
              min="1000"
              max="5000"
              step="100"
              value={controls.raceDistance}
              onChange={(e) => onUpdateControl('raceDistance', parseInt(e.target.value))}
            />
          </label>
        </div>

        <div className="control-item">
          <label>
            Power Multiplier: {controls.powerMultiplier}
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={controls.powerMultiplier}
              onChange={(e) => onUpdateControl('powerMultiplier', parseFloat(e.target.value))}
            />
          </label>
        </div>

        <div className="control-item">
          <label>
            Camera Zoom: {controls.cameraZoom}
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={controls.cameraZoom}
              onChange={(e) => onUpdateControl('cameraZoom', parseInt(e.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="control-section">
        <h3>Evolution Parameters</h3>
        
        <div className="control-item">
          <label>
            Mutation Size (σ): {controls.mutationSize.toFixed(1)}
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={controls.mutationSize}
              onChange={(e) => onUpdateControl('mutationSize', parseFloat(e.target.value))}
            />
          </label>
        </div>

        <div className="control-item">
          <label>
            Number of Weights to Mutate: {controls.numWeightsToMutate}
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={controls.numWeightsToMutate}
              onChange={(e) => onUpdateControl('numWeightsToMutate', parseInt(e.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="control-actions">
        <button onClick={onForceEvolution} className="action-button">
          Force Evolution
        </button>
        <button onClick={onReset} className="action-button reset-button">
          Reset Simulation
        </button>
      </div>
    </div>
  )
}

export default ControlPanel

