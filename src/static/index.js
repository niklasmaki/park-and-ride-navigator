

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
    instructions.push({'innerHtml':instruction,'mode':'DRIVE'})
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

        var rowElement = document.createElement('div')
        rowElement.setAttribute('class', 'row')
        var col1 = document.createElement('div')
        col1.setAttribute('class', 'col-9')
        col1.innerHTML = instruction.innerHtml
        rowElement.append(col1)

        var col2 = document.createElement('div')
        col2.setAttribute('class', 'col-3')

        var col2span = document.createElement('span')
        col2span.setAttribute("style", 'font-size: 32px; color: ' + getColor(instruction.mode))

        var col2spanIcon = document.createElement('i')
        col2spanIcon.setAttribute("class", getIcon(instruction.mode))

        col2span.append(col2spanIcon)
        col2.append(col2span)
        rowElement.append(col2)
        listElement.append(rowElement)
        listParent.append(listElement)
    })
}

function getInstruction(leg) {
    var mode = leg['mode']
    var startDate = new Date(leg['startTime'])
    var startTime = ('0' + startDate.getHours()).slice(-2) + ":" + ('0' + startDate.getMinutes()).slice(-2)
    var innerHtml = ''

    if (leg['from']['name'] === 'Origin') {
        innerHtml += `Leave the parking area by ${startTime}. `
        if (mode === 'WALK') {
            innerHtml += `Walk to ${leg['to']['name']}.`
            return { 'innerHtml': innerHtml, 'mode': mode }
        }
    }

    if (mode === 'WALK') {
        innerHtml += `Walk from ${leg['from']['name']} to ${leg['to']['name']}.`
        return { 'innerHtml': innerHtml, 'mode': mode }
    }

    innerHtml += 'Take the '
    if (mode === 'BUS')
        innerHtml += 'bus '
    else if (mode === 'TRAM')
        innerHtml += 'tram '
    else if (mode === 'RAIL')
        innerHtml += 'train '
    else if (mode === 'SUBWAY')
        innerHtml += 'subway '
    else
        innerHtml += 'vehicle '

    innerHtml += `${leg['trip']['routeShortName']} at ${startTime} from ${leg['from']['name']} to ${leg['to']['name']}.`
    return { 'innerHtml': innerHtml, 'mode': mode }
}

function getIcon(mode) {
    if (mode === 'BUS')
        return 'fas fa-bus'
    if (mode === 'TRAM')
        return 'fas fa-tram'
    if (mode === 'RAIL')
        return 'fas fa-train'
    if (mode === 'SUBWAY')
        return 'fas fa-subway'
    if (mode === 'WALK')
        return 'fas fa-walking'
    if (mode === 'DRIVE')
        return 'fas fa-car'
    return 'fas fa-car-side'
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
    if (mode === 'DRIVE')
        return '#333333'
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