import React, { useState, useCallback, useEffect } from 'react';

const utf8BytesToString = (bytes) => {
  const utf8 = String.fromCharCode.apply(null, bytes);
  return decodeURIComponent(escape(utf8));
};

export const decodeData = (encodedData) => {
  try {
    const dataParam = encodedData.includes('?data=')
      ? encodedData.split('?data=')[1]
      : encodedData;

    const base64 = dataParam
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const paddedBase64 = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonString = utf8BytesToString(bytes);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error decoding data:', error);
    return null;
  }
};

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  useEffect(() => {
    try {
      const item = localStorage.getItem(`linkCreator_${key}`);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
  }, [key]);
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(`linkCreator_${key}`, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);
  return [storedValue, setValue];
};

export const DEFAULT_HOMEWORK_TYPES = {
  memorization: {
    id: 'memorization',
    label: 'حفظ',
    template: '',
    style: 'bg-green-950/50 text-green-400 hover:bg-green-900/50'
  },
  recentReview: {
    id: 'recentReview',
    label: 'مراجعة قريبة',
    template: '',
    style: 'bg-blue-950/50 text-blue-400 hover:bg-blue-900/50'
  },
  pastReview: {
    id: 'pastReview',
    label: 'مراجعة بعيدة',
    template: '',
    style: 'bg-purple-950/50 text-purple-400 hover:bg-purple-900/50'
  }
};