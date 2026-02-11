from sqlmodel import SQLModel, create_engine

SQLITE_FILE_NAME = "database/relational/data.db"
DATABASE_URL = f"sqlite:///{SQLITE_FILE_NAME}"

# check_same_thread=False is needed for SQLite in multithreaded web apps
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
