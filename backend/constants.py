import os

CSV_COLUMNS = ['title', 'datetime', 'link', 'search_word']
SQL_TABLE_NAME = "headlindex"
CATEGORY_LIST = [
    'World',
    'Business',
    'Technology',
    'Entertainment',
    'Sports',
    'Science',
    'Health',
]
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")