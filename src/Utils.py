import json
import geopy.distance
from queue import PriorityQueue
from Park_and_ride_api import park_and_ride_api

start = ((60.3249506,24.7274053)) #example start point
amount = 10

def return_closest_locations(start, amount): #read the park and ride.json data
    data = park_and_ride_api()
    results = json.loads(data).get("results")
    stops = []

# parse the json and only choosing the name and location as coordinates
    for x in results:
        coordinates = x["location"]["coordinates"][0][0]
        stops.append((x['name']['fi'], (coordinates[1],coordinates[0]))) # the hsl data has the longitude and latitude mixed up, this fixes it and appends it to a list.

 # measure the distance between the start and each stop and sort them by the shortest distance first
    q = PriorityQueue()
    for x in stops:
        distance = geopy.distance.distance(start, x[1]).km
        q.put((distance, x))

    # return the amount of closest stops, 10 is by default 
    closest_stops = []
    for x in range(amount): 
        closest_stops.append(q.get())
    return(closest_stops)


def tuple_to_str(tpl):
    """
        Converts the given 2-tuple to a comma separated string.
    """
    return '{},{}'.format(tpl[0], tpl[1])