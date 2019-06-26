function initMap() { // google maps init function called by the api script in the html file, with callback=initMap
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 48.8566969, lng: 2.3514616},
        zoom: 14
    });
    // infoWindow = new google.maps.InfoWindow;
    newMap = new MyMap(map); // use the class to creat an objet newMap to use

    // auto geolocation, get user's current location.
    newMap.focusOnUserPosition();

    //to add a new place, right click anywhere and show an infoWindow,
    var infowindow =  new google.maps.InfoWindow({
		content: '<button type="button" class="btn btn-link" data-toggle="modal" data-target="#addNewPlace" id="ifAddNewPlace">Ajouter un endroit ici</button>'
	});
	google.maps.event.addListener(map, 'rightclick', function(event) {
		infowindow.setPosition(event.latLng);
        infowindow.open(map);

        // first geocoder, get the place where right clicked, get the address from the latlng and pre-fill the form
        var geocoder = new google.maps.Geocoder(); 
        var latLng = {lat: event.latLng.lat(), lng: event.latLng.lng()}; // get the latLng where right-clicked

        geocoder.geocode({'location': latLng}, function(results, status) {  // use the latlng from the click to get address
            if (status === 'OK') {
                var addressComponentsNumber = results[0].address_components[0].long_name; // get address results from the api
                var addressComponentsStreetName = results[0].address_components[1].long_name;
                var addressComponentsCityName = results[0].address_components[2].long_name;
                var addressComponentsZip = results[0].address_components[6].long_name;

                $("#inputAddress").val(addressComponentsNumber + ", " + addressComponentsStreetName);  // fill in the form
                $("#inputCity").val(addressComponentsCityName);
                $("#inputZipCode").val(addressComponentsZip);

                $("#ifAddNewPlace").click(function() { // when user click on the button to add a new place, show the modal form with address info pre-filled
                    $("#addNewPlace").show();
                });
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }); 

    // adding the new place after click submit
    $("#form-addNewPlace").submit(() => {
        var newPlaceName = $("#inputNewName").val();
        var newPlaceAddress = $("#inputAddress").val(); // retake all the address inputs in case user changes the auto-filling content
        var newPlaceCity = $("#inputCity").val();
        var newPlaceZip = $("#inputZipCode").val();
        var newPlaceCompletAddress = newPlaceAddress + newPlaceCity + newPlaceZip;
        var newPlaceRatingString = $("input[name='inlineRadioOptions']:checked").val();
        var newPlaceRating = parseInt(newPlaceRatingString, 10);
        var newPlaceComment = $("#reviewForNewPlace").val();

        // seconde geocoder, contrary to the first one, use the address inputed to get the latlng
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'address': newPlaceCompletAddress}, function(results, status) {
            if (status === 'OK') {
                var finalAddressLatLng = results[0].geometry.location; // get the result from the api
                var newPlaceComplet = { // pushing the info needed to creat a new restaurant in the listRestaurant
                    "restaurantName": newPlaceName,
                    "address": newPlaceAddress + " " + newPlaceCity + ", " + newPlaceZip,
                    "lat": finalAddressLatLng.lat(),
                    "long": finalAddressLatLng.lng(),
                    "ratings": [{
                        "stars": newPlaceRating,
                        "comment": newPlaceComment,
                    }]
                };
                listRestaurants.unshift(newPlaceComplet); // instead of push, add new place to the beginning of the array
                $('#addNewPlace').modal('hide'); // hide the modal form when the new place is added
                restaurantManager.sendListToHTML(listRestaurants); // update the restaurant list
                // newMap.addMarker(newPlaceComplet,markers);//reuse the newMap class allows to have the same function as the other markers
                infowindow.close(); // close the info window with the add new place button

                $("#inputNewName").val("");// empty the input values if user finishes adding new place
                $(".form-row").val("");
                $("#reviewForNewPlace").val(""); 
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
        return false; 
    });
    $("#closeAddingPlace").click(function() { // close the infowindow of the button when click Fermer
        infowindow.close(); 
        $("#inputNewName").val(""); // empty the input values if user cancels adding new place
        $(".form-row").val("");
        $("#reviewForNewPlace").val("");   
    });

    // research the restaurant everytime screen center changes
    $("#searchAreaButton").click(function() {
        // var newCenter = map.getCenter();
        newMap.updateNearbyRestaurants(map.getCenter()); 
    });
    restaurantManager.sendListToHTML(listRestaurants); //show the list on the right of the screen when load
}

