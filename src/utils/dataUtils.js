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