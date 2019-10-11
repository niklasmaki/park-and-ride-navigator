

function getRoute() {
    var startAddress = $('#startAddress').val()
    var endAddress = $('#endAddress').val()
    var startTime = $('#startTime').val()
    var startCoords = addressToCoordMap.get(startAddress)
    var endCoords = addressToCoordMap.get(endAddress)
    var startLat = startCoords[1]
    var startLon = startCoords[0]
    var endLat = endCoords[1]
    var endLon = endCoords[0]
    $.get('/api/route', { startAddress, endAddress, startTime, startLat, startLon, endLat, endLon })
        .done(data => {
            var instructions = []
            var time = startTime.slice(-5)
            drivingPart = JSON.parse(data)[0]['driving_part']
            transitPart = JSON.parse(data)[0]['transit_part']['data']['plan']['itineraries'][0]['legs']

            handleDrivingPart(drivingPart, instructions, time)
            handleTransitPart(transitPart, instructions)

            showInstructions(instructions)
        })
    return false
}

function handleDrivingPart(drivingPart, instructions, startTime) {
    points = polyline.decode(drivingPart['polyline'])
    color = '#333333'
    drawPolyline(points, color)
    endAddress = drivingPart['legs'][0]['end_address'].split(',')[0]
    instruction = `Leave at ${startTime}. Drive to ${endAddress}.`
    instructions.push(instruction)
}

function handleTransitPart(transitPart, instructions) {
    transitPart.forEach(leg => {
        points = polyline.decode(leg['legGeometry']['points'])

        color = getColor(leg['mode'])
        drawPolyline(points, color)
        instructions.push(getInstruction(leg))
    })
}

function showInstructions(instructions) {
    var listParent = $("#instructions")
    instructions.forEach(instruction => {
        var listElement = document.createElement('li')
        listElement.setAttribute('class', 'list-group-item')
        listElement.innerHTML = instruction
        listParent.append(listElement)
    })
}

function getInstruction(leg) {
    var mode = leg['mode']
    var startDate = new Date(leg['startTime'])
    var startTime = ('0' + startDate.getHours()).slice(-2) + ":" + ('0' + startDate.getMinutes()).slice(-2)
    var result = ''

    if (leg['from']['name'] === 'Origin') {
        result += `Leave the parking area by ${startTime}. `
        if (mode === 'WALK'){
            result += `Walk to ${leg['to']['name']}.`
            return result
        }
    }

    if (mode === 'WALK') {
        result += `Walk from ${leg['from']['name']} to ${leg['to']['name']}.`
        return result
    }

    result += 'Take the '
    if (mode === 'BUS')
        result += 'bus '
    else if (mode === 'TRAM')
        result += 'tram '
    else if (mode === 'RAIL')
        result += 'train '
    else if (mode === 'SUBWAY')
        result += 'subway '
    else
        result += 'vehicle '

    result += `${leg['trip']['routeShortName']} at ${startTime} from ${leg['from']['name']} to ${leg['to']['name']}.`
    return result
}

function getColor(mode) {
    if (mode === 'BUS')
        return '#007AC9'
    if (mode === 'TRAM')
        return '#00985F'
    if (mode === 'RAIL')
        return '#8C4799'
    if (mode === 'SUBWAY')
        return '#FF6319'
    if (mode === 'WALK')
        return '#00B2A9'
    return '#333333'
}

function drawPolyline(points, color) {
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
    $("#startTime").val(new Date().toIsoString().slice(0, 16));

    addressToCoordMap = new Map()

    $('#startAddress').autocomplete({
        source: autoComplete
    })
    $('#endAddress').autocomplete({
        source: autoComplete
    })

    initMap()
})

// Helper method to get dates in correct timezone
// Source: https://stackoverflow.com/a/17415677
Date.prototype.toIsoString = function () {
    var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function (num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        'T' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
}