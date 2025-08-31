// src/hooks/useSpeechToText.js
import { useEffect, useRef, useState } from 'react';

export function useSpeechToText({ lang = 'en-US', continuous = false } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.onerror = (event) => {
      setError(event.error || 'Speech recognition error');
      setListening(false);
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setResult(transcript.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [lang, continuous]);

  const start = () => {
    setResult('');
    setError(null);
    recognitionRef.current?.start();
  };
  const stop = () => recognitionRef.current?.stop();

  return { listening, error, result, start, stop };
}
