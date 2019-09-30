import googlemaps
from datetime import datetime

class Gmapsdirs:
    '''Wrapper class for google maps directions
    
    Initialize and then call get_directions method.
    
    REQUIRES:
        a valid API key in Gmaps_apikey.txt.

    Example usage:
        gmapsdirs = Gmapsdirs()
        directions = gmapsdirs.get_directions("Itakeskus Finland","Kilpisjarvi Finland")
    '''
    def __init__(self):
        '''Initializes Googlemaps API with API key'''
        with open("Gmaps_apikey.txt") as f:
            self.gmaps = googlemaps.Client(key=f.read())
        print(self.gmaps)

    def get_directions(self, start_loc, target_loc, time_mode='departure', time=None):
        '''Returns directions object with information on how to drive from start_loc to target_loc.

        Parameters
        ----------
        start_loc : str or (int,int)
            The starting location for directions. (location name or lat/lng tuple)

        target_loc : str or (int,int)
            The target location for directions. (location name or lat/lng tuple)

        time_mode : str ("departure" or "arrival")
            The time mode for giving directions ("departure"(default) or "arrival")

        time : int
            The time to be used for "departure" or "arrival".
            Given as integer seconds since midnight, January 1, 1970 UTC.

        Return format
        -------------
        {
            'map_bounds':{},
            'directions':{
                'summary':{},
                'steps':[]
            },
            'additional_info':[]
        }
        '''

        #Set time to current time if not specified
        if time == None:
            #time since midnight, January 1, 1970 UTC 
            time = int(datetime.now().replace(microsecond=0).timestamp())

        directions = None
        if time_mode == 'departure':
            directions = self.gmaps.directions(start_loc,target_loc,mode='driving',departure_time=time)
        else:
            directions = self.gmaps.directions(start_loc,target_loc,mode='driving',arrival_time=time)

        #A little bit of formating for the result to make sense
        retobj = {
            'map_bounds':directions[0]['bounds'],
            'directions':{
                'summary': dict((key,directions[0]['legs'][0][key]) for key in directions[0]['legs'][0] if key != "steps"),
                'steps': directions[0]['legs'][0]['steps']
            },
            'additional_info':directions[0]['summary']
        }

        return retobj