from datetime import datetime, timedelta
import pandas as pd
from GoogleNews import GoogleNews
from constants import CSV_COLUMNS
from utils.file_utils import get_csv_path
from flask import jsonify

class GoogleNewsFetcher:
    def __init__(self, search_word, days_back):
        self.__search_word = search_word
        self.__days_back = days_back
        self.__fetched_list = None
        self.__start_date_str = None
        self.__end_date_str = None

    def setup_period(self):
        today = datetime.now().date()
        start_date = today - timedelta(days=self.__days_back)
        self.__start_date_str = start_date.strftime('%m/%d/%Y')
        self.__end_date_str = today.strftime('%m/%d/%Y')

    def fetch_news(self):
        g_news = GoogleNews(start=self.__start_date_str, end=self.__end_date_str)
        g_news.get_news(self.__search_word)
        self.__fetched_list = g_news.results()

        if not self.__fetched_list:
            raise Exception(f'Error: {self.__search_word}.')
            
        news_data = pd.DataFrame(self.__fetched_list)

        if not all(col in news_data.columns for col in ['title', 'datetime', 'link']):
            return pd.DataFrame(columns=CSV_COLUMNS)
            
        news_data = news_data[['title', 'datetime', 'link']]
        news_data = news_data.assign(
            datetime=pd.to_datetime(news_data['datetime'], errors='coerce'),
            search_word=self.__search_word
        )
        
        news_data = news_data[
            (news_data['title'].str.len() > 0) &
            (news_data['link'].str.startswith('http')) &
            (news_data['datetime'].notna()) &
            (news_data.count(axis=1) == 4)
        ]
        
        news_data.drop_duplicates(subset=['title'], keep='last', inplace=True)
        news_data.dropna(subset=['datetime'], inplace=True)
        news_data.sort_values('datetime', inplace=True)

        try:
            csv_path = get_csv_path(f'{self.__search_word}_Fragment.csv')
            news_data.to_csv(csv_path, index=False, encoding='utf-8')
        except Exception:
            return jsonify({'error': 'Error: Failed to fetch news data.'}), 500
        
        return news_data

    @property
    def search_word(self) -> str:
        return self.__search_word

    @property
    def days_back(self) -> int:
        return self.__days_back

    @property
    def start_date_str(self):
        return self.__start_date_str

    @property
    def end_date_str(self):
        return self.__end_date_str

    @property
    def fetched_list(self):
        return self.__fetched_list