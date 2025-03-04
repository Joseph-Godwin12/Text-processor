import {useEffect, useState } from 'react';

export default function TextProcessor() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState(true);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'ru', name: 'Russian' },
    { code: 'tr', name: 'Turkish' },
    { code: 'fr', name: 'French' },
  ];


  const summarizeText = async (text) => {
    try {
      if (window.ai && window.ai.summarizer) {
        const summarizerInstance = await window.ai.summarizer.create();
        if (summarizerInstance.summarize) {
          return await summarizerInstance.summarize(text);
        }
      }
      throw new Error("Summarizer API is not available");
    } catch (error) {
      console.error("Summarization failed:", error);
      throw new Error('Summarization failed');
    }
  };

  const translateText = async (text, targetLang) => {
    try {
      const response = await fetch(
        `https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(text)}`
      );
      if (!response.ok) {
        throw new Error(`Lingva API request failed with status ${response.status}`);
      }
      const data = await response.json();
      return data.translation || "Translation failed.";
    } catch (error) {
      console.error("Translation error:", error);
      throw new Error("Translation failed.");
    }
  };


  const handleSend = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const newMessage = {
        id: Date.now(),
        text: inputText,
        translations: {},
        summary: null,
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (messageId) => {
    setLoading(true);
    setError(null);
    try {
      const message = messages.find(m => m.id === messageId);
      const summary = await summarizeText(message.text);
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, summary } : msg
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (messageId, targetLang) => {
    setLoading(true);
    setError(null);
    try {
      const message = messages.find(m => m.id === messageId);
      const translation = await translateText(message.text, targetLang);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, translations: { ...msg.translations, [targetLang]: translation } }
            : msg
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const chatContainer = document.querySelector('.flex-1');
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 overflow-hidden">
      {welcomeMessage && (
        <div className="flex flex-wrap items-center justify-center mt-16 mb-4 p-4  text-blue-800 rounded shadow">
          👋 Welcome! Enter text to detect language and translate.
        </div>
      )}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className="bg-white rounded-lg shadow p-4 space-y-2">
            <p className="text-lg">{message.text}</p>
            <p className="text-sm text-gray-500">
              Detected Language: {languages.find(l => l.code === message.language)?.name || message.language}
            </p>
            <div className="flex flex-wrap gap-2">
              {message.language === 'en' && message.text.length > 150 && !message.summary && (
                <button
                  onClick={() => handleSummarize(message.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : '📝'} Summarize
                </button>
              )}
              <select
                onChange={(e) => handleTranslate(message.id, e.target.value)}
                disabled={loading}
                className="px-4 py-2 bg-white border rounded hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">🌐 Translate to...</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            {message.summary && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">📋 Summary:</p>
                <p>{message.summary}</p>
              </div>
            )}
            {Object.entries(message.translations).map(([lang, text]) => (
              <div key={lang} className="mt-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">🌐 {languages.find(l => l.code === lang)?.name}:</p>
                <p>{loading ? 'Translating...' : text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      {error && (
        <div className="mb-4 p-2 text-red-500 bg-red-50 rounded">⚠️ {error}</div>
      )}
      <div className="flex gap-2">
        <textarea
          className="flex-1 p-2 border-2 rounded resize-none h-14 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message here..."
        />
        <button
          onClick={() => {
            handleSend()
            setWelcomeMessage(false)
          }}
          disabled={loading || !inputText.trim()}
          className="self-end px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  )
}
