import requests
r = requests.get('https://p.hsl.fi/api/v1/facilities.json')
print(r.content)