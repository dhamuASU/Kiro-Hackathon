from typing import Literal
from uuid import UUID

from pydantic import BaseModel


AgeRange = Literal["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"]
Gender = Literal["female", "male", "non_binary", "prefer_not_to_say"]
SkinType = Literal["sensitive", "dry", "oily", "combination", "normal"]
LifeStage = Literal["none", "pregnant", "nursing", "ttc", "parent_of_infant"]
SkinGoal = Literal[
    "reduce_acne", "anti_aging", "even_tone", "hydration",
    "less_sensitivity", "less_oil", "general_maintenance",
]


class ProfileCreate(BaseModel):
    display_name: str | None = None
    age_range: AgeRange
    gender: Gender
    skin_type: SkinType
    skin_goals: list[SkinGoal]
    allergies: list[str] = []
    life_stage: LifeStage = "none"


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    age_range: AgeRange | None = None
    gender: Gender | None = None
    skin_type: SkinType | None = None
    skin_goals: list[SkinGoal] | None = None
    allergies: list[str] | None = None
    life_stage: LifeStage | None = None


class ProfileOut(ProfileCreate):
    id: UUID
    onboarding_complete: bool
