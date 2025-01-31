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

# Example usage:
if __name__ == "__main__":
    # Example encoded string (this would normally come from the clipboard)
    example_encoded = """
فصل: الفوج الثاني
التاريخ: الأربعاء، ٣٠  رجب  ١٤٤٦ هـ الموافق الأربعاء، 29  يناير  2025 م
---
eJyNUt2K00AUfpXhXKewKWxg8wTe6I2X0ovQjG6xTZZm6iIlYEtTQ/AhXLqYtG4MsStan+Q7byOTpCJrf3I7Z76/c74pjaRyXEc5ZE8p6F/7/vCFM5JkE3YcoRTIeCmQ8gLf8BMpMtERyHnBc6TYCE445qj+sEWGDRnUHzpBsGdJecEzjvFQ//mKlJeckEGuo6QWHTu3ZFP3onvZuTA73Ssy6LU/HjlKSbchwAolMuyQ4g6fBK/4sxAo8YBMCL7je77nL4I/8odKhCOOkfKM5+IAunsltOslUk5QCqGVBUcUhgZpUc91vH7lDN85QYpCIKtodeItR5zo4c1YBtJTZKvxRBo0dJR8PvAmSgZkE4UGYYWcI43WHgqN5nk75A7ZHldqkv0FHivPWUt5XmIrsELGcb2WGTYcI28F52jvfscxCqxbOq87s+UlinYIveNCIK/LdQ5jXuozXfsjeeuP3+rfThAM3ngj6amA7FdTUu9vqt7lPMMvXUbfUxVb3aRcXwFrMhqgdF+qiduge6Hxl0AHQYoH7LAWPEepN18BnzD+RopHTo5xnjpEL+yFhs77buBPgmf/pGrsny4hmXS0ZvXsbJHIov+uVr0duH8jd7xWjaYma2b4UQkVldtK6um5yWradnDZZ/JbJ/Jb7fKbB/KbR/Jb5/JbJ/ObB/ObFIbhH4tJ2F8=
"""
    
    try:
        decoded_data = decode_data(example_encoded)
        
        # Print the decoded data structure
        print("Decoded Data:")
        print(json.dumps(decoded_data, ensure_ascii=False, indent=2))
        
        # Access specific fields
        if 'metadata' in decoded_data:
            print("\nMetadata:")
            print(f"Class: {decoded_data['metadata'].get('className')}")
            print(f"Date: {decoded_data['metadata'].get('date', {}).get('formatted')}")
        
        if 'attendance' in decoded_data:
            print("\nAttendance:")
            for student, data in decoded_data['attendance'].items():
                status = "حاضر" if data['present'] else "غائب"
                late = f" (متأخر {data['lateMinutes']} دقيقة)" if data['present'] and data['lateMinutes'] else ""
                print(f"{student}: {status}{late}")
                
    except ValueError as e:
        print(f"Error decoding data: {e}")