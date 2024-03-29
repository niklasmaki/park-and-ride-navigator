
var leafletMap;
function getRoute() {
    showModal()
    var startAddress = $('#startAddress').val()
    var endAddress = $('#endAddress').val()
    var startTime = $('#datetimepicker1').datetimepicker('viewDate').format('YYYY-MM-DDTHH:mm')
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
            emptyPreviousSearch() 
            drivingPart = JSON.parse(data)[0]['driving_part']
            transitPart = JSON.parse(data)[0]['transit_part']['data']['plan']['itineraries'][0]['legs']
            var points1 = handleDrivingPart(drivingPart, instructions, time)
            var points2 = handleTransitPart(transitPart, instructions)
            var all_points = points1.concat(points2)
            hideModal()
            var bounds = new L.LatLngBounds(all_points);
            leafletMap.fitBounds(bounds)
            showInstructions(instructions)
        })
    return false
}

function showModal() {
    $("#loadMe").modal({
      backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
      show: true //Display loader!
    });
    setTimeout(function() {
      //failsafe
      hideModal()
    }, 20000);
}

function hideModal(){
    $("#loadMe").modal("hide");
}

function emptyPreviousSearch() {
    var ul = document.getElementById('instructions')
    while(ul.firstChild) ul.removeChild(ul.firstChild)
    polylineLayer.clearLayers()
}

function handleDrivingPart(drivingPart, instructions, startTime) {
    points = polyline.decode(drivingPart['polyline'])
    color = '#333333'
    drawPolyline(points, color)
    endAddress = drivingPart['legs'][0]['end_address'].split(',')[0]
    instruction = `Leave at ${startTime}. Drive to ${endAddress}.`
    instructions.push({'innerHtml':instruction,'mode':'DRIVE'})
    return points
}

function handleTransitPart(transitPart, instructions) {
    points_list= []
    transitPart.forEach(leg => {
        points = polyline.decode(leg['legGeometry']['points'])
        points_list=points_list.concat(points)
        color = getColor(leg['mode'])
        drawPolyline(points, color)
        instructions.push(getInstruction(leg))
    })
    return points_list
}

function showInstructions(instructions) {
    var listParent = $("#instructions")
    instructions.forEach(instruction => {
        var listElement = document.createElement('li')
        listElement.setAttribute('class', 'list-group-item list-group-item-action')

        var rowElement = document.createElement('div')
        rowElement.setAttribute('class', 'row')
        var col1 = document.createElement('div')
        col1.setAttribute('class', 'col-9 unselectable')
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
    var endDate = new Date(leg['endTime'])
    var endTime = ('0' + endDate.getHours()).slice(-2) + ":" + ('0' + endDate.getMinutes()).slice(-2)
    var innerHtml = ''

    if (leg['from']['name'] === 'Origin') {
        innerHtml += `Leave the parking area by ${startTime}. `
        if (mode === 'WALK') {
            innerHtml += `Walk to ${leg['to']['name']}.`
            return { 'innerHtml': innerHtml, 'mode': mode }
        }
    }

    if (mode === 'WALK') {
        innerHtml += `Walk from ${leg['from']['name']} to ${leg['to']['name']}. `
        if (leg['to']['name'] === 'Destination') {
            innerHtml += `You will arrive at ${endTime}.`
        }
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
            'color':color,
            'weight':4,
            'opacity':0.8
        }).addTo(polylineLayer)
}

function autoComplete(request, response) {
    $.get('https://api.digitransit.fi/geocoding/v1/autocomplete', { text: request.term, sources: 'osm' })
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
        zoomDelta: 0.5,
        zoomSnap: 0.1,
        zoom: 13
    });
    leafletMap=map
    L.tileLayer('https://cdn.digitransit.fi/map/v1/{id}/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1,
        id: 'hsl-map'
    }).addTo(map);

    polylineLayer = L.layerGroup().addTo(map)

    $(window).on("resize", function() {
        setMapSize()
        map.invalidateSize();
    }).trigger("resize")
}

function setMapSize() {
    $("#map").height(0.8 * $(window).height()).width(0.4 * $(window).width())
}


$(document).ready(() => {

    addressToCoordMap = new Map()

    $('#startAddress').autocomplete({
        source: autoComplete
    })
    $('#endAddress').autocomplete({
        source: autoComplete
    })

    $('#datetimepicker1').datetimepicker({
        icons: {
            date: 'far fa-calendar',
            time: 'far fa-clock'
        },
        locale:  moment.locale("en-gb"),
        format: "DD.MM.YYYY HH:mm",
        minDate: moment()
    })

    $('#datetimepicker1').datetimepicker('date', moment()) 

    initMap()
})