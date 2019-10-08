from datetime import datetime
from time import sleep
import json

from Utils import return_closest_locations
from Gmaps_api import Gmapsdirs
from Hsl_api import hsl_api

def hsl_5_tries(s,e,d,t):
    '''Try 5 times to get a proper result from hsl_api and then fallback to 'not found'
    
    hsl_api sometimes fails to return a proper result and instead falls back to 'not found'.
    This function tries to circumvent the problem by querying the api until either a proper result
    is returned or 5 tries have been used up.
    '''
    for i in range(3):
        result = hsl_api(s,e,d,t)
        if result == 'not found':
            sleep(0.03)
            continue
        return result
    return 'not found'

def get_transit_end_seconds(transit_json_dict):
    '''Returns the end time in seconds since midnight, January 1, 1970 UTC.'''
    transit_data_legs = transit_json_dict['data']['plan']['itineraries'][0]['legs']
    end_seconds=transit_data_legs[len(transit_data_legs)-1]['endTime']/1000
    return end_seconds

def to_dict_or_not_found(json_string):
    if json_string == 'not found':
        return json_string
    else:
        return json.loads(json_string)

def calc_route_total_duration(route,start_seconds):
    end_seconds = get_transit_end_seconds(route['transit_part'])
    return end_seconds-start_seconds

def get_n_closest_routes(start_loc=(60.2489528,24.8229717),end_loc=(60.204001,24.958108),n=3):
    '''Returns routes through n closest parking locations from start_loc to end loc

    Parameters
    ----------
    start_loc : (int,int)
        The starting location for directions. (lat/lng tuple)

    end_loc : (int,int)
        The end location for directions. (lat/lng tuple)

    n : int
        The number of closest parking locations through which a route should be computed


    Return format
    -------------
    [{'driving_part':{},'transit_part':{},'total_seconds':int}, ...]

    Returns a list of routes sorted(ascending) by total duration in seconds.
    '''
    departure_time = int(datetime.now().replace(microsecond=0).timestamp())

    # Find n closest parking locations
    closest_parking_data = return_closest_locations(start_loc,n)
    closest_parking_locs = list(map(lambda x: x[1][1],closest_parking_data))

    # Find driving directions to n closest parking locations from start location
    gmaps = Gmapsdirs()
    driving_instructions = []
    for parking_loc in closest_parking_locs:
        driving_instructions.append(gmaps.get_directions(start_loc, parking_loc, time=departure_time))

    # Find transit options from n closest parking locations to end location
    transit_options = []
    for driving_instruction_set in driving_instructions:
        #gather required information
        start_location = driving_instruction_set['directions']['summary']['end_location']
        end_location = end_loc
        time_seconds = departure_time+driving_instruction_set['directions']['summary']['duration']['value']
        dt = datetime.fromtimestamp(time_seconds)
        #transform to format HSL API understands
        start_string = str(start_location['lat'])+","+str(start_location['lng'])
        end_string = str(end_location['lat'])+","+str(end_location['lng'])
        date_string = dt.strftime('%Y-%m-%d')
        time_string = dt.strftime("%H:%M:%S")
        #query for transit options
        transit_options.append(hsl_5_tries(start_string,end_string,date_string,time_string))

    routes = []
    for d, t in list(zip(driving_instructions, list(map(to_dict_or_not_found,transit_options)))):
        if t != 'not found':
            routes.append({"driving_part":d,"transit_part":t})

    for route in routes:
        route['total_seconds']=calc_route_total_duration(route,departure_time)

    routes.sort(key= lambda x: x['total_seconds'])
    return routes



