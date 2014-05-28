// Default position
$(function() {
    var userId = Math.random().toString(16).substring(2,15);
    var socket = io.connect('/');
    var map;
    var doc = $(document);
    var sentData = {};
    var connects = {};
    var markers = {};
    var active = false;
    socket.on('load:coords', function(data) {
        if (!(data.id in connects)) {
            setMarker(data);
        }

        connects[data.id] = data;
        connects[data.id].updated = $.now(); // shothand for (new Date).getTime()
    });
    // check whether browser supports geolocation api
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
    } else {
        $('.map').text('Your browser is out of fashion, there\'s no geolocation!');
    }
    function positionSuccess(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        var acr = position.coords.accuracy;
        var optionsGmaps = {
            navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoom: 15
        };

        // Init map
        map = new google.maps.Map(document.getElementById("map"), optionsGmaps);
        // mark user's position
        var latlng = new google.maps.LatLng(lat, lng);
        var userMarker = new google.maps.Marker({
            position: latlng,
            map: map,
            title:"You are here"
        });
        // uncomment for static debug
        // userMarker = L.marker([51.45, 30.050], { icon: redIcon });

        // load leaflet map
        map.panTo(latlng);


        var emit = $.now();
        // send coords on when user is active
        doc.on('mousemove', function() {
            active = true;

            sentData = {
                id: userId,
                active: active,
                coords: [{
                    lat: lat,
                    lng: lng,
                    acr: acr
                }]
            };

            if ($.now() - emit > 30) {
                socket.emit('send:coords', sentData);
                emit = $.now();
            }
        });
    }
    doc.bind('mouseup mouseleave', function() {
        active = false;
    });
    // showing markers for connections
    function setMarker(data) {
        for (var i = 0; i < data.coords.length; i++) {
            var latlng = new google.maps.LatLng(data.coords[i].lat, data.coords[i].lng);
            var marker = new google.maps.Marker({
                position: latlng,
                map: map,
                title:"You are here"
            });
           // alert('One more external user is here!');
            markers[data.id] = marker;
        }
    }
    // handle geolocation api errors
    function positionError(error) {
        var errors = {
            1: 'Authorization fails', // permission denied
            2: 'Can\'t detect your location', //position unavailable
            3: 'Connection timeout' // timeout
        };
        showError('Error:' + errors[error.code]);
    }
    function showError(msg) {
        info.addClass('error').text(msg);

        doc.click(function() {
            info.removeClass('error');
        });
    }
    setInterval(function() {
        for (var ident in connects){
            if ($.now() - connects[ident].updated > 15000) {
                delete connects[ident];
                markers[ident].setMap(null);
            }
        }
    }, 15000);
});