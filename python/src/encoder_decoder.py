import base64
import json
from urllib.parse import unquote
import zlib
from typing import Dict, Optional, Union, Any, Tuple

def extract_header_and_data(encoded_string: str) -> Tuple[Dict[str, str], str]:
    """
    Extracts header information and compressed data from the encoded string.
    Returns a tuple of (header_info, compressed_data).
    """
    # Initialize empty header
    header_info = {
        'class_name': None,
        'date': None
    }
    
    # Check if the string contains a header section
    if '---\n' in encoded_string:
        header, compressed = encoded_string.split('---\n', 1)
        
        # Parse header lines
        for line in header.strip().split('\n'):
            if ': ' in line:
                key, value = line.split(': ', 1)
                if key == 'فصل':
                    header_info['class_name'] = value.strip()
                elif key == 'التاريخ':
                    header_info['date'] = value.strip()
        
        return header_info, compressed.strip()
    
    # If no header found, return empty header and the full string as data
    return header_info, encoded_string.strip()

def decode_data(compressed: str) -> Optional[Dict[str, Any]]:
    """
    Decodes a compressed string using the same algorithm as the JS version.
    
    Args:
        compressed: The compressed string to decode
        
    Returns:
        The decoded data structure, or None if decoding fails
    """
    try:
        if not compressed or not isinstance(compressed, str):
            return None

        # URL decode first, matching JS decodeURIComponent
        url_decoded = unquote(compressed)
        
        # Restore base64 padding and characters, matching JS version
        base64_str = url_decoded.replace('-', '+').replace('_', '/')
        while len(base64_str) % 4:
            base64_str += '='
            
        # Decode base64
        binary_data = base64.b64decode(base64_str)
        
        # Decompress using zlib (equivalent to pako.inflate)
        decompressed_data = zlib.decompress(binary_data, wbits=15)
        
        # Decode to UTF-8 string
        text = decompressed_data.decode('utf-8')
        
        # Try to parse as JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return text
            
    except Exception as e:
        print('Decompression error:', str(e))
        return None

def encode_data(data: Dict[str, Any]) -> str:
    """
    Encodes data into a compressed, URL-safe string matching the JS implementation.
    
    Args:
        data: Dictionary or string to encode
        
    Returns:
        A URL-safe compressed string
    """
    try:
        # Convert to JSON string if input is a dictionary
        if isinstance(data, dict):
            text = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        else:
            text = str(data)
        
        # Compress the string using zlib (equivalent to pako.deflate)
        compressed_data = zlib.compress(text.encode('utf-8'), level=9)
        
        # Encode to base64
        base64_str = base64.b64encode(compressed_data).decode('utf-8')
        
        # Make URL-safe by replacing characters and removing padding
        url_safe = base64_str.rstrip('=').replace('+', '-').replace('/', '_')
        
        return url_safe
        
    except Exception as e:
        print('Compression error:', str(e))
        return None

def _test_decoder():
    # Example encoded string (this would normally come from the clipboard)
    example_encoded = """
فصل: الفوج الرابع
التاريخ: السبت، ٣  شعبان  ١٤٤٦ هـ الموافق السبت، 1  فبراير  2025 م
---
eNrFV1Fq20AQvcqy31axHUohJ+hP+9PPUoKIlSbUtoIlN5RgaIzlpqaHSGI7coJd13FK6p5k9zZ9s1JMA9qVKispgSCzs/Nm376ZnTnmDce3a7Zv8+1j7u3uu279td1w+DYXKxmIBRMT2WcilD3xXdyJUEyYxcRM9mQXP66ZHMhTGUQGSzER17zEd+u25917wYI8kadiGtksyIVYwQqgDoG27CPYVcvV51a5apUrWNpzWw3b951a7CDyLL4xOWRM3IoVfoYIi8lzOcLfJZNf5GcFIANghUDssgc7KzA+wTfw5QDHYgTIZMA7Jb7v2DWntaPC3mmmxR1bR+E/RXjERLNmN3cVXWIIH2QS71+JuRzQwmHL8Zymz7f9Vtsp8Trie3XQbPuOhzDJj7qqvliuD4SfGXcGuPFAzJkYiyU+QmhjIHtxCIhmntXNTyIn2ndDnxkDUJTOYwbFlBAZYiA6MzpYwngQC5XioPhxqNTd1bJiDtuC+zwYRmQ82Lln1z3dmacq2PUB8In/abgVhRtAOH3sU8zdQTZfM8Ubp+762ujmwcBJxpBja3ZfAWZ0x7KfBr1V7lAyuQ3nyG19IGvk08H7ZgMbsPz2mPufDlXOzKD1X1Qo3KavvPE4NwIkwwwnvqLUObPwbwizyI1Te+O3a7EvjZjfdUprFIodSp2Cb7jrigVucSKuUmAvCfSsGFAqGCTVRFDYhEjdnlrMB5aJR/OBEgS2OYfnlhwXAWjgT/yG1S0Wr3ICabgTP+CXTqnetgs5suRQhlqMpHqWh7+HsODvQi/8fwM1cTjDW7XIDaNTH71v3ejA6iCXeoTkyphLgF2yLAzJnLk3EFdvEyyd+NSFMDkxpaz+JcslvBgSNxUWB6ihT/YhjhlTCukhOUOlq1D1jPmRdTrsRm/gSIYoR9qClNxO5ZcgFY2hBdSCAE35O6bnQXWaEaXUP1LHmhs504NiVqepUdv8ZRkZZJoLuUh6swaQkv3nckxlU/9kp/biGxUCKgUYWx4B3cT1FO1lIYjZekvL2FcmNr/5SS0MyfwqUSVdaNVpQAMe9fUfD9y29/Kv7l13ymhJM9Vwmt81k6ZaM0xivPJsi2umHl7l2gFyjZk8tcDtC542Q0Y+Msy5KhDNEA4n0ciXeGePx1tVHdDA21NxE3szsRMn6P8RUSVFRE/GQ6fzB2/ZTUE=
"""
    
    try:
        decoded_data = decode_data(example_encoded)
        
        with open('decoded_data.json', 'w', encoding="utf-8") as f:
            json.dump(decoded_data, f, ensure_ascii=False, indent=2)
                
    except ValueError as e:
        print(f"Error decoding data: {e}")

def _test_encoder():
    # Read the JSON data from the file
    with open('decoded_data.json', 'r', encoding="utf-8") as f:
        decoded_data = json.load(f)

    # Encode the loaded JSON data
    encoded_string = encode_data(decoded_data)

    # Print the encoded string
    print(encoded_string)


# Example usage:
if __name__ == "__main__":
    _test_encoder()