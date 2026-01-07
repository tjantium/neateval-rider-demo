import React, { useRef, useEffect } from 'react'
import './RaceView.css'

function RaceView({ riders, terrain, raceDistance, maxPosition, cameraZoom, selectedRiderIndex, onSelectRider }) {
  const canvasRef = useRef(null)

  // Rider colors - distinct colors for each position
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    ctx.fillStyle = '#e8e8e8'
    ctx.fillRect(0, 0, width, height)

    // Calculate dynamic zoom based on race progress
    // Start zoomed in (high zoom %) at the start, zoom out as race progresses
    const raceProgress = Math.min(1.0, maxPosition / raceDistance) // 0 to 1
    // Zoom range: 65% (zoomed in) at start -> 20% (zoomed out) at end
    // Use smooth interpolation for gradual zoom out
    // Apply easing function for smoother transition
    const easedProgress = raceProgress * raceProgress // Quadratic easing for smoother zoom
    const dynamicZoom = 65 - (easedProgress * 45) // 65% at start, 20% at end
    // Use the higher of manual zoom or dynamic zoom (so manual zoom can override)
    const effectiveZoom = Math.max(cameraZoom, dynamicZoom)
    
    // Calculate viewport - ensure ALL top 5 riders are visible
    const topRiders = riders.slice(0, 5).filter(r => r.position >= 0)
    
    let viewStart = 0
    let viewWidth = raceDistance / (effectiveZoom / 100)
    
    if (topRiders.length > 0) {
      // Find the spread of riders
      const riderPositions = topRiders.map(r => r.position)
      const minRiderPos = Math.min(...riderPositions)
      const maxRiderPos = Math.max(...riderPositions)
      const riderSpread = maxRiderPos - minRiderPos
      
      // Add padding on both sides (20% of spread, minimum 100m)
      const padding = Math.max(riderSpread * 0.2, 100)
      const requiredWidth = riderSpread + (padding * 2)
      
      // If required width is larger than current view, adjust zoom
      if (requiredWidth > viewWidth) {
        viewWidth = requiredWidth
        // Adjust zoom to fit (but don't go below 20% or above 200%)
        const newZoom = Math.max(20, Math.min(200, (raceDistance / viewWidth) * 100))
        // Note: We can't change cameraZoom here, so we'll use the calculated viewWidth
      }
      
      // Center view on rider group with padding
      const centerPos = (minRiderPos + maxRiderPos) / 2
      viewStart = Math.max(0, centerPos - viewWidth * 0.5)
      
      // Ensure we don't go past race end
      if (viewStart + viewWidth > raceDistance) {
        viewStart = Math.max(0, raceDistance - viewWidth)
      }
    } else {
      // Fallback: use max position
      viewStart = Math.max(0, maxPosition - viewWidth * 0.7)
    }
    
    const scale = width / viewWidth

    // Draw terrain with fill - give more vertical space
    const terrainHeight = height - 80
    const baseY = terrainHeight
    
    // Create path for terrain
    ctx.beginPath()
    ctx.moveTo(0, baseY)

    for (let i = 0; i < width; i++) {
      const worldX = viewStart + i / scale
      if (worldX < 0 || worldX > raceDistance) continue

      const gradient = terrain.gradient_points.reduce((grad, point, idx) => {
        if (idx === terrain.gradient_points.length - 1) return grad
        const [x1, g1] = point
        const [x2, g2] = terrain.gradient_points[idx + 1]
        if (x1 <= worldX && worldX <= x2) {
          const t = x2 !== x1 ? (worldX - x1) / (x2 - x1) : 0
          return g1 + t * (g2 - g1)
        }
        return grad
      }, 0)

      // Convert gradient to vertical offset
      const offset = (gradient / 100) * 50 // Scale for visualization
      const y = baseY - offset
      ctx.lineTo(i, y)
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    
    // Fill terrain
    ctx.fillStyle = '#4caf50'
    ctx.fill()
    
    // Draw terrain outline
    ctx.strokeStyle = '#2e7d32'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    for (let i = 0; i < width; i++) {
      const worldX = viewStart + i / scale
      if (worldX < 0 || worldX > raceDistance) continue
      const gradient = terrain.gradient_points.reduce((grad, point, idx) => {
        if (idx === terrain.gradient_points.length - 1) return grad
        const [x1, g1] = point
        const [x2, g2] = terrain.gradient_points[idx + 1]
        if (x1 <= worldX && worldX <= x2) {
          const t = x2 !== x1 ? (worldX - x1) / (x2 - x1) : 0
          return g1 + t * (g2 - g1)
        }
        return grad
      }, 0)
      const offset = (gradient / 100) * 50
      const y = baseY - offset
      ctx.lineTo(i, y)
    }
    ctx.stroke()

    // Draw finish line
    const finishX = (raceDistance - viewStart) * scale
    if (finishX >= 0 && finishX <= width) {
      ctx.strokeStyle = '#f44336'
      ctx.lineWidth = 3
      ctx.setLineDash([10, 5])
      ctx.beginPath()
      ctx.moveTo(finishX, 0)
      ctx.lineTo(finishX, height)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#f44336'
      ctx.font = 'bold 14px Arial'
      ctx.fillText('FINISH', finishX + 5, 20)
    }

    // Draw distance markers with flags
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.font = '9px Arial'
    for (let dist = Math.ceil(viewStart / 200) * 200; dist <= viewStart + viewWidth && dist <= raceDistance; dist += 200) {
      const x = (dist - viewStart) * scale
      if (x >= 0 && x <= width) {
        // Get terrain height at this point
        const worldX = dist
        const gradient = terrain.gradient_points.reduce((grad, point, idx) => {
          if (idx === terrain.gradient_points.length - 1) return grad
          const [x1, g1] = point
          const [x2, g2] = terrain.gradient_points[idx + 1]
          if (x1 <= worldX && worldX <= x2) {
            const t = x2 !== x1 ? (worldX - x1) / (x2 - x1) : 0
            return g1 + t * (g2 - g1)
          }
          return grad
        }, 0)
        const offset = (gradient / 100) * 50
        const terrainY = baseY - offset
        
        // Draw flag pole (thicker)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, terrainY - 20)
        ctx.lineTo(x, terrainY + 5)
        ctx.stroke()
        
        // Draw flag (larger)
        ctx.fillStyle = '#ff6b6b'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x, terrainY - 20)
        ctx.lineTo(x + 12, terrainY - 12)
        ctx.lineTo(x, terrainY - 5)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // Draw distance text (larger, with outline for readability)
        ctx.fillStyle = '#000'
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.font = 'bold 11px Arial'
        ctx.strokeText(`${dist}m`, x - 15, terrainY + 25)
        ctx.fillText(`${dist}m`, x - 15, terrainY + 25)
      }
    }

    // Draw only top 5 riders
    // (topRiders already calculated above for camera)
    
    // Draw riders
    topRiders.forEach((rider, index) => {
      const x = (rider.position - viewStart) * scale
      if (x < -20 || x > width + 20) return

      const gradient = terrain.gradient_points.reduce((grad, point, idx) => {
        if (idx === terrain.gradient_points.length - 1) return grad
        const [x1, g1] = point
        const [x2, g2] = terrain.gradient_points[idx + 1]
        if (x1 <= rider.position && rider.position <= x2) {
          const t = x2 !== x1 ? (rider.position - x1) / (x2 - x1) : 0
          return g1 + t * (g2 - g1)
        }
        return grad
      }, 0)

      const offset = (gradient / 100) * 50
      const y = baseY - offset - 25 // More space above terrain
      
      const isSelected = selectedRiderIndex === index
      const riderColor = getRiderColor(index)
      
      // Scale factor for larger riders (2.5x)
      const riderScale = 2.5

      // Draw shadow first (for depth) - larger shadow for realistic rider
      ctx.save()
      ctx.translate(x, y + 3)
      ctx.scale(riderScale, riderScale)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.beginPath()
      ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Draw selection box if this rider is selected (adjusted for new rider size)
      if (isSelected) {
        ctx.strokeStyle = '#2196f3'
        ctx.lineWidth = 5
        ctx.setLineDash([])
        ctx.strokeRect(x - 55, y - 50, 110, 120)
        // Draw glow effect
        ctx.shadowColor = '#2196f3'
        ctx.shadowBlur = 20
        ctx.strokeRect(x - 55, y - 50, 110, 120)
        ctx.shadowBlur = 0
      }

      // Draw realistic cyclist with proper proportions
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(riderScale, riderScale)
      
      // Bike wheel positions (more realistic spacing)
      const frontWheelX = 6
      const rearWheelX = -6
      const wheelY = 5
      const wheelRadius = 6
      
      // Draw bike wheels with colored rim and spokes
      // Front wheel
      ctx.strokeStyle = riderColor
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.arc(frontWheelX, wheelY, wheelRadius, 0, Math.PI * 2)
      ctx.stroke()
      
      // Rear wheel
      ctx.beginPath()
      ctx.arc(rearWheelX, wheelY, wheelRadius, 0, Math.PI * 2)
      ctx.stroke()
      
      // Wheel spokes (radial lines)
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const startX = frontWheelX + Math.cos(angle) * 2
        const startY = wheelY + Math.sin(angle) * 2
        const endX = frontWheelX + Math.cos(angle) * (wheelRadius - 1)
        const endY = wheelY + Math.sin(angle) * (wheelRadius - 1)
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        
        // Rear wheel spokes
        const rearStartX = rearWheelX + Math.cos(angle) * 2
        const rearStartY = wheelY + Math.sin(angle) * 2
        const rearEndX = rearWheelX + Math.cos(angle) * (wheelRadius - 1)
        const rearEndY = wheelY + Math.sin(angle) * (wheelRadius - 1)
        ctx.beginPath()
        ctx.moveTo(rearStartX, rearStartY)
        ctx.lineTo(rearEndX, rearEndY)
        ctx.stroke()
      }
      
      // Inner wheel (tire/rim detail)
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(frontWheelX, wheelY, wheelRadius - 1.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(rearWheelX, wheelY, wheelRadius - 1.5, 0, Math.PI * 2)
      ctx.stroke()
      
      // Draw realistic bike frame
      ctx.strokeStyle = riderColor
      ctx.lineWidth = 3
      
      // Frame geometry (more realistic proportions)
      const bottomBracketX = 0
      const bottomBracketY = wheelY
      const headTubeX = frontWheelX - 1
      const headTubeY = wheelY - 8
      const seatTubeX = rearWheelX + 1
      const seatTubeY = wheelY - 10
      const topTubeY = wheelY - 7
      
      ctx.beginPath()
      // Top tube (from head tube to seat tube)
      ctx.moveTo(headTubeX, topTubeY)
      ctx.lineTo(seatTubeX, topTubeY)
      // Down tube (from head tube to bottom bracket)
      ctx.moveTo(headTubeX, headTubeY)
      ctx.lineTo(bottomBracketX, bottomBracketY)
      // Seat tube (from seat tube to bottom bracket)
      ctx.moveTo(seatTubeX, seatTubeY)
      ctx.lineTo(bottomBracketX, bottomBracketY)
      // Chain stay (from bottom bracket to rear wheel)
      ctx.moveTo(bottomBracketX, bottomBracketY)
      ctx.lineTo(rearWheelX, wheelY)
      // Seat stay (from seat tube to rear wheel)
      ctx.moveTo(seatTubeX, seatTubeY)
      ctx.lineTo(rearWheelX, wheelY - 2)
      // Fork (from head tube to front wheel)
      ctx.moveTo(headTubeX, headTubeY)
      ctx.lineTo(frontWheelX, wheelY)
      ctx.stroke()
      
      // Handlebar
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(headTubeX, headTubeY - 1)
      ctx.lineTo(headTubeX - 3, headTubeY - 3)
      ctx.moveTo(headTubeX, headTubeY - 1)
      ctx.lineTo(headTubeX + 3, headTubeY - 3)
      ctx.stroke()
      
      // Pedals
      ctx.fillStyle = '#444'
      ctx.beginPath()
      ctx.arc(bottomBracketX - 2, bottomBracketY + 1, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(bottomBracketX + 2, bottomBracketY + 1, 1.5, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw realistic rider in cycling position
      // Helmet (oval, tilted forward)
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(0, seatTubeY - 8, 3.5, 4, -0.2, 0, Math.PI * 2)
      ctx.fill()
      // Helmet strap
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, seatTubeY - 6, 2.5, 0, Math.PI)
      ctx.stroke()
      
      // Head (under helmet)
      ctx.fillStyle = '#fdbcb4' // Skin tone
      ctx.beginPath()
      ctx.arc(0, seatTubeY - 6, 2.5, 0, Math.PI * 2)
      ctx.fill()
      
      // Torso/back (cycling position - leaning forward)
      ctx.fillStyle = riderColor
      ctx.beginPath()
      // Back (curved, leaning forward)
      ctx.moveTo(seatTubeX - 1, seatTubeY - 4)
      ctx.quadraticCurveTo(0, seatTubeY - 1, headTubeX - 1, headTubeY + 1)
      ctx.lineTo(headTubeX + 1, headTubeY + 3)
      ctx.quadraticCurveTo(0, seatTubeY + 1, seatTubeX + 1, seatTubeY - 2)
      ctx.closePath()
      ctx.fill()
      
      // Jersey outline
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1.5
      ctx.stroke()
      
      // Arms (cycling position - bent, holding handlebars)
      ctx.strokeStyle = '#fdbcb4' // Skin tone
      ctx.lineWidth = 2.5
      // Left arm (bent, holding left handlebar)
      ctx.beginPath()
      ctx.moveTo(headTubeX - 1, headTubeY + 2)
      ctx.quadraticCurveTo(headTubeX - 2, headTubeY, headTubeX - 3, headTubeY - 2)
      ctx.stroke()
      // Right arm
      ctx.beginPath()
      ctx.moveTo(headTubeX + 1, headTubeY + 2)
      ctx.quadraticCurveTo(headTubeX + 2, headTubeY, headTubeX + 3, headTubeY - 2)
      ctx.stroke()
      
      // Hands on handlebars
      ctx.fillStyle = '#fdbcb4'
      ctx.beginPath()
      ctx.arc(headTubeX - 3, headTubeY - 2, 1.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(headTubeX + 3, headTubeY - 2, 1.2, 0, Math.PI * 2)
      ctx.fill()
      
      // Legs (cycling position - one up, one down)
      // Use rider position for consistent leg phase (so same rider always has same phase)
      const legPhase = ((rider.position * 0.1 + index) % (Math.PI * 2))
      const normalizedPhase = (Math.sin(legPhase) + 1) / 2 // 0 to 1
      
      // Left leg (thigh and shin)
      ctx.strokeStyle = '#333' // Shorts/legs
      ctx.lineWidth = 2.5
      const leftThighAngle = -0.3 + normalizedPhase * 0.6
      const leftShinAngle = 0.5 + normalizedPhase * 0.4
      ctx.beginPath()
      ctx.moveTo(bottomBracketX, bottomBracketY)
      ctx.lineTo(
        bottomBracketX + Math.cos(leftThighAngle) * 4,
        bottomBracketY + Math.sin(leftThighAngle) * 4
      )
      ctx.lineTo(
        bottomBracketX + Math.cos(leftThighAngle) * 4 + Math.cos(leftShinAngle) * 4,
        bottomBracketY + Math.sin(leftThighAngle) * 4 + Math.sin(leftShinAngle) * 4
      )
      ctx.stroke()
      
      // Right leg
      const rightThighAngle = -0.3 + (1 - normalizedPhase) * 0.6
      const rightShinAngle = 0.5 + (1 - normalizedPhase) * 0.4
      ctx.beginPath()
      ctx.moveTo(bottomBracketX, bottomBracketY)
      ctx.lineTo(
        bottomBracketX + Math.cos(rightThighAngle) * 4,
        bottomBracketY + Math.sin(rightThighAngle) * 4
      )
      ctx.lineTo(
        bottomBracketX + Math.cos(rightThighAngle) * 4 + Math.cos(rightShinAngle) * 4,
        bottomBracketY + Math.sin(rightThighAngle) * 4 + Math.sin(rightShinAngle) * 4
      )
      ctx.stroke()
      
      // Feet on pedals
      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.ellipse(
        bottomBracketX - 2 + Math.cos(leftThighAngle) * 4 + Math.cos(leftShinAngle) * 4,
        bottomBracketY + Math.sin(leftThighAngle) * 4 + Math.sin(leftShinAngle) * 4,
        1.5, 1, leftShinAngle, 0, Math.PI * 2
      )
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(
        bottomBracketX + 2 + Math.cos(rightThighAngle) * 4 + Math.cos(rightShinAngle) * 4,
        bottomBracketY + Math.sin(rightThighAngle) * 4 + Math.sin(rightShinAngle) * 4,
        1.5, 1, rightShinAngle, 0, Math.PI * 2
      )
      ctx.fill()
      
      // Add some shading for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.beginPath()
      ctx.ellipse(0, seatTubeY - 2, 2, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()

      // Draw rider name and stats below with colored background (larger)
      ctx.fillStyle = riderColor
      ctx.globalAlpha = 0.25
      ctx.fillRect(x - 50, y + 35, 100, 45)
      ctx.globalAlpha = 1.0
      
      // Add outline to text for better readability
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      
      ctx.fillStyle = '#000'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.strokeText(rider.name, x, y + 50)
      ctx.fillText(rider.name, x, y + 50)
      
      ctx.font = '12px Arial'
      ctx.strokeText(`${Math.round(rider.power)}W`, x, y + 65)
      ctx.fillText(`${Math.round(rider.power)}W`, x, y + 65)
      
      ctx.strokeText(`${rider.velocity.toFixed(1)} km/h`, x, y + 80)
      ctx.fillText(`${rider.velocity.toFixed(1)} km/h`, x, y + 80)
      
      ctx.textAlign = 'left'
    })

    // Draw top 5 indicator
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.fillText(`Showing top 5 riders - Click on a rider to view their neural network`, 10, height - 10)
  }, [riders, terrain, raceDistance, maxPosition, cameraZoom, selectedRiderIndex])

  // Add click event listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const clickHandler = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Calculate dynamic zoom (same as drawing)
      const raceProgress = Math.min(1.0, maxPosition / raceDistance)
      const easedProgress = raceProgress * raceProgress
      const dynamicZoom = 65 - (easedProgress * 45)
      const effectiveZoom = Math.max(cameraZoom, dynamicZoom)
      
      // Calculate viewport (same logic as drawing)
      const visibleRiders = riders.slice(0, 5).filter(r => r.position >= 0)
      
      let viewStart = 0
      let viewWidth = raceDistance / (effectiveZoom / 100)
      
      if (visibleRiders.length > 0) {
        const riderPositions = visibleRiders.map(r => r.position)
        const minRiderPos = Math.min(...riderPositions)
        const maxRiderPos = Math.max(...riderPositions)
        const riderSpread = maxRiderPos - minRiderPos
        const padding = Math.max(riderSpread * 0.2, 100)
        const requiredWidth = riderSpread + (padding * 2)
        
        if (requiredWidth > viewWidth) {
          viewWidth = requiredWidth
        }
        
        const centerPos = (minRiderPos + maxRiderPos) / 2
        viewStart = Math.max(0, centerPos - viewWidth * 0.5)
        
        if (viewStart + viewWidth > raceDistance) {
          viewStart = Math.max(0, raceDistance - viewWidth)
        }
      } else {
        viewStart = Math.max(0, maxPosition - viewWidth * 0.7)
      }
      
      const scale = canvas.width / viewWidth
      const worldX = viewStart + x / scale

      // Find clicked rider (check if click is near any rider)
      const topRiders = riders.slice(0, 5)
      let clickedRiderIndex = null
      let minDistance = Infinity

      topRiders.forEach((rider, index) => {
        // Calculate rider's screen position
        const riderX = (rider.position - viewStart) * scale
        const riderGradient = terrain.gradient_points.reduce((grad, point, idx) => {
          if (idx === terrain.gradient_points.length - 1) return grad
          const [x1, g1] = point
          const [x2, g2] = terrain.gradient_points[idx + 1]
          if (x1 <= rider.position && rider.position <= x2) {
            const t = x2 !== x1 ? (rider.position - x1) / (x2 - x1) : 0
            return g1 + t * (g2 - g1)
          }
          return grad
        }, 0)
        const terrainHeight = height - 80
        const baseY = terrainHeight
        const offset = (riderGradient / 100) * 50
        const riderY = baseY - offset - 25
        
        // Check if click is within rider's bounding box (including name/stats area)
        // Riders are now more realistic and larger, so adjust click area
        const clickDistanceX = Math.abs(x - riderX)
        const clickDistanceY = Math.abs(y - riderY)
        
        // Rider is now roughly 60px wide and 120px tall (including stats, scaled up)
        if (clickDistanceX < 70 && clickDistanceY < 110) {
          const distance = Math.sqrt(clickDistanceX * clickDistanceX + clickDistanceY * clickDistanceY)
          if (distance < minDistance) {
            minDistance = distance
            clickedRiderIndex = index
          }
        }
      })

      if (clickedRiderIndex !== null && onSelectRider) {
        console.log('Clicked on rider at index:', clickedRiderIndex)
        onSelectRider(clickedRiderIndex)
      }
    }

    canvas.addEventListener('click', clickHandler)
    canvas.style.cursor = 'pointer'

    return () => {
      canvas.removeEventListener('click', clickHandler)
    }
  }, [riders, terrain, raceDistance, maxPosition, cameraZoom, onSelectRider])

  return (
    <div className="race-view">
      <canvas
        ref={canvasRef}
        width={1000}
        height={450}
        className="race-canvas"
      />
    </div>
  )
}

export default RaceView

