import React from 'react'
import './MutationStats.css'

function MutationStats({ networkInfo }) {
  if (!networkInfo.weight_changes) {
    return null
  }

  const changes = networkInfo.weight_changes
  
  // Count total changes
  let totalChanges = 0
  let significantChanges = 0
  let maxChange = 0
  
  // Count input_hidden changes
  if (changes.input_hidden) {
    changes.input_hidden.forEach(row => {
      row.forEach(change => {
        if (Math.abs(change) > 0.01) {
          totalChanges++
          if (Math.abs(change) > 0.1) {
            significantChanges++
          }
          maxChange = Math.max(maxChange, Math.abs(change))
        }
      })
    })
  }
  
  // Count hidden_output changes
  if (changes.hidden_output) {
    changes.hidden_output.forEach(change => {
      if (Math.abs(change) > 0.01) {
        totalChanges++
        if (Math.abs(change) > 0.1) {
          significantChanges++
        }
        maxChange = Math.max(maxChange, Math.abs(change))
      }
    })
  }
  
  // Count bias changes
  if (changes.hidden_bias) {
    changes.hidden_bias.forEach(change => {
      if (Math.abs(change) > 0.01) {
        totalChanges++
        if (Math.abs(change) > 0.1) {
          significantChanges++
        }
        maxChange = Math.max(maxChange, Math.abs(change))
      }
    })
  }
  
  if (changes.output_bias && changes.output_bias.length > 0) {
    const change = changes.output_bias[0]
    if (Math.abs(change) > 0.01) {
      totalChanges++
      if (Math.abs(change) > 0.1) {
        significantChanges++
      }
      maxChange = Math.max(maxChange, Math.abs(change))
    }
  }

  if (totalChanges === 0) {
    return null
  }

  return (
    <div className="mutation-stats">
      <h4>🔄 Evolution Changes</h4>
      <div className="mutation-grid">
        <div className="mutation-stat">
          <div className="mutation-label">Total Changes</div>
          <div className="mutation-value">{totalChanges}</div>
        </div>
        <div className="mutation-stat">
          <div className="mutation-label">Significant</div>
          <div className="mutation-value">{significantChanges}</div>
        </div>
        <div className="mutation-stat">
          <div className="mutation-label">Max Change</div>
          <div className="mutation-value">{maxChange.toFixed(3)}</div>
        </div>
      </div>
      <div className="mutation-note">
        Brighter connections in the network show mutated weights
      </div>
    </div>
  )
}

export default MutationStats

