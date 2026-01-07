import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import Leaderboard from './components/Leaderboard'
import NeuralNetworkView from './components/NeuralNetworkView'
import ControlPanel from './components/ControlPanel'
import RaceView from './components/RaceView'
import Instructions from './components/Instructions'

function App() {
  const [state, setState] = useState(null)
  const [selectedRiderIndex, setSelectedRiderIndex] = useState(null)
  const [error, setError] = useState(null)
  const [controls, setControls] = useState({
    raceDistance: 2000,
    powerMultiplier: 5,
      cameraZoom: 35, // Better default zoom to show riders larger
    mutationSize: 1.0,
    numWeightsToMutate: 20
  })

  const fetchState = useCallback(async () => {
    // Try proxy first, then fallback to direct connection
    const urls = ['/api/state', 'http://127.0.0.1:5000/api/state', 'http://localhost:5000/api/state']
    
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        })
        
        if (!response.ok) {
          if (url === urls[0] && response.status === 403) {
            // Proxy failed, try next URL
            continue
          }
          throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setState(data)
        setError(null) // Clear error on success
        
        // Debug: log selection state
        if (data.selected_rider_idx !== null && data.selected_rider_idx !== undefined) {
          console.log('Selected rider index:', data.selected_rider_idx)
          console.log('Selected rider:', data.selected_rider)
          console.log('Network info:', data.network_info ? 'Present' : 'Missing')
          if (data.selected_rider && !data.network_info) {
            console.warn('Selected rider exists but network_info is missing!')
          }
        }
        
        setSelectedRiderIndex(prev => {
          if (data.selected_rider_idx !== null && data.selected_rider_idx !== undefined && data.selected_rider_idx !== prev) {
            return data.selected_rider_idx
          } else if (data.selected_rider_idx === null && prev !== null) {
            return null
          }
          return prev
        })
        return // Success, exit
      } catch (error) {
        // If this is the last URL, show error
        if (url === urls[urls.length - 1]) {
          console.error('Error fetching state from all URLs:', error)
          setError(error.message || 'Failed to connect to backend. Make sure the server is running on http://127.0.0.1:5000')
        }
        // Otherwise, continue to next URL
        continue
      }
    }
  }, [])

  const selectRider = useCallback(async (index) => {
    console.log('selectRider called with index:', index)
    if (index === null) {
      setSelectedRiderIndex(null)
      try {
        await fetch('/api/select_rider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: -1 })
        })
      } catch (err) {
        console.error('Error deselecting rider:', err)
      }
      return
    }

    setSelectedRiderIndex(index)
    try {
      const response = await fetch('/api/select_rider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      })
      const result = await response.json()
      console.log('Selection API response:', result)
      
      // Immediately fetch state to get network info
      setTimeout(() => {
        fetchState()
      }, 50)
    } catch (err) {
      console.error('Error selecting rider:', err)
    }
  }, [fetchState])

  const updateControl = useCallback(async (key, value) => {
    setControls(prev => {
      const newControls = { ...prev, [key]: value }
      
      const payload = {}
      if (key === 'raceDistance') payload.race_distance = value
      if (key === 'powerMultiplier') payload.power_multiplier = value
      if (key === 'mutationSize') payload.mutation_size = value
      if (key === 'numWeightsToMutate') payload.num_weights_to_mutate = value

      fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Error updating control:', err))

      return newControls
    })
  }, [])

  const forceEvolution = useCallback(async () => {
    await fetch('/api/controls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force_evolution: true })
    }).catch(err => console.error('Error forcing evolution:', err))
  }, [])

  const resetSimulation = useCallback(async () => {
    try {
      await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true })
      })
      setSelectedRiderIndex(null)
      // Fetch state after reset to get new terrain and riders
      setTimeout(() => fetchState(), 100)
    } catch (err) {
      console.error('Error resetting simulation:', err)
    }
  }, [fetchState])

  // Reset simulation on page load/reload
  useEffect(() => {
    // Detect page reload using Navigation Timing API
    const navEntry = performance.getEntriesByType('navigation')[0]
    const isReload = navEntry?.type === 'reload' || 
                     (performance.navigation && performance.navigation.type === 1)
    
    // Reset simulation on reload (Ctrl+R / Cmd+R)
    if (isReload) {
      resetSimulation()
    }
  }, [resetSimulation]) // Include resetSimulation in dependencies

  // Set up polling for simulation state
  useEffect(() => {
    // Fetch initial state
    fetchState()

    // Set up polling
    const interval = setInterval(fetchState, 100) // 10 FPS

    return () => {
      clearInterval(interval)
    }
  }, [fetchState]) // Re-run if fetchState changes

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        selectRider(null)
      } else if (e.key === 'ArrowUp') {
        setSelectedRiderIndex(prev => {
          const newIndex = prev === null ? 0 : (prev > 0 ? prev - 1 : prev)
          if (newIndex !== prev) {
            selectRider(newIndex)
          }
          return newIndex
        })
      } else if (e.key === 'ArrowDown') {
        setSelectedRiderIndex(prev => {
          const newIndex = prev === null ? 0 : (prev < 4 ? prev + 1 : prev)  // Top 5 riders (0-4)
          if (newIndex !== prev) {
            selectRider(newIndex)
          }
          return newIndex
        })
      } else if (e.key === ' ') {
        e.preventDefault()
        forceEvolution()
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [selectRider, forceEvolution]) // Re-run when functions change

  if (error) {
    return (
      <div className="error-container">
        <h1 className="title">Cycling Neuroevolution</h1>
        <div className="error-message">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div className="error-help">
            <h3>To fix this:</h3>
            <ol>
              <li>Make sure the backend server is running</li>
              <li>Open a terminal and run: <code>conda activate neat-back && python app.py</code></li>
              <li>The server should start on <code>http://127.0.0.1:5000</code> or <code>http://localhost:5000</code></li>
              <li>Make sure the frontend dev server is running: <code>npm run dev</code></li>
              <li>Check the browser console (F12) for more details</li>
            </ol>
            <button onClick={() => { setError(null); fetchState(); }} className="retry-button">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="loading">
        <h1 className="title">Cycling Neuroevolution</h1>
        <p>Loading simulation...</p>
        <p className="loading-hint">Make sure the backend is running on http://localhost:5000</p>
      </div>
    )
  }

  return (
    <div className="app">
      <h1 className="title">Cycling Neuroevolution</h1>
      
      <div className="main-container">
        <div className="left-panel">
          <Leaderboard 
            riders={state.riders} 
            selectedIndex={selectedRiderIndex}
            onSelectRider={selectRider}
            generation={state.generation}
          />
        </div>

        <div className="center-panel">
          <RaceView 
            riders={state.riders}
            terrain={state.terrain}
            raceDistance={state.race_distance}
            maxPosition={state.max_position}
            cameraZoom={controls.cameraZoom}
            selectedRiderIndex={selectedRiderIndex}
            onSelectRider={selectRider}
          />
          
          {state.selected_rider && state.network_info ? (
            <NeuralNetworkView 
              rider={state.selected_rider}
              networkInfo={state.network_info}
              generation={state.generation}
              selectedIndex={selectedRiderIndex}
            />
          ) : selectedRiderIndex !== null ? (
            <div style={{
              background: 'white',
              border: '2px solid #f44336',
              borderRadius: '4px',
              padding: '40px 20px',
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#666'
            }}>
              <p style={{ margin: '10px 0', fontSize: '1.1em', color: '#f44336' }}>
                ⚠️ Loading neural network...
              </p>
              <p style={{ fontSize: '0.9em', color: '#999' }}>
                Selected rider: {state.selected_rider?.name || `Index ${selectedRiderIndex}`}
              </p>
              <p style={{ fontSize: '0.8em', color: '#999', marginTop: '10px' }}>
                {state.network_info ? 'Network info available' : 'Waiting for network info...'}
              </p>
            </div>
          ) : (
            <div style={{
              background: 'white',
              border: '2px solid #000',
              borderRadius: '4px',
              padding: '40px 20px',
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#666'
            }}>
              <p style={{ margin: '10px 0', fontSize: '1.1em' }}>
                👆 Click on a rider in the leaderboard to view their neural network
              </p>
              <p style={{ fontSize: '0.9em', color: '#999', fontStyle: 'italic' }}>
                Or use ↑/↓ arrow keys to navigate
              </p>
            </div>
          )}
        </div>

        <div className="right-panel">
          <ControlPanel 
            controls={controls}
            onUpdateControl={updateControl}
            onForceEvolution={forceEvolution}
            onReset={resetSimulation}
          />
        </div>
      </div>

      <Instructions />
    </div>
  )
}

export default App

