

function getRoute() {
    var startAddress = $('#startAddress').val()
    var endAddress = $('#endAddress').val()
    var startCoords = addressToCoordMap.get(startAddress)
    var endCoords = addressToCoordMap.get(endAddress)
    var startLat = startCoords[1]
    var startLon = startCoords[0]
    var endLat = endCoords[1]
    var endLon = endCoords[0]

    $.get('/api/route', { startAddress, endAddress, startLat, startLon, endLat, endLon })
        .done(data => {
            JSON.parse(data).forEach(leg => {
                points = polyline.decode(leg['legGeometry']['points'])
                
                color = get_color(leg['mode'])

                draw_polyline(points, color)
            })
        })
    return false
}

function get_color(mode) {
    if (mode === 'BUS')
        return '#007AC9'
    if (mode === 'TRAM')
        return '#00985F'
    if (mode === 'RAIL')
        return '#8C4799'
    if (mode === 'SUBWAY')
        return '#FF6319'
    if (mode === 'WALK')
        return '#333333'
    return '#333333'
}

function draw_polyline(points, color) {
    L.polyline(points,
        {
            color
        }).addTo(polyline_layer)
}

function autoComplete(request, response) {
    $.get('http://api.digitransit.fi/geocoding/v1/autocomplete', { text: request.term, sources: 'osm' })
        .done(data => {
            data.features.forEach(feature =>
                addressToCoordMap.set(feature.properties.label, feature.geometry.coordinates))

            response(data.features
                .filter(feature => feature.properties.region === 'Uusimaa')
                .map(feature => feature.properties.label))
        })
}

function initMap() {
    var map = L.map('map', {
        center: [60.192059, 24.945831],
        zoom: 13
    });

    L.tileLayer('https://cdn.digitransit.fi/map/v1/{id}/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 19,
        id: 'hsl-map'
    }).addTo(map);

    polyline_layer = L.layerGroup().addTo(map)
}

$(document).ready(() => {
    addressToCoordMap = new Map()

    $('#startAddress').autocomplete({
        source: autoComplete
    })
    $('#endAddress').autocomplete({
        source: autoComplete
    })

    initMap()
})