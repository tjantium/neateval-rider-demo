import React, { useRef, useEffect } from 'react'
import './NeuralNetworkCanvas.css'

function NeuralNetworkCanvas({ networkInfo, generation }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !networkInfo) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Layout constants
    const inputX = 50
    const hiddenX = 250
    const outputX = 450
    const nodeRadius = 20
    const nodeSpacing = 40
    const inputCount = networkInfo.input_names.length
    
    // Get weights from network info
    const weights = networkInfo.weights
    
    // Draw generation info and topology info
    if (generation !== undefined && generation !== null) {
      ctx.fillStyle = '#666'
      ctx.font = '11px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Generation: ${generation}`, 10, 20)
      
      // Show topology info (NEAT feature)
      const topologyStats = networkInfo.topology_stats || {}
      const numHidden = topologyStats.num_hidden !== undefined ? topologyStats.num_hidden : (weights.num_hidden !== undefined ? weights.num_hidden : 0)
      const numConnections = topologyStats.num_connections || 0
      
      ctx.fillText(`Hidden Nodes: ${numHidden} | Connections: ${numConnections}`, 10, 35)
      
      // Show topology evolution status
      if (generation > 0) {
        ctx.fillStyle = numHidden > 0 ? '#4caf50' : '#ff9800'
        ctx.fillText(numHidden > 0 ? '✓ Topology evolving!' : 'Starting minimal (0 hidden)', 10, 50)
      } else {
        ctx.fillStyle = '#666'
        ctx.fillText('Initial generation (minimal topology)', 10, 50)
      }
    }
    const inputHiddenWeights = weights.input_hidden || []
    const hiddenOutputWeights = weights.hidden_output || []
    const inputOutputWeights = weights.input_output || []  // Direct input->output connections (NEAT)
    const weightChanges = networkInfo.weight_changes || null
    
    // Handle dynamic topology - get actual hidden count from weights
    const hiddenCount = weights.num_hidden !== undefined ? weights.num_hidden : networkInfo.hidden_values.length
    const hiddenValues = networkInfo.hidden_values || []

    // Calculate vertical positions
    const inputStartY = (height - (inputCount - 1) * nodeSpacing) / 2
    const hiddenStartY = hiddenCount > 0 ? (height - (hiddenCount - 1) * nodeSpacing) / 2 : height / 2
    const outputY = height / 2

    // Draw direct input to output connections (NEAT can have these)
    // When there are no hidden nodes, show all connections (even if weights are small)
    const showAllConnections = hiddenCount === 0
    
    for (let i = 0; i < inputCount; i++) {
      const inputY = inputStartY + i * nodeSpacing
      const weight = inputOutputWeights[i] || 0
      
      // Show connection if weight is significant OR if there are no hidden nodes (all connections matter)
      if (Math.abs(weight) > 0.01 || showAllConnections) {
        let weightChanged = false
        let changeAmount = 0
        if (weightChanges && weightChanges.input_output && weightChanges.input_output[i]) {
          changeAmount = weightChanges.input_output[i] || 0
          weightChanged = Math.abs(changeAmount) > 0.01
        }
        
        let color = weight > 0 ? '#f44336' : '#2196f3'
        if (weightChanged) {
          color = weight > 0 ? '#ff1744' : '#0277bd'
        }
        
        // For very small weights when showing all connections, use minimum visibility
        const weightMagnitude = showAllConnections && Math.abs(weight) < 0.01 ? 0.01 : Math.abs(weight)
        const opacity = Math.min(1.0, Math.max(0.3, weightMagnitude * 2))  // Minimum 0.3 opacity
        const lineWidth = Math.max(1, weightMagnitude * 3)  // Minimum 1px width
        
        ctx.strokeStyle = color
        ctx.lineWidth = weightChanged ? lineWidth + 1 : lineWidth
        ctx.globalAlpha = weightChanged ? Math.min(1.0, opacity * 0.9) : opacity * 0.6
        
        // Draw connection (curved to distinguish from hidden connections)
        ctx.beginPath()
        ctx.moveTo(inputX + nodeRadius, inputY)
        ctx.quadraticCurveTo((inputX + outputX) / 2, inputY - 20, outputX - nodeRadius, outputY)
        ctx.stroke()
        
        // Draw change indicator
        if (weightChanged && Math.abs(changeAmount) > 0.1) {
          const midX = (inputX + outputX) / 2
          const midY = (inputY + outputY) / 2 - 10
          ctx.fillStyle = changeAmount > 0 ? '#4caf50' : '#ff9800'
          ctx.beginPath()
          ctx.arc(midX, midY, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Draw connections from input to hidden
    for (let i = 0; i < inputCount; i++) {
      const inputY = inputStartY + i * nodeSpacing
      for (let h = 0; h < hiddenCount; h++) {
        const hiddenY = hiddenStartY + h * nodeSpacing
        const weight = (inputHiddenWeights[i] && inputHiddenWeights[i][h]) ? inputHiddenWeights[i][h] : 0
        
        // Check if this weight changed (for evolution visualization)
        let weightChanged = false
        let changeAmount = 0
        if (weightChanges && weightChanges.input_hidden && weightChanges.input_hidden[i]) {
          changeAmount = weightChanges.input_hidden[i][h] || 0
          weightChanged = Math.abs(changeAmount) > 0.01
        }
        
        // Color based on weight (red for positive, blue for negative)
        let color = weight > 0 ? '#f44336' : '#2196f3'
        // Highlight changed weights with brighter color or different style
        if (weightChanged) {
          // Make changed connections more visible
          color = weight > 0 ? '#ff1744' : '#0277bd'  // Brighter colors
        }
        
        const opacity = Math.min(1.0, Math.abs(weight) * 2)
        const lineWidth = Math.max(1, Math.abs(weight) * 3)
        
        ctx.strokeStyle = color
        ctx.lineWidth = weightChanged ? lineWidth + 1 : lineWidth  // Thicker if changed
        ctx.globalAlpha = weightChanged ? Math.min(1.0, opacity * 0.9) : opacity * 0.6
        
        // Draw connection
        ctx.beginPath()
        ctx.moveTo(inputX + nodeRadius, inputY)
        ctx.lineTo(hiddenX - nodeRadius, hiddenY)
        ctx.stroke()
        
        // Draw change indicator if weight changed significantly
        if (weightChanged && Math.abs(changeAmount) > 0.1) {
          const midX = (inputX + hiddenX) / 2
          const midY = (inputY + hiddenY) / 2
          ctx.fillStyle = changeAmount > 0 ? '#4caf50' : '#ff9800'
          ctx.beginPath()
          ctx.arc(midX, midY, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Draw connections from hidden to output
    for (let h = 0; h < hiddenCount; h++) {
      const hiddenY = hiddenStartY + h * nodeSpacing
      // Handle both array format [weight] and single value
      const weight = hiddenOutputWeights[h] ? 
        (Array.isArray(hiddenOutputWeights[h]) ? hiddenOutputWeights[h][0] : hiddenOutputWeights[h]) : 0
      
      // Check if this weight changed
      let weightChanged = false
      let changeAmount = 0
      if (weightChanges && weightChanges.hidden_output && weightChanges.hidden_output[h] !== undefined) {
        changeAmount = weightChanges.hidden_output[h]
        weightChanged = Math.abs(changeAmount) > 0.01
      }
      
      let color = weight > 0 ? '#f44336' : '#2196f3'
      if (weightChanged) {
        color = weight > 0 ? '#ff1744' : '#0277bd'
      }
      
      const opacity = Math.min(1.0, Math.abs(weight) * 2)
      const lineWidth = Math.max(1, Math.abs(weight) * 3)
      
      ctx.strokeStyle = color
      ctx.lineWidth = weightChanged ? lineWidth + 1 : lineWidth
      ctx.globalAlpha = weightChanged ? Math.min(1.0, opacity * 0.9) : opacity * 0.6
      
      ctx.beginPath()
      ctx.moveTo(hiddenX + nodeRadius, hiddenY)
      ctx.lineTo(outputX - nodeRadius, outputY)
      ctx.stroke()
      
      // Draw change indicator
      if (weightChanged && Math.abs(changeAmount) > 0.1) {
        const midX = (hiddenX + outputX) / 2
        const midY = (hiddenY + outputY) / 2
        ctx.fillStyle = changeAmount > 0 ? '#4caf50' : '#ff9800'
        ctx.beginPath()
        ctx.arc(midX, midY, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.globalAlpha = 1.0

    // Draw input nodes
    networkInfo.input_names.forEach((name, idx) => {
      const y = inputStartY + idx * nodeSpacing
      const contrib = networkInfo.contributions[idx]
      const color = contrib > 0 ? '#f44336' : '#2196f3'
      const intensity = Math.min(1.0, Math.abs(contrib) * 2)

      // Draw node
      ctx.fillStyle = color
      ctx.globalAlpha = 0.3 + intensity * 0.7
      ctx.beginPath()
      ctx.arc(inputX, y, nodeRadius, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.globalAlpha = 1.0
      ctx.stroke()

      // Draw label
      ctx.fillStyle = '#000'
      ctx.font = '10px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(name, inputX - nodeRadius - 5, y + 4)
      
      // Draw value
      ctx.font = '9px Arial'
      ctx.fillText(networkInfo.inputs[idx].toFixed(3), inputX, y + nodeRadius + 12)
    })

    // Draw hidden nodes (handle dynamic count)
    if (hiddenCount > 0) {
      for (let idx = 0; idx < hiddenCount; idx++) {
        const y = hiddenStartY + idx * nodeSpacing
        const val = hiddenValues[idx] !== undefined ? hiddenValues[idx] : 0.0

        // Draw node
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(hiddenX, y, nodeRadius, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw value
        ctx.fillStyle = '#000'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(val.toFixed(3), hiddenX, y + 4)
      }
    }

    // Draw output node (centered vertically)
    // outputY is already declared above
    ctx.fillStyle = '#fff3cd'
    ctx.beginPath()
    ctx.arc(outputX, outputY, nodeRadius + 5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw output label
    ctx.fillStyle = '#000'
    ctx.font = '11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Power Change', outputX, outputY - nodeRadius - 10)
    
    // Draw output value
    ctx.font = '12px Arial'
    ctx.fontWeight = 'bold'
    ctx.fillText(networkInfo.output.toFixed(3), outputX, outputY + 4)

    ctx.textAlign = 'left'
  }, [networkInfo, generation])

  return (
    <div className="neural-network-canvas">
      <canvas
        ref={canvasRef}
        width={550}
        height={350}
        className="network-canvas"
      />
    </div>
  )
}

export default NeuralNetworkCanvas

