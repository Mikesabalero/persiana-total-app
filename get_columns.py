import urllib.request
import json

url = 'http://93.127.212.235:32770/api/v2/meta/tables/mwby85581fhjy27'
headers = {'xc-token': 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ'}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for column in data['columns']:
            print(f"{column['title']}: {column['column_name']}")
except Exception as e:
    print(f"Error: {e}")
