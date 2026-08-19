from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    postgres_user: str = "cengello"
    postgres_password: str = "cengello"
    postgres_db: str = "cengello"
    postgres_host: str = "db"
    postgres_port: int = 5432

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_min: int = 20
    jwt_refresh_ttl_days: int = 30

    uploads_dir: str = "/app/uploads"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
