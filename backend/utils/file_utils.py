import os
from constants import TEMP_DIR

def get_csv_path(filename: str) -> str:
    return os.path.join(TEMP_DIR, filename) 