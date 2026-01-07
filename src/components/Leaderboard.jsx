import React from 'react'
import './Leaderboard.css'

function Leaderboard({ riders, selectedIndex, onSelectRider, generation }) {
  const getRankColor = (index) => {
    if (index === 0) return '#4caf50' // Green
    if (index === 1) return '#ffeb3b' // Yellow
    return '#fff'
  }

  return (
    <div className="leaderboard">
      <h2>LEADERBOARD</h2>
      {generation !== undefined && (
        <div className="generation-info">Gen: {generation}</div>
      )}
      <div className="leaderboard-list">
        {riders.slice(0, 5).map((rider, index) => {
          const isSelected = selectedIndex === index
          // Use unique key combining name and position to avoid React key conflicts
          const uniqueKey = `${rider.name}-${rider.position}-${index}`
          return (
            <div
              key={uniqueKey}
              className={`leaderboard-item ${isSelected ? 'selected' : ''}`}
              style={{ backgroundColor: getRankColor(index) }}
              onClick={() => {
                console.log('Clicked rider at index:', index, rider.name)
                onSelectRider(index)
              }}
            >
              <div className="leaderboard-rank">{index + 1}.</div>
              <div className="leaderboard-name">{rider.name}</div>
              <div className="leaderboard-distance">{rider.position.toFixed(0)}m</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Leaderboard

