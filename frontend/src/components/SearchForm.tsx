import { useState } from 'react';

interface SearchFormProps {
  onSubmit: (searchWord: string, daysBack: number) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSubmit }) => {
  const [searchWord, setSearchWord] = useState('');
  const [daysBack, setDaysBack] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(searchWord, daysBack);
  };

  const handleDaySelect = (day: number) => {
    setDaysBack(day);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        value={searchWord}
        onChange={e => setSearchWord(e.target.value)}
        placeholder="Search word"
        className="input input-bordered w-full max-w-xs"
      />

      <div className="dropdown dropdown-hover">
        <div tabIndex={0} role="button" className="btn m-1">
          {daysBack}-Day Back
        </div>
        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <li key={day}>
              <button 
                type="button"
                onClick={() => handleDaySelect(day)}
                className="w-full text-left"
              >
                {day}-Days Back
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button type="submit" className="btn btn-primary">
        Collect
      </button>
    </form>
  );
}; 