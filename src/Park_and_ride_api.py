import requests
def park_and_ride_api():
    response = requests.get('https://p.hsl.fi/api/v1/facilities.json')
    if response.status_code == 200:
      return(response.content)
    else:
      return('error number: {response.status_code}. Park and ride locations not found or no connection to server')