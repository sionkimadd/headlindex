import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from transformers import pipeline
from constants import SQL_TABLE_NAME, CSV_COLUMNS
import torch
from flask import jsonify

class NewsClassifier:
    def __init__(self):
        device = 0 if torch.cuda.is_available() else -1
        self.__classifier = pipeline(
            'text-classification',
            model='logicalqubit/deberta-v3-large-news-classifier',
            device=device
        )

    def classify(self, title: str) -> str:
        try:
            result = self.__classifier(title)[0]
            return result["label"]
        except:
            return None

class CSVtoSQL:
    def __init__(self, news_data: pd.DataFrame):
        load_dotenv()
        self.__news_data = news_data
        self.__setup_database()
        self.__classifier = NewsClassifier()

    def __setup_database(self) -> None:
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            raise Exception('Error: .env/DATABASE_URL')
        self.__db_url = db_url.replace('mysql://', 'mysql+pymysql://')
        self.__engine = create_engine(self.__db_url)

    def save_as_sql(self) -> None:
        try:
            columns = ', '.join([f'{col} TEXT' for col in CSV_COLUMNS + ['category']])
            query = f'CREATE TABLE IF NOT EXISTS {SQL_TABLE_NAME} ({columns});'
            with self.__engine.connect() as connection:
                connection.execute(text(query))

            self.__news_data['category'] = self.__news_data['title'].apply(
                self.__classifier.classify
            )

            self.__news_data = self.__news_data.dropna(subset=['category'])

            try:
                existing_data = pd.read_sql(f'SELECT * FROM {SQL_TABLE_NAME}', self.__engine)
                combined_data = pd.concat([existing_data, self.__news_data])
                combined_data = combined_data.drop_duplicates(subset=['title'], keep='last')
            except:
                combined_data = self.__news_data

            combined_data.to_sql(
                SQL_TABLE_NAME,
                con=self.__engine,
                index=False,
                if_exists='replace'
            )

        except Exception:
            return jsonify({'error': 'Error: Database operation failed.'}), 500

    @property
    def news_data(self) -> pd.DataFrame:
        return self.__news_data

    @property
    def table_name(self) -> str:
        return SQL_TABLE_NAME

    @property
    def engine(self):
        return self.__engine