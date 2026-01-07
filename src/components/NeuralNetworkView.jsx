import React from 'react'
import './NeuralNetworkView.css'
import NeuralNetworkCanvas from './NeuralNetworkCanvas'
import MutationStats from './MutationStats'

function NeuralNetworkView({ rider, networkInfo, generation, selectedIndex }) {
  // Check if weight changes exist and have data
  const hasWeightChanges = networkInfo.weight_changes !== null && 
                           networkInfo.weight_changes !== undefined &&
                           Object.keys(networkInfo.weight_changes || {}).length > 0
  
  // Get rider color based on rank
  const getRiderColor = (index) => {
    const colors = [
      '#4caf50', // Green - 1st
      '#ffeb3b', // Yellow - 2nd
      '#ff9800', // Orange - 3rd
      '#2196f3', // Blue - 4th
      '#9c27b0', // Purple - 5th
    ]
    return colors[index] || '#757575' // Gray for others
  }
  
  const riderColor = selectedIndex !== null && selectedIndex !== undefined ? getRiderColor(selectedIndex) : '#757575'
  const rankLabel = selectedIndex !== null && selectedIndex !== undefined ? `#${selectedIndex + 1}` : ''
  
  return (
    <div className="neural-network-view">
      <div className="neural-network-header" style={{ borderColor: riderColor, backgroundColor: `${riderColor}15` }}>
        {rankLabel && (
          <div className="rider-rank-badge" style={{ backgroundColor: riderColor }}>
            {rankLabel}
          </div>
        )}
        <h3 style={{ color: riderColor }}>Rider: {rider.name}</h3>
        {selectedIndex !== null && selectedIndex !== undefined && (
          <div className="selection-indicator" style={{ backgroundColor: riderColor }}>
            <span>SELECTED</span>
          </div>
        )}
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Speed</div>
          <div className="stat-value">{rider.velocity.toFixed(1)} km/h</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Power</div>
          <div className="stat-value">{Math.round(rider.power)}W</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Energy</div>
          <div className="stat-value">{Math.round(rider.total_energy || 0)}J</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Battery</div>
          <div className="stat-value">{rider.battery_percent.toFixed(1)}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Gradient</div>
          <div className="stat-value">-</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Distance</div>
          <div className="stat-value">{rider.position.toFixed(1)}m</div>
        </div>
      </div>

      <MutationStats networkInfo={networkInfo} />

      <NeuralNetworkCanvas networkInfo={networkInfo} generation={generation} />
      
      <div className="network-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f44336' }}></div>
          <span>Positive contribution</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2196f3' }}></div>
          <span>Negative contribution</span>
        </div>
      </div>
    </div>
  )
}

export default NeuralNetworkView

