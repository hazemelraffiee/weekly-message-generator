export function decodeDataServer(encodedData) {
    try {
        // Make the base64 URL-safe string back to regular base64
        const base64 = encodedData
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        // Pad the base64 string if needed
        const paddedBase64 = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);

        // In Node.js environment, we use Buffer instead of atob
        const jsonString = Buffer.from(paddedBase64, 'base64').toString('utf8');
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error decoding data on server:', error);
        return null;
    }
}