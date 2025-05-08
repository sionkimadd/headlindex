import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
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
class WorldSentimentAnalyzer:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        self.tokenizer = AutoTokenizer.from_pretrained('cardiffnlp/twitter-roberta-base-sentiment-latest')
        self.model = AutoModelForSequenceClassification.from_pretrained('cardiffnlp/twitter-roberta-base-sentiment-latest')
        if self.device == 0:
            self.model = self.model.to('cuda')

    def world_analyze_sentiment(self, text: str) -> str:
        inputs = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
        if self.device == 0:
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
        
        outputs = self.model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        sentiment_idx = predictions.argmax().item()
        
        sentiments = ['positive', 'negative', 'neutral']
        return sentiments[sentiment_idx]

class BusinessSentimentAnalyzer:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        self.tokenizer = AutoTokenizer.from_pretrained('ProsusAI/finbert')
        self.model = AutoModelForSequenceClassification.from_pretrained('ProsusAI/finbert')
        if self.device == 0:
            self.model = self.model.to('cuda')

    def business_analyze_sentiment(self, text: str) -> str:
        inputs = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
        if self.device == 0:
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
        
        outputs = self.model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        sentiment_idx = predictions.argmax().item()
        
        sentiments = ['positive', 'negative', 'neutral']
        return sentiments[sentiment_idx]

class CSVtoSQL:
    def __init__(self, news_data: pd.DataFrame):
        load_dotenv()
        self.__news_data = news_data
        self.__setup_database()
        self.__classifier = NewsClassifier()
        self.__business_sentiment_analyzer = BusinessSentimentAnalyzer()
        self.__world_sentiment_analyzer = WorldSentimentAnalyzer()

    def __setup_database(self) -> None:
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            raise Exception('Error: .env/DATABASE_URL')
        self.__db_url = db_url.replace('mysql://', 'mysql+pymysql://')
        self.__engine = create_engine(self.__db_url)

    def save_as_sql(self) -> None:
        try:
            columns = ', '.join([f'{col} TEXT' for col in CSV_COLUMNS + ['category', 'sentiment']])
            query = f'CREATE TABLE IF NOT EXISTS {SQL_TABLE_NAME} ({columns});'
            with self.__engine.connect() as connection:
                connection.execute(text(query))

            self.__news_data['category'] = self.__news_data['title'].apply(
                self.__classifier.classify
            )

            self.__news_data = self.__news_data.dropna(subset=['category'])

            world_mask = self.__news_data['category'] == 'World'
            business_mask = self.__news_data['category'] == 'Business'
            
            if world_mask.any():
                self.__news_data.loc[world_mask, 'sentiment'] = self.__news_data.loc[world_mask, 'title'].apply(
                    self.__world_sentiment_analyzer.world_analyze_sentiment
                )
            
            if business_mask.any():
                self.__news_data.loc[business_mask, 'sentiment'] = self.__news_data.loc[business_mask, 'title'].apply(
                    self.__business_sentiment_analyzer.business_analyze_sentiment
                )

            other_mask = ~(world_mask | business_mask)
            if other_mask.any():
                self.__news_data.loc[other_mask, 'sentiment'] = None

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