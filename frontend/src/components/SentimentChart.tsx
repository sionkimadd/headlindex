import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SentimentData {
  [year: string]: {
    [month: string]: {
      positive: number;
      neutral: number;
      negative: number;
      total: number;
    }
  }
}

interface SentimentChartProps {
  searchWord: string;
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ searchWord }) => {
  const [worldData, setWorldData] = useState<SentimentData>({});
  const [businessData, setBusinessData] = useState<SentimentData>({});
  const [activeTab, setActiveTab] = useState<'World' | 'Business'>('World');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [tooltipMonth, setTooltipMonth] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [worldResponse, businessResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/download/${encodeURIComponent(searchWord)}?category=World`),
        axios.get(`http://localhost:5000/api/download/${encodeURIComponent(searchWord)}?category=Business`)
      ]);

      const processData = (csvData: string, category: string): SentimentData => {
        const parsed = Papa.parse(csvData, { header: true });
        const rows = parsed.data as any[];
        const data: SentimentData = {};
        for (const row of rows) {
          if (!row.sentiment || !row.datetime || !row.category) continue;
          if (row.category.trim().toLowerCase() !== category.toLowerCase()) continue;
          const date = new Date(row.datetime);
          if (isNaN(date.getTime())) continue;
          const year = date.getFullYear().toString();
          const month = date.toLocaleString('default', { month: 'short' });
          const sentiment = row.sentiment;
          if (!data[year]) data[year] = {};
          if (!data[year][month]) data[year][month] = { positive: 0, neutral: 0, negative: 0, total: 0 };
          if (sentiment === 'positive') data[year][month].positive++;
          else if (sentiment === 'neutral') data[year][month].neutral++;
          else if (sentiment === 'negative') data[year][month].negative++;
          data[year][month].total++;
        }
        return data;
      };

      const wData = processData(worldResponse.data, 'World');
      const bData = processData(businessResponse.data, 'Business');
      setWorldData(wData);
      setBusinessData(bData);

      const years = Object.keys(activeTab === 'World' ? wData : bData).sort();
      const thisYear = new Date().getFullYear().toString();
      if (years.length > 0) {
        if (years.includes(thisYear)) setSelectedYear(thisYear);
        else setSelectedYear(years[0]);
      } else {
        setSelectedYear('');
      }
    };
    if (searchWord) fetchData();
  }, [searchWord]);
  useEffect(() => {
    const data = activeTab === 'World' ? worldData : businessData;
    const years = Object.keys(data).sort();
    const thisYear = new Date().getFullYear().toString();
    if (years.length > 0) {
      if (years.includes(thisYear)) setSelectedYear(thisYear);
      else setSelectedYear(years[0]);
    } else {
      setSelectedYear('');
    }
  }, [activeTab, worldData, businessData]);

  const currentData = activeTab === 'World' ? worldData : businessData;
  const years = Object.keys(currentData).sort();
  const yearData = currentData[selectedYear] || {};

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="tabs tabs-lift">
        <input
          type="radio"
          name="sentiment_tabs"
          className="tab"
          aria-label="World"
          checked={activeTab === 'World'}
          onChange={() => setActiveTab('World')}
        />
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <div className="mb-14 flex">
            <div className="dropdown dropdown-right">
              <div tabIndex={0} role="button" className="btn m-1">
                {selectedYear || 'No Data'}
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-32 p-2 shadow-sm">
                {years.length === 0 ? (
                  <li><span className="text-gray-400">No Year</span></li>
                ) : (
                  years.map((year) => (
                    <li key={year}>
                      <a
                        className={selectedYear === year ? 'active' : ''}
                        onClick={() => setSelectedYear(year)}
                      >
                        {year}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          {years.length === 0 ? (
            <div className="text-center text-gray-400 my-8">NULL</div>
          ) : (
            <div className="flex flex-row items-end w-full mt-2 space-x-2">
              {MONTHS.map((month) => {
                const data = yearData[month] || { positive: 0, neutral: 0, negative: 0, total: 0 };
                const total = data.total || 1;
                const positiveHeight = (data.positive / total) * 144;
                const neutralHeight = (data.neutral / total) * 144;
                const negativeHeight = (data.negative / total) * 144;
                const isTooltip = tooltipMonth === month;

                return (
                  <div
                    key={month}
                    className="flex flex-col items-center flex-grow relative"
                    onMouseEnter={() => setTooltipMonth(month)}
                    onMouseLeave={() => setTooltipMonth(null)}
                  >
                    {isTooltip && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 z-10 bg-base-200 text-xs rounded px-2 py-1 shadow flex gap-2"
                        style={{ bottom: 'calc(100% + 2px)' }}
                      >
                        <span className="text-lime-500 font-bold">{data.positive}</span>
                        <span className="text-yellow-400 font-bold">{data.neutral}</span>
                        <span className="text-red-600 font-bold">{data.negative}</span>
                      </div>
                    )}
                    <div className="flex flex-col-reverse w-4 h-36">
                      <div style={{ height: negativeHeight, background: '#dc2626' }} />
                      <div style={{ height: neutralHeight, background: '#fff000' }} />
                      <div style={{ height: positiveHeight, background: '#2FDE00' }} />
                    </div>
                    <span className="mt-2 text-xs font-bold">{month}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex w-full mt-3">
            <div className="flex items-center ml-auto">
              <span className="block w-4 h-4 bg-lime-500"></span>
              <span className="ml-1 text-xs font-medium">Positive</span>
            </div>
            <div className="flex items-center ml-4">
              <span className="block w-4 h-4 bg-yellow-400"></span>
              <span className="ml-1 text-xs font-medium">Neutral</span>
            </div>
            <div className="flex items-center ml-4">
              <span className="block w-4 h-4 bg-red-600"></span>
              <span className="ml-1 text-xs font-medium">Negative</span>
            </div>
          </div>
        </div>

        <input
          type="radio"
          name="sentiment_tabs"
          className="tab"
          aria-label="Business"
          checked={activeTab === 'Business'}
          onChange={() => setActiveTab('Business')}
        />
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <div className="mb-14 flex">
            <div className="dropdown dropdown-right">
              <div tabIndex={0} role="button" className="btn m-1">
                {selectedYear || 'No Data'}
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-32 p-2 shadow-sm">
                {years.length === 0 ? (
                  <li><span className="text-gray-400">No Year</span></li>
                ) : (
                  years.map((year) => (
                    <li key={year}>
                      <a
                        className={selectedYear === year ? 'active' : ''}
                        onClick={() => setSelectedYear(year)}
                      >
                        {year}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          {years.length === 0 ? (
            <div className="text-center text-gray-400 my-8">NULL</div>
          ) : (
            <div className="flex flex-row items-end w-full mt-2 space-x-2">
              {MONTHS.map((month) => {
                const data = yearData[month] || { positive: 0, neutral: 0, negative: 0, total: 0 };
                const total = data.total || 1;
                const positiveHeight = (data.positive / total) * 144;
                const neutralHeight = (data.neutral / total) * 144;
                const negativeHeight = (data.negative / total) * 144;
                const isTooltip = tooltipMonth === month;

                return (
                  <div
                    key={month}
                    className="flex flex-col items-center flex-grow relative"
                    onMouseEnter={() => setTooltipMonth(month)}
                    onMouseLeave={() => setTooltipMonth(null)}
                  >
                    {isTooltip && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 z-10 bg-base-200 text-xs rounded px-2 py-1 shadow flex gap-2"
                        style={{ bottom: 'calc(100% + 2px)' }}
                      >
                        <span className="text-lime-500 font-bold">{data.positive}</span>
                        <span className="text-yellow-400 font-bold">{data.neutral}</span>
                        <span className="text-red-600 font-bold">{data.negative}</span>
                      </div>
                    )}
                    <div className="flex flex-col-reverse w-4 h-36">
                      <div style={{ height: negativeHeight, background: '#dc2626' }} />
                      <div style={{ height: neutralHeight, background: '#fff000' }} />
                      <div style={{ height: positiveHeight, background: '#2FDE00' }} />
                    </div>
                    <span className="mt-2 text-xs font-bold">{month}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex w-full mt-3">
            <div className="flex items-center ml-auto">
              <span className="block w-4 h-4 bg-lime-500"></span>
              <span className="ml-1 text-xs font-medium">Positive</span>
            </div>
            <div className="flex items-center ml-4">
              <span className="block w-4 h-4 bg-yellow-400"></span>
              <span className="ml-1 text-xs font-medium">Neutral</span>
            </div>
            <div className="flex items-center ml-4">
              <span className="block w-4 h-4 bg-red-600"></span>
              <span className="ml-1 text-xs font-medium">Negative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};