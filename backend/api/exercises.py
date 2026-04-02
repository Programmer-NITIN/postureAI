"""
Exercises API Routes

Provides the list of available exercises and their details.
Updated to serve the extended physiotherapy exercise library.
"""

from fastapi import APIRouter
from backend.ai_engine.exercise_library import get_categorized_exercises, get_exercise, REHAB_EXERCISES
from backend.ai_engine.exercise_templates import get_exercise_list

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


@router.get("")
def list_exercises():
    """Return all available exercises (basic + rehab)."""
    return get_exercise_list()


@router.get("/rehab")
def list_rehab_exercises():
    """Return categorized rehabilitation exercises."""
    return get_categorized_exercises()


@router.get("/rehab/{exercise_id}")
def get_rehab_exercise(exercise_id: str):
    """Return detailed template for a specific rehabilitation exercise."""
    exercise = get_exercise(exercise_id)
    return {"id": exercise_id, **exercise}


@router.get("/{exercise_id}")
def get_exercise_detail(exercise_id: str):
    """Return detailed template for a specific exercise."""
    if exercise_id in REHAB_EXERCISES:
        return {"id": exercise_id, **REHAB_EXERCISES[exercise_id]}
    from backend.ai_engine.exercise_templates import get_template
    template = get_template(exercise_id)
    return {"id": exercise_id, **template}
