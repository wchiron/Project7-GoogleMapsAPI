class MyMap { 
    constructor(map) {
        this.map = map;
        this.markers = []; // to replace var markers = [] in a class
    }
    
    addMarker(props) { // a method, it's a function in an objet
        // two ways to pass the this value to the nested function, solution 1 : add var self = this at the top of the function to keep a reference to this. Solution 2, use ES6 way of writing function : () =>, functions written in this way will check and keep the same value of this for the nested function.

        // check content
        if(props.restaurantName){
            var infoWindow = new google.maps.InfoWindow({
                content:props.restaurantName //pass the restaurant name to show when marker is clicked
            });
            var marker = new google.maps.Marker({
                position: {lat:props.lat, lng:props.long},
                map:this.map,
                infowindow: infoWindow,
            });
            marker.addListener("click", () => {
                this.markers.forEach((marker) => {
                    marker.infowindow.close(this.map, marker); //onclick on marker close infoWindow of other markers
                }); 
                infoWindow.open(this.map, marker); // open new marker
                // link the event handle to click on the div of box-restaurant to show restaurant details when click on the marker
                restaurantManager.showRestaurantDetailsWhenClicked(props); // link the marker to the list, restaurant details will be shown when clicked on the marker
            });
            this.markers.push(marker);
        }

        $("#returnToList").click(function() { //remove the infoWindow when click on return button 
            infoWindow.close();
        })
    }

    clearMarkers() {
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(null);
        }
        this.markers.length = 0;
    }

    // get user position and show unique marker, use the location to search for nearby restaurants
    focusOnUserPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                var marker = new google.maps.Marker({
                    position: {lat:pos.lat, lng:pos.lng},
                    map: this.map,
                    animation: google.maps.Animation.DROP,
                    title: 'Vous êtes là !',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' // blut icon for the user position only       
                });
    
                this.map.setCenter(pos);
    
                // google place nearby search restaurants, leave the code here to be able to use the user location
                this.updateNearbyRestaurants(pos); // show restaurants around user's location
            }, () => {
                this.handleLocationError(true, infoWindow, this.map.getCenter());
            });
        } else {
            // Browser doesn't support Geolocation
            this.handleLocationError(false, infoWindow, this.map.getCenter());
        }
    }

    // use user location to search nearby restaurants, function reusable for search this area function
    updateNearbyRestaurants(centerLocation) {
        var request = {
            location: centerLocation, // by passing the location as parameter, this function is reused when searchAreaButton button is clicked
            radius: '500',
            type: ['restaurant']
        };
        listRestaurants = []; // clear the result list everytime the center changes to only show restaurant of the newest search
        var service = new google.maps.places.PlacesService(this.map);
        service.nearbySearch(request, this.nearbySearchCallback.bind(this)); // nearby search to get a list of restaurants with place id, using bind(this) to keep the this in the nearbySearchCallback, otherwise "this" is undefined in the parameter
    }

    // first get the address and latlng of the restaurant, since there is no review included in the nearby search, use another function getDetails to get the review details
    nearbySearchCallback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                var request = {
                    placeId: results[i].place_id,
                    fields: ["formatted_address","reviews"],
                };
    
                var goolePlaceName = results[i].name;
                var googlePlaceAddress = results[i].vicinity;
    
                var integrateGoogleRestaurants = {
                    "restaurantName": goolePlaceName,
                    "address": googlePlaceAddress,
                    "lat": results[i].geometry.location.lat(),
                    "long": results[i].geometry.location.lng(),
                    "ratings": [],
                };
    
                var service = new google.maps.places.PlacesService(map);
                service.getDetails(request, this.detailSearchCallBack(integrateGoogleRestaurants));
            }
        }
    }

    // get the review details of the restaurant
    detailSearchCallBack (integrateGoogleRestaurants) {  // the callback funtion that's gonna return a function, use this technic to use the var integrateGoogleRestaurants, and send the ratings to the var 
        return function callbackPlaceDetails(result, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                // createMarker(place);
                var reviews = result.reviews || []; // sometime a restaurant doesn't have comment, use || [] technic to add an empty array in this case to avoid forEach crashes
                reviews.forEach(function(review) {
                    var resultDetailRating = review.rating;
                    var resultDetailComment = review.text;
        
                    integrateGoogleRestaurants.ratings.push({
                        "stars": resultDetailRating,
                        "comment":  resultDetailComment,
                    });
                });
                listRestaurants.unshift(integrateGoogleRestaurants); // push the list here instead of previous function, otherwise the push will be executed before the function createCallBack finishs, end up with list being pushed to listRestaurant without the ratings and comments
                restaurantManager.sendListToHTML(listRestaurants); //update the list
            }
        }
    }

    // handle geolocation error
    handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
        infoWindow.open(map);
    }
}