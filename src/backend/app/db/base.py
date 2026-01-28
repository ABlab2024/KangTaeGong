from app.db.base_class import Base

# Import models here to ensure they are registered with Base.metadata
from app.models.threat_case import ThreatCase  # noqa
from app.models.user import User  # noqa
from app.models.log import SimulationLog  # noqa
from app.models.user_profile import UserProfile, ContentCategory  # noqa
from app.models.simulation import SimulationResult, PhishingScenario, TrainingSchedule  # noqa
