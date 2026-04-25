from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    vertexai_api_key: str
    vertexai_location: str = "global"
    gemini_model: str = "gemini-2.5-flash"
    anthropic_api_key: str = ""  # deprecated
    claude_model: str = ""  # deprecated
    obf_base_url: str = "https://world.openbeautyfacts.org/api/v2"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:3000"]
    demo_mode: bool = False


settings = Settings()  # type: ignore[call-arg]
