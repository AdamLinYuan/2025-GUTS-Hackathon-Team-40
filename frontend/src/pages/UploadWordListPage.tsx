import React, { useState } from 'react';
import { uploadTerms } from '../services/gameApi';
import { useNavigate } from 'react-router-dom';

const MAX_FILE_SIZE_MB = 20;

const UploadWordListPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [terms, setTerms] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [maxTerms, setMaxTerms] = useState(30);
  const [topicName, setTopicName] = useState('');
  const navigate = useNavigate();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setTerms([]);
    setError('');
    if (f) {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a PDF file.');
        setFile(null);
        return;
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File is too large. Max ${MAX_FILE_SIZE_MB}MB.`);
        setFile(null);
        return;
      }
    }
    setFile(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTerms([]);
    if (!topicName.trim()) {
      setError('Please enter a topic name.');
      return;
    }
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }
    try {
      setLoading(true);
      // Pass topicName along with file and maxTerms if your API supports it
      const result = await uploadTerms(file, maxTerms, topicName);
      setTerms(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to extract terms.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto max-w-3xl p-4 py-8">
        <button
          onClick={() => navigate('/subcategories?category=custom')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Custom
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Word List</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Upload a PDF (syllabus, paper, book chapter) and we'll extract the most important terms for a custom game.
        </p>

        <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Topic Name</label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Enter a name for your topic"
              className="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">PDF file</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={onFileChange}
              className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 dark:file:bg-pink-900 dark:file:text-pink-200"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Selected: {file.name}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Max terms</label>
            <input
              type="number"
              min={5}
              max={100}
              value={maxTerms}
              onChange={(e) => setMaxTerms(parseInt(e.target.value || '30'))}
              className="w-32 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? 'Extracting...' : 'Extract Terms'}
          </button>
        </form>

        {terms.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-3">{topicName} - Extracted Terms ({terms.length})</h2>
            <ul className="list-disc pl-6 space-y-1">
              {terms.map((t, i) => (
                <li key={i} className="text-gray-800 dark:text-gray-200">{t}</li>
              ))}
            </ul>
            <div className="mt-4">
              <button
                onClick={() => navigate('/game?category=custom&subcategory=Create%20Your%20Own')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
              >
                Use in Game (manual paste)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadWordListPage;
