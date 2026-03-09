# Search for '148' in 'app.js'
import os

filepath = r'c:\Users\Migue\Desktop\persiana-total-app\app.js'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        for i, line in enumerate(f, 1):
            if '148' in line:
                print(f"{i}: {line.strip()}")
else:
    print(f"File {filepath} not found.")
