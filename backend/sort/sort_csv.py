import pandas as pd
import os
from constants import CATEGORY_LIST
from utils.file_utils import get_csv_path
from flask import jsonify

def sort_csv_files(search_word, file_ext='.csv', ascending=True):
    paths = [
        get_csv_path(f'{search_word}_All{file_ext}')
    ] + [
        get_csv_path(f'{search_word}_{cat}{file_ext}') for cat in CATEGORY_LIST
    ]

    for path in paths:
        if not os.path.exists(path):
            continue

        try:
            df = pd.read_csv(path)
            df['datetime'] = pd.to_datetime(df['datetime'])
            sorted_df = df.sort_values(by='datetime', ascending=ascending)
            sorted_df.to_csv(path, index=False)
        except Exception:
            return jsonify({'error': 'Error: File not found.'}), 404