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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="container mx-auto max-w-4xl p-4 py-8">
        <button
          onClick={() => navigate('/subcategories?category=custom')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors duration-200 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Custom
        </button>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Upload Word List</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload a PDF (syllabus, paper, book chapter) and we'll use AI to extract the most important terms for your custom game.
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
          <div className="space-y-6">
            {/* Topic Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Topic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g., Biology Chapter 5, World War II"
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 transition-all duration-200"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Give your word list a descriptive name
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                PDF File <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onFileChange}
                  className="block w-full text-sm text-gray-900 dark:text-gray-100 
                    file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 
                    file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-purple-600 
                    file:text-white hover:file:from-pink-600 hover:file:to-purple-700 
                    file:cursor-pointer file:transition-all file:duration-200
                    cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4
                    hover:border-pink-400 dark:hover:border-pink-500 transition-all duration-200"
                />
              </div>
              {file && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">Selected: {file.name}</p>
                </div>
              )}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Maximum file size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>

            {/* Max Terms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Maximum Terms to Extract
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={maxTerms}
                  onChange={(e) => setMaxTerms(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
                />
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={maxTerms}
                  onChange={(e) => setMaxTerms(parseInt(e.target.value || '30'))}
                  className="w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-center text-gray-900 dark:text-gray-100 font-semibold focus:border-pink-500 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                More terms = longer but more comprehensive word list
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold px-6 py-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting Terms...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Extract Terms with AI
              </>
            )}
          </button>
        </form>

        {/* Results Section */}
        {terms.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {topicName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Successfully extracted {terms.length} term{terms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold text-sm shadow-lg">
                {terms.length} terms
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {terms.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate(`/game?category=custom&subcategory=${encodeURIComponent(topicName)}`)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Playing with {topicName}
            </button>
          </div>
        )}

        {/* Info Cards */}
        {!terms.length && !loading && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload PDFs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload any PDF document and our AI will extract key terms automatically
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced AI identifies the most important concepts and terminology
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Play & Learn</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Turn your study materials into fun, interactive word games instantly
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadWordListPage;
