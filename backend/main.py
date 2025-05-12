from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from database.csv_to_sql import CSVtoSQL
from fetcher.google_news_fetcher import GoogleNewsFetcher
from database.sql_to_csv import SQLtoCSV
from sort.sort_csv import sort_csv_files
from utils.file_utils import get_csv_path
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/news', methods=['POST'])
def google_news():
    try:
        data = request.get_json()
        search_word = data.get('search_word')
        days_back = int(data.get('days_back'))
        
        news_fetcher = GoogleNewsFetcher(search_word, days_back)
        news_fetcher.setup_period()
        news_data = news_fetcher.fetch_news()
        
        csv_to_sql = CSVtoSQL(news_data)
        csv_to_sql.save_as_sql()
        
        sql_to_csv = SQLtoCSV(get_csv_path(f'{search_word}_All.csv'), search_word)
        sql_to_csv.load_to_csv()
        
        sort_csv_files(search_word)
        
        return jsonify({'message': 'Success: News data processed successfully.'})
    except Exception:
        return jsonify({'error': 'Error: Failed to process news data.'}), 500

@app.route('/api/download/<search_word>', methods=['GET'])
def download_csv(search_word):
    try:
        category = request.args.get('category', '')
        if category == 'All':
            csv_path = get_csv_path(f'{search_word}_All.csv')
        elif category == 'Fragment':
            csv_path = get_csv_path(f'{search_word}_Fragment.csv')
        else:
            csv_path = get_csv_path(f'{search_word}_{category}.csv')
            
        if not os.path.exists(csv_path):
            return jsonify({'error': 'Error: File not found.'}), 404

        return send_file(csv_path, as_attachment=True, download_name=os.path.basename(csv_path))
    except Exception as e:
        return jsonify({'error': f'Error: Failed to download file. {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
