import base64
import json
import zlib
from typing import Dict, Union, Any, Tuple

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

def decode_data(encoded_string: str) -> Dict[str, Any]:
    """
    Decodes the compressed and base64 encoded string back into the original data structure.
    
    Args:
        encoded_string: The encoded string from the clipboard
        
    Returns:
        A dictionary containing the decoded data structure
        
    Raises:
        ValueError: If the string cannot be decoded properly
        json.JSONDecodeError: If the decompressed data is not valid JSON
    """
    try:
        # Extract header if present
        header_info, compressed_data = extract_header_and_data(encoded_string.strip())
        
        # Decode base64
        binary_data = base64.b64decode(compressed_data)
        
        # Decompress using zlib with parameters matching pako
        decompressed_data = zlib.decompress(
            binary_data,
            wbits=15  # Must match pako's windowBits parameter
        )
        
        # Decode UTF-8 and parse JSON
        json_str = decompressed_data.decode('utf-8')
        data = json.loads(json_str)
        
        # If we found header info, add it to the metadata
        if header_info['class_name'] or header_info['date']:
            if 'metadata' not in data:
                data['metadata'] = {}
            data['metadata'].update({
                'header_class_name': header_info['class_name'],
                'header_date': header_info['date']
            })
        
        return data
        
    except base64.binascii.Error as e:
        raise ValueError(f"Invalid base64 encoding: {str(e)}")
    except zlib.error as e:
        raise ValueError(f"Decompression failed: {str(e)}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON data: {str(e)}")
    except Exception as e:
        raise ValueError(f"Decoding failed: {str(e)}")

def encode_data(data: Dict[str, Any]) -> str:
    """
    Encodes a dictionary into a compressed and base64-encoded string.
    
    Args:
        data: The dictionary to encode.
        
    Returns:
        A base64-encoded, compressed string.
        
    Raises:
        ValueError: If the data cannot be serialized properly.
    """
    try:
        # Convert dictionary to JSON string
        json_str = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        
        # Compress the JSON string using zlib with matching parameters
        compressed_data = zlib.compress(json_str.encode('utf-8'), level=9)

        # Encode the compressed data in base64
        encoded_string = base64.b64encode(compressed_data).decode('utf-8')

        return encoded_string

    except (TypeError, ValueError) as e:
        raise ValueError(f"Encoding failed: {str(e)}")

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