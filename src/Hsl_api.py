import requests
from datetime import datetime

defaultStart = "Kamppi, Helsinki::60.168992,24.932366"
defaultEnd = "Pisa, Espoo::60.175294,24.684855"
defaultDate = datetime.today().strftime('%Y-%m-%d')
defaultTime = datetime.now().strftime("%H:%M")

def hsl_api(start=defaultStart, end=defaultEnd, date=defaultDate, time=defaultTime):
  data = f"""{{
    plan(
      fromPlace: "{start}",
      toPlace: "{end}",
      date: "{date}",
      time: "{time}",
      numItineraries: 1
    ) {{
      itineraries {{
        legs {{
          startTime
          endTime
          from {{
            lat
            lon
            name
          }}
          to {{
            lat
            lon
            name
          }}
          mode
          trip {{
            routeShortName
          }}
          duration
          realTime
          distance
          legGeometry {{
            length
            points
          }}
        }}
      }}
    }}
  }}
  """
  response = requests.post('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', data=data)

  if response.status_code == 200:
    return(response.content)

  else:
    return('not found')
