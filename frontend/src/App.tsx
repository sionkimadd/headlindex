import { useState } from 'react';
import axios from 'axios';
import { SearchForm } from './components/SearchForm';
import { AlertMessage } from './components/AlertMessage';
import { DownloadLink } from './components/DownloadLink';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SentimentChart } from './components/SentimentChart';

function App() {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchWord, setSearchWord] = useState('');

  const handleSubmit = async (searchWord: string, daysBack: number) => {
    if (!searchWord.trim()) {
      setMessage('Error: Search word is required.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setIsError(false);
    setSearchWord(searchWord);

    try {
      const res = await axios.post('http://localhost:5000/api/news', {
        search_word: searchWord,
        days_back: daysBack
      });

      setMessage('Success: Process completed successfully.');
      setIsError(false);
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const errorMessage = JSON.parse(reader.result as string).error;
          setMessage(errorMessage || 'Error: An error occurred.');
        };
        reader.readAsText(err.response.data);
      } else {
        setMessage(err.response?.data?.error || 'Error: An error occurred.');
      }
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen p-4">
      <SearchForm onSubmit={handleSubmit} />
      {message && <AlertMessage message={message} isError={isError} />}
      {!isError && searchWord && <DownloadLink searchWord={searchWord} />}
      {message === 'Success: Process completed successfully.' && !isError && searchWord && (
        <SentimentChart searchWord={searchWord} />
      )}
      {isLoading && <LoadingSpinner />}
    </div>
  );
}

export default App;
