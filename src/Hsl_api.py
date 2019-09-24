import requests

response = requests.post('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', data="""{
  plan(
    fromPlace: "Kamppi, Helsinki::60.168992,24.932366",
    toPlace: "Pisa, Espoo::60.175294,24.684855",
    date: "2019-09-25",
    time: "23:00:00",
    numItineraries: 3
  ) {
    itineraries {
      legs {
        startTime
        endTime
        mode
        duration
        realTime
        distance
      }
    }
  }
}""")

if response.status_code == 200:
    print(response.content)
else:
    print('not found')
