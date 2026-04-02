"""
Vector geometry utilities for biomechanical analysis.

Provides reusable functions for computing joint angles, distances,
and spatial relationships between body landmarks.
"""

import numpy as np
from typing import Tuple

# Type alias for a 2D or 3D point
Point = Tuple[float, ...]


def calculate_angle(point_a: Point, point_b: Point, point_c: Point) -> float:
    """
    Calculate the angle at point_b formed by the vectors BA and BC.

    Uses the dot product formula:
        cos(θ) = (BA · BC) / (|BA| × |BC|)

    Args:
        point_a: First endpoint (e.g., shoulder)
        point_b: Vertex of the angle (e.g., elbow)
        point_c: Second endpoint (e.g., wrist)

    Returns:
        Angle in degrees [0, 180]
    """
    a = np.array(point_a)
    b = np.array(point_b)
    c = np.array(point_c)

    ba = a - b
    bc = c - b

    # Handle degenerate case where points overlap
    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)
    if norm_ba < 1e-8 or norm_bc < 1e-8:
        return 0.0

    cosine = np.dot(ba, bc) / (norm_ba * norm_bc)
    # Clamp to [-1, 1] to avoid numerical issues with arccos
    cosine = np.clip(cosine, -1.0, 1.0)

    angle_rad = np.arccos(cosine)
    return float(np.degrees(angle_rad))


def calculate_distance(point_a: Point, point_b: Point) -> float:
    """
    Euclidean distance between two points.

    Args:
        point_a: First point
        point_b: Second point

    Returns:
        Distance as a float
    """
    a = np.array(point_a)
    b = np.array(point_b)
    return float(np.linalg.norm(a - b))


def midpoint(point_a: Point, point_b: Point) -> Tuple[float, float]:
    """
    Compute the midpoint between two 2D points.

    Args:
        point_a: First point (x, y)
        point_b: Second point (x, y)

    Returns:
        Midpoint as (x, y) tuple
    """
    a = np.array(point_a)
    b = np.array(point_b)
    mid = (a + b) / 2.0
    return (float(mid[0]), float(mid[1]))


def vertical_angle(point_a: Point, point_b: Point) -> float:
    """
    Calculate the angle of the vector AB relative to the vertical axis.
    Used for measuring tilt/lean of body segments.

    A perfectly vertical line returns 0°.
    A horizontal line returns 90°.

    Args:
        point_a: Top point (e.g., head)
        point_b: Bottom point (e.g., hip)

    Returns:
        Angle in degrees [0, 180]
    """
    dx = point_b[0] - point_a[0]
    dy = point_b[1] - point_a[1]

    # Vertical reference vector (pointing down in screen coords)
    angle_rad = np.arctan2(abs(dx), abs(dy))
    return float(np.degrees(angle_rad))
