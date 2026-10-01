"""
CPCB National Air Quality Index (NAQI) Standard Definitions
============================================================
Formulas, breakpoints, and category mappings for PM2.5 and AQI sub-index calculations
based on Central Pollution Control Board (CPCB) India guidelines.
"""

from typing import List, Tuple

# Official CPCB Breakpoints for PM2.5: (C_lo, C_hi, I_lo, I_hi)
PM25_BREAKPOINTS: List[Tuple[float, float, int, int]] = [
    (0.0, 30.0, 0, 50),        # Good
    (30.0, 60.0, 50, 100),     # Satisfactory
    (60.0, 90.0, 100, 200),    # Moderate
    (90.0, 120.0, 200, 300),   # Poor
    (120.0, 250.0, 300, 400),  # Very Poor
    (250.0, 500.0, 400, 500),  # Severe
]


def pm25_to_aqi(pm25: float) -> int:
    """
    Calculate the CPCB AQI sub-index for PM2.5 using linear interpolation across standard breakpoints.
    
    Args:
        pm25: PM2.5 concentration in µg/m³.
        
    Returns:
        Integer AQI value between 0 and 500.
    """
    pm25 = max(0.0, min(float(pm25), 500.0))
    for c_lo, c_hi, i_lo, i_hi in PM25_BREAKPOINTS:
        if c_lo <= pm25 <= c_hi:
            return int(round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo))
    return 500


def aqi_to_category(aqi: int) -> str:
    """
    Map an AQI integer value to the corresponding official CPCB category.
    
    Args:
        aqi: Integer AQI value.
        
    Returns:
        Category name: "Good", "Satisfactory", "Moderate", "Poor", "Very Poor", or "Severe".
    """
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"
