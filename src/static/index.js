

function getRoute() {
    startAddress = $('#startAddress').val()
    endAddress = $('#startAddress').val()
    
    $.get('/api/route', {startAddress, endAddress})
        .done(function(data) {
            console.log(data)
        })
    return false
}