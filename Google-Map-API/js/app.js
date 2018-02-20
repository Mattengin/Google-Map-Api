var locations = [
{title: 'Birmingham Zoo', location: {lat: 33.4860, lng: -86.7795}},
    {title: 'UAB', location: {lat: 33.5021, lng: -86.8064}},
    {title: 'Makarios', location: {lat: 33.5019781662405, lng: -86.7975303608446}},
    {title: 'Hoover masjid', location: {lat: 33.419584, lng: -86.814381}},
    {title: 'Riverchase gallria', location: {lat: 33.3781654, lng: -86.8063779}},
    {title: 'Birmingham Mueseum of Art', location: {lat: 33.5222, lng: -86.8101}},
    {title: 'Mcwane Science Center', location: {lat: 33.5148, lng: -86.8083}}
];

var ViewModel = function() {
	var self = this;
    this.List = ko.observableArray([]);

    var markers = [];
    var marker;
    var map;
    var placeMarkers = [];

    locations.forEach(function(loc) {
        self.List.push(loc);
    });

    // default location
    this.currentLocation = ko.observable(this.List()[0]);


    ViewModel.prototype.initMap = function() {
        // Constructor creates a new map - only center and zoom are required.
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 30.733315, lng: 76.779418},
            zoom: 13,
            mapTypeControl: false
        });

        map = this.map;

        var largeInfowindow = new google.maps.InfoWindow();

        var defaultIcon = makeMarkerIcon('0091ff');

        var highlightedIcon = makeMarkerIcon('008000');

        var bounds = new google.maps.LatLngBounds();

        // makes searchbox
        var searchBox = new google.maps.places.SearchBox(
            document.getElementById('places-search'));
        // Bias the searchbox to within the bounds of the map.
        searchBox.setBounds(map.getBounds());

        // makes an array.
        for (var i = 0; i < locations.length; i++) {
            // Get the position from the location array.
            var position = locations[i].location;
            var title = locations[i].title;
            // Create a marker per location, and put into markers array.
            var marker = new google.maps.Marker({
                position: position,
                title: title,
                animation: google.maps.Animation.DROP,
                id: i
            });
            markers.push(marker);
            marker.addListener('click', pop);
        
          
         
        }
        function pop() {
                populateInfoWindow(this, largeInfowindow);
                this.setAnimation(google.maps.Animation.BOUNCE);
                var m = this;
                setTimeout(function() { 
                    m.setAnimation(null);
                }, 2000);
            }

        // for when you click a autocorrected search
        searchBox.addListener('places_changed', function() {
          searchBoxPlaces(this);
        });

        // for search button
        document.getElementById('search-places').addEventListener('click', textSearchPlaces);

        //makes infowindow when icon clicked.
        function populateInfoWindow(marker, infowindow) {
            // Check to make sure the window is not already opened.
            if (infowindow.marker != marker) {
                infowindow.setContent('');
                infowindow.marker = marker;
                infowindow.addListener('closeclick', function() {
                    if(infowindow.marker !== null)
                        infowindow.marker.setAnimation(null);
                    // note this line
                });

                var streetViewService = new google.maps.StreetViewService();
                var radius = 50;

                infowindow.setContent(
                    '<div><h5 class=".h5" id="Title">' + 
                    marker.title + 
                    '</h5></div><div id="wiki-link" class="text-left text-info"><p>' + 
                    '</p></div><div id="pano"></div>'
                );

                infowindow.open(map, marker);

                var flag = true;
                var wiki = false;            

                var wikiElem = '';
                
                // Use streetview service to get the closest streetview image 
                streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
                infowindow.open(map, marker);

                var wikiRequestTimeout = setTimeout(function() {
                    wikiElem = 'failed to get wikipedia resources';
                }, 8000);

                var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +
                        marker.title +
                        '&format=json&callback=wikiCallback';

                $.ajax({
                    url:wikiUrl,
                    dataType:"jsonp",
                    //json callback
                    success:function(data) {
                        wiki = true;
                        for(var j = 1; j < data.length; j++) {
                            var articeList = data[j];
                            for(var i = 0; i < articeList.length; i++) {
                                articlestr = articeList[i];
                                if(articlestr.length > wikiElem.length) {
                                    wikiElem = articlestr;
                                }
                            }
                        }
                        console.log(wikiElem);
                        
                        if(flag === false) {
                            $('.setContent').text(wikiElem);
                            $('#pano').text("");
                            $('#pano').append("<span class='text-danger '>No Street View Found</span>");
                        } else {
                            $('#wiki-link').text(wikiElem);
                        }
                        clearTimeout(wikiRequestTimeout);
                    }
                }).fail(function(jqXHR, textStatus) {
                    if(jqXHR.status === 0) {
                        alert('You are offline!\n Please check your network.');
                    } else if(jqXHR.status == 404) {
                        alert('HTML Error Callback');
                    }
                    else alert( "Request failed: " + textStatus + "<br>");
                });
            }
        }
        function getStreetView(data, status) {
                    if (status == google.maps.StreetViewStatus.OK) {
                        var nearStreetViewLocation = data.location.latLng;
                        var heading = google.maps.geometry.spherical.computeHeading(
                            nearStreetViewLocation, marker.position
                            );

                        // incase of error
                        var errorTimeout = setTimeout(function() {
                            alert("Something went wrong");
                        }, 9000); 
                        clearTimeout(errorTimeout);

                        var panoramaOptions = {
                            position: nearStreetViewLocation,
                            pov: {
                                heading: heading,
                                pitch: 15
                            }
                        };
                        var panorama = new google.maps.StreetViewPanorama(
                            document.getElementById('pano'), panoramaOptions
                            );
                    } else {
                        $('#wiki-link').text(wikiElem);
                        $('#pano').text('');
                        $('#pano').append("<span class='text-danger '>Street View not found</span>");
                        flag = false;
                    }
                }

        // This function will loop the markers.
        function showListings() {
            // makes the map bigger based on markers
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(map);
                bounds.extend(markers[i].position);
            }
            map.fitBounds(bounds);
        }
        showListings();

        function hideMarkers(markers) {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
        }

        function searchBoxPlaces(searchBox) {
            hideMarkers(placeMarkers);
            var places = searchBox.getPlaces();
            if (places.length === 0) {
                window.alert('We did not find any places matching that search!');
            } else {
                // For each place, get the icon, name and location.
                createMarkersForPlaces(places);
            }
        }

       //search button function
        function textSearchPlaces() {
            var bounds = map.getBounds();
            hideMarkers(placeMarkers);
            var placesService = new google.maps.places.PlacesService(map);
            placesService.textSearch({
                query: document.getElementById('places-search').value,
                bounds: bounds
            }, function(results, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    createMarkersForPlaces(results);
                }
            });
        }

        // This function creates markers for each place found
        function createMarkersForPlaces(places) {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < places.length; i++) {
                var place = places[i];
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(35, 35),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(15, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };
                // Create a marker for each place.
                var marker = new google.maps.Marker({
                    map: map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location,
                    id: place.place_id
                });
                // Create a single infowindow to be used with the places info
                var placeInfoWindow = new google.maps.InfoWindow();
            
                // If a marker is clicked, do a place details search on it in the next function.
               
                placeMarkers.push(marker);
                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
                marker.addListener('click', forClick);
            }
             function forClick() {
                    if (placeInfoWindow.marker == this) {
                        console.log("This infowindow already is on this marker!");
                    } else {
                        getPlacesDetails(this, placeInfoWindow);
                    }
                }
            map.fitBounds(bounds);
        }

        function getPlacesDetails(marker, infowindow) {
            var service = new google.maps.places.PlacesService(map);
            service.getDetails({
                placeId: marker.id
            }, function(place, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    // Set the marker property on this infowindow so it isn't created again.
                    infowindow.marker = marker;
                    var innerHTML = '<div>';
                    if (place.name) {
                        innerHTML += '<strong>' + place.name + '</strong>';
                    }
                    if (place.formatted_address) {
                        innerHTML += '<br>' + place.formatted_address;
                    }
                    if (place.formatted_phone_number) {
                        innerHTML += '<br>' + place.formatted_phone_number;
                    }
                    if (place.opening_hours) {
                        innerHTML += '<br><br><strong>Hours:</strong><br>' +
                        place.opening_hours.weekday_text[0] + '<br>' +
                        place.opening_hours.weekday_text[1] + '<br>' +
                        place.opening_hours.weekday_text[2] + '<br>' +
                        place.opening_hours.weekday_text[3] + '<br>' +
                        place.opening_hours.weekday_text[4] + '<br>' +
                        place.opening_hours.weekday_text[5] + '<br>' +
                        place.opening_hours.weekday_text[6];
                    }
                    if (place.photos) {
                        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                        {maxHeight: 100, maxWidth: 200}) + '">';
                    }
                    innerHTML += '</div>';
                    infowindow.setContent(innerHTML);
                    infowindow.open(map, marker);
                    // Make sure the marker property is cleared if the infowindow is closed.
                    infowindow.addListener('closeclick', function() {
                        infowindow.marker = null;
                    });
                }
        });
    }


    for(var h = 0; h < locations.length; h++) {
        this.List()[h].marker = markers[h];
    }

    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34)
            );
            return markerImage;
        }
    };

    this.selectedLocation = function(LocClicked) {
        for(var b = 0; b < self.List().length; b++) {
            var title = self.List()[b].title;
            if(LocClicked.title == title) {
                this.currentLocation = self.List()[b];
            }
        }
        if(!this.marker) alert("Something didn't work");
        else {
            this.marker.setAnimation(google.maps.Animation.BOUNCE);
            // open an infoWindow when either a location is selected from 
            // the list view or its map marker is selected directly.
            google.maps.event.trigger(this.marker, 'click');
        }
    };

    // add filters
    this.searchedLocation = ko.observable('');

    this.Filter = function(value) {
        self.List.removeAll();
        for(var i = 0; i < locations.length; i++) {
            var searchQuery = locations[i].title.toLowerCase();
            // find the starting match in every location 
            if(searchQuery.indexOf(value.toLowerCase()) >= 0) {
                self.List.push(locations[i]);
            }
        }
    };

    this.FilterForMarkers = function(value) {
        for (var i = 0; i < locations.length; i++) {
            var temp = locations[i].marker;
            if (temp.setMap(map) !== null) {
                temp.setMap(null);
            }
            var searchQuery = temp.title.toLowerCase();
            if (searchQuery.indexOf(value.toLowerCase()) >= 0) {
                temp.setMap(map);
            }
        }
    };

    this.searchedLocation.subscribe(this.Filter);
    this.searchedLocation.subscribe(this.FilterForMarkers);
};

mapError = () => {
  // Error handling
};
var VM = new ViewModel();

// we'll need to tell knockout to apply our bindings to this viewModel
ko.applyBindings(VM);