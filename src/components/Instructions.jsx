import React from 'react'
import './Instructions.css'

function Instructions() {
  return (
    <div className="instructions">
      <div className="instructions-section">
        <h3>Instructions</h3>
        <p>
          Click or use up/down arrow keys to select a rider and see their neural controller. 
          Press 'r' or wait to return to default race view which shows the top 5 riders. 
          Space to force evolution before race distance. 
          Reload (Ctrl+R or Cmd+R) to reset with new riders and randomly generated terrain 
          (try this if nothing interesting is happening!).
        </p>
      </div>
      
      <div className="instructions-section">
        <h3>Explanation</h3>
        <p>
          All the riders have the same physical characteristics, but different brains, which evolve over multiple races. 
          Each rider is controlled by a small neural network whose inputs are percepts (speed, power, battery level, 
          average gradient over the next 100m, average gradient over the next 1000m, distance to the rider ahead, 
          fraction of race completed) and whose output determines how the rider's power output will change per timestep 
          (scaled by Power Multiplier). The network weights are randomly initialised. The red/blue colouring of the input 
          nodes shows the current positive/negative contribution of each input to the output change. After each race we 
          select the 5 leading riders, and generate a new generation of some exact copies and some with small weight mutations, 
          which will lead to different behaviour. Watch the population of riders hopefully slowly improve their average speed 
          over a few generations. Basic good strategy is to try hard going uphill and recover going down (because the air 
          resistance force is proportional to velocity squared). You may also sometimes see dedicated drafters or sprinters emerge...
        </p>
        <p>
          The cycling physics is based on rider + bike weighing 87kg, and simulates slope and air resistance effects with a 
          drag area CwA of 0.32 and a coefficient of rolling resistance Cr of 0.004. Drafting reduces air resistance by up to 
          nearly 40% when a rider is close behind another. Physiologically, the riders have aerobic threshold power of 250W, 
          and a "Wprime" anaerobic battery of 15000J which discharges above that threshold and recovers beneath it. The riders 
          have a maximum sprint power of 750W, but this decreases linearly with battery level.
        </p>
      </div>
    </div>
  )
}

export default Instructions

