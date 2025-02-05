import pako from 'pako';

export function decodeDataUniversal(encodedData) {
  try {
    // Make the base64 URL-safe string back to regular base64
    const base64 = encodedData
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Pad the base64 string if needed
    const paddedBase64 = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);

    // Use TextEncoder/TextDecoder API which works in both environments
    let jsonString;
    if (typeof window === 'undefined') {
      // Server-side
      jsonString = Buffer.from(paddedBase64, 'base64').toString('utf8');
    } else {
      // Client-side
      const binary = atob(paddedBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      jsonString = new TextDecoder().decode(bytes);
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error decoding data:', error);
    return null;
  }
}

export function compress(data) {
  try {
    // Convert input to string if it's not already
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Convert to Uint8Array for compression
    const uint8Array = new TextEncoder().encode(jsonStr);
    
    // Compress the data
    const compressed = pako.deflate(uint8Array);
    
    // Convert to base64 safely
    let result = '';
    for (let i = 0; i < compressed.length; i++) {
      result += String.fromCharCode(compressed[i]);
    }
    
    // Make the base64 URL-safe and encode the result
    const urlSafe = btoa(result)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return encodeURIComponent(urlSafe);
  } catch (error) {
    console.error('Compression error:', error);
    return '';
  }
}

export function decompress(compressed) {
  try {
    if (!compressed || typeof compressed !== 'string') {
      return null;
    }

    // First, URL decode the input
    const urlDecoded = decodeURIComponent(compressed);

    // Restore base64 padding and characters
    let base64 = urlDecoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Convert base64 to binary
    const binary = atob(base64);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Decompress
    const decompressed = pako.inflate(bytes);
    
    // Convert back to string
    const text = new TextDecoder().decode(decompressed);
    
    // Try to parse as JSON if possible
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    console.log('Decompression error:', error);
    return null;
  }
}