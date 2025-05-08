import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
import pathlib
from constants import CATEGORY_LIST, SQL_TABLE_NAME, CSV_COLUMNS
from utils.file_utils import get_csv_path
from flask import jsonify

class SQLtoCSV:
    def __init__(self, output_sql_csv: str, search_word: str):
        load_dotenv()
        self.__output_sql_csv = output_sql_csv
        self.__search_word = search_word
        self.__table_name = SQL_TABLE_NAME
        self.__setup_database()

    def __setup_database(self) -> None:
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            raise Exception('Error: .env/DATABASE_URL')
        self.__db_url = db_url.replace('mysql://', 'mysql+pymysql://')
        self.__engine = create_engine(self.__db_url)

    def load_to_csv(self) -> None:
        try:
            query = f"SELECT * FROM {self.__table_name} WHERE search_word = '{self.__search_word}'"
            data = pd.read_sql(query, self.__engine)
            file_ext = pathlib.Path(self.__output_sql_csv).suffix

            for category in CATEGORY_LIST:
                category_data = data[data['category'] == category]
                if len(category_data) == 0:
                    category_data = pd.DataFrame(columns=data.columns)
                
                category_file = get_csv_path(f"{self.__search_word}_{category}{file_ext}")
                category_data.to_csv(category_file, index=False)

            data.to_csv(self.__output_sql_csv, index=False)

        except Exception:
            return jsonify({'error': 'Error: Database operation failed.'}), 500

    @property
    def output_sql_csv(self) -> str:
        return self.__output_sql_csv

    @property
    def table_name(self) -> str:
        return self.__table_name
    
    @property
    def search_word(self) -> str:
        return self.__search_word

    @property
    def engine(self):
        return self.__engine