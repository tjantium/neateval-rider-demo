"""
Cycling physics simulation engine.
"""
import numpy as np
import math

# Physical constants
MASS = 87.0  # kg (rider + bike)
CWA = 0.32  # Drag area (m²)
CR = 0.004  # Coefficient of rolling resistance
GRAVITY = 9.81  # m/s²
AIR_DENSITY = 1.225  # kg/m³ at sea level

# Physiological constants
AEROBIC_THRESHOLD = 250.0  # W
WPRIME = 15000.0  # J (anaerobic battery capacity)
MAX_SPRINT_POWER = 750.0  # W
DRAFTING_EFFICIENCY = 0.4  # 40% reduction in air resistance when drafting
DRAFTING_DISTANCE = 2.0  # m (distance for full drafting benefit)


def calculate_air_resistance(velocity, drafting_factor=1.0):
    """Calculate air resistance force in Newtons."""
    # F = 0.5 * ρ * CwA * v²
    force = 0.5 * AIR_DENSITY * CWA * (velocity ** 2) * drafting_factor
    return force


def calculate_rolling_resistance(velocity, gradient):
    """Calculate rolling resistance force in Newtons."""
    # F = Cr * m * g * cos(θ)
    theta = math.atan(gradient / 100.0)  # gradient is percentage
    force = CR * MASS * GRAVITY * math.cos(theta)
    return force


def calculate_gravity_force(gradient):
    """Calculate gravitational force component in Newtons."""
    # F = m * g * sin(θ)
    theta = math.atan(gradient / 100.0)
    force = MASS * GRAVITY * math.sin(theta)
    return force


def calculate_drafting_factor(distance_to_rider_ahead):
    """Calculate drafting efficiency factor (1.0 = no drafting, 0.6 = full drafting)."""
    if distance_to_rider_ahead > DRAFTING_DISTANCE:
        return 1.0
    # Linear interpolation between full drafting and no drafting
    factor = 1.0 - (DRAFTING_EFFICIENCY * (1.0 - distance_to_rider_ahead / DRAFTING_DISTANCE))
    return max(0.6, factor)


def calculate_max_power(battery_level):
    """Calculate maximum available power based on battery level."""
    # Max power decreases linearly with battery depletion
    battery_ratio = battery_level / WPRIME
    return AEROBIC_THRESHOLD + (MAX_SPRINT_POWER - AEROBIC_THRESHOLD) * battery_ratio


def update_battery(power, battery_level, dt):
    """Update anaerobic battery level."""
    if power > AEROBIC_THRESHOLD:
        # Discharging above threshold
        discharge = (power - AEROBIC_THRESHOLD) * dt
        battery_level = max(0.0, battery_level - discharge)
    else:
        # Recovering below threshold
        recovery = (AEROBIC_THRESHOLD - power) * dt * 0.1  # Recovery rate
        battery_level = min(WPRIME, battery_level + recovery)
    
    return battery_level


def simulate_timestep(rider, terrain, riders, dt, power_multiplier):
    """
    Simulate one timestep for a rider.
    
    Args:
        rider: Rider object with position, velocity, power, battery
        terrain: Terrain object with gradient function
        riders: List of all riders (for drafting calculation)
        dt: Time step in seconds
        power_multiplier: Multiplier for power changes
    
    Returns:
        Updated rider state
    """
    # Get current gradient
    gradient = terrain.get_gradient(rider.position)
    
    # Calculate drafting factor
    distance_ahead = float('inf')
    for other in riders:
        if other.position > rider.position and other != rider:
            distance_ahead = min(distance_ahead, other.position - rider.position)
    
    drafting_factor = calculate_drafting_factor(distance_ahead) if distance_ahead < float('inf') else 1.0
    
    # Calculate forces
    velocity = rider.velocity
    air_resistance = calculate_air_resistance(velocity, drafting_factor)
    rolling_resistance = calculate_rolling_resistance(velocity, gradient)
    gravity_force = calculate_gravity_force(gradient)
    
    # Clamp power to available maximum
    max_power = calculate_max_power(rider.battery)
    rider.power = max(0.0, min(max_power, rider.power))
    
    # Power to force conversion (simplified: P = F * v, so F = P / v)
    # But we need to handle the case when v is very small
    if velocity > 0.1:
        propulsive_force = rider.power / velocity
    else:
        # At very low speeds, assume we can apply force directly
        propulsive_force = rider.power * 10.0  # Rough approximation
    
    # Net force
    net_force = propulsive_force - air_resistance - rolling_resistance - gravity_force
    
    # Update velocity (F = ma, so a = F/m)
    acceleration = net_force / MASS
    new_velocity = max(0.0, velocity + acceleration * dt)
    
    # Update position
    new_position = rider.position + new_velocity * dt
    
    # Update battery
    new_battery = update_battery(rider.power, rider.battery, dt)
    
    # Update rider state
    rider.velocity = new_velocity
    rider.position = new_position
    rider.battery = new_battery
    
    return rider

