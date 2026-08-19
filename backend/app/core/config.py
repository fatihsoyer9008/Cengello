from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str = "db"
    postgres_port: int = 5432

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_min: int = 20
    jwt_refresh_ttl_days: int = 30

    uploads_dir: str = "/app/uploads"
    max_upload_size_bytes: int = 26_214_400

    cookie_secure: bool = True

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
