import pako from 'pako';

export function extractHeaderAndData(encodedString) {
  const headerInfo = {
    className: null,
    date: null,
  };
  
  if (encodedString.includes('---\n')) {
    const [header, compressed] = encodedString.split('---\n', 2);
    
    header.trim().split('\n').forEach(line => {
      if (line.includes(': ')) {
        const [key, value] = line.split(': ', 2);
        if (key === 'فصل') {
          headerInfo.className = value.trim();
        } else if (key === 'التاريخ') {
          headerInfo.date = value.trim();
        }
      }
    });
    
    return { headerInfo, compressedData: compressed.trim() };
  }
  
  return { headerInfo, compressedData: encodedString.trim() };
}

export function decodeData(compressed) {
  try {
    if (!compressed || typeof compressed !== 'string') {
      return null;
    }
    
    // URL decode first
    const urlDecoded = decodeURIComponent(compressed);
    
    // Restore base64 padding and characters
    let base64Str = urlDecoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Str.length % 4) {
      base64Str += '=';
    }
    
    // Decode base64
    const binaryString = atob(base64Str);
    const binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i);
    }
    
    // Decompress using pako
    const decompressed = pako.inflate(binaryData);
    
    // Convert to string
    const text = new TextDecoder('utf-8').decode(decompressed);
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } catch (error) {
    console.error('Decompression error:', error);
    return null;
  }
}

export function encodeData(data) {
  try {
    // Convert to JSON string if input is an object
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Convert to Uint8Array
    const textData = new TextEncoder().encode(text);
    
    // Compress using pako
    const compressed = pako.deflate(textData, { level: 9 });
    
    // Convert to base64
    let base64Str = btoa(String.fromCharCode(...compressed));
    
    // Make URL-safe
    const urlSafe = base64Str
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    return urlSafe;
  } catch (error) {
    console.error('Compression error:', error);
    return null;
  }
}