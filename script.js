"use strict";
var sortListByMinStars = '';
var sortListByMaxStars = 5;
$("#box-showRestaurantDetails").hide(); 
$("#addNewPlace").hide(); 

var map, infoWindow, newMap, restaurantManager;

class RestaurantManager {
    constructor() { // things to reuse, 
        this.totalStar = 5; // to use when calculate average rating
    }

    calculateAverageRating(restaurant) {
        var totalRating = 0;
        var averageRating = 0;
    
        restaurant.ratings.forEach(function(ratings) {
            totalRating += ratings.stars;
        });
    
        averageRating = totalRating/restaurant.ratings.length; // get the average rating
        var roundedAverageRating = Math.round(averageRating * 10) / 10; // round the average rating to 1 decimal
        return roundedAverageRating;
    }

    sendListToHTML(restaurants) {
        $(".listRestaurant").remove(); // not emptying the list-wrap to keep the sort option
        newMap.clearMarkers(); // clear all the markers before updating the markers to avoid adding multiple for one location
        restaurants.forEach((restaurant) => { //using forEach instead of a for loop to have a distinct closure for every iteration, meaning get the right i every time 
            var averRatingToShow = this.calculateAverageRating(restaurant); 
            var starPercentage = Math.round((averRatingToShow/this.totalStar) * 100);// round the average number and get percentage
    
            //create html tags in one var to make it more readable
            var listRestaurantHTML = $(`  
            <div class="listRestaurant">
                <h6>${restaurant.restaurantName}</h6>
                <div class="stars-outer">
                    <div class="stars-inner" style="width: ${starPercentage}%;"></div>
                </div>
                <span class="number-rating">${averRatingToShow}</span>
                <p>${restaurant.address}</p>
            </div>
            `);
            $("#listOfRestaurants").append(listRestaurantHTML); // send the var which contains html tags to the page
    
            //add event handler on the listRestaurant div to show restaurant details when click
            listRestaurantHTML.click(() => { 
                this.showRestaurantDetailsWhenClicked(restaurant);
            });
                // loop through listRestaurant to pass markers
            newMap.addMarker(restaurant);
        })
    }

    showRestaurantDetailsWhenClicked(restaurant) {
        $("#list-wrap").hide();
        $("#showRestaurantDetails").empty(); // empty the content after every click
        $("#box-showRestaurantDetails").show(); // show the new content with return button
        $(".streetView").empty(); // preventing showing previous streetview pic
        $(".showStar").empty();
        $("#form-addNewComment").off("submit"); // remove the event handler to avoid adding multiple handlers on the submit button
        var averRatingToShow = this.calculateAverageRating(restaurant); 
        var starPercentage = Math.round((averRatingToShow/this.totalStar) * 100); // get the percentage to pass to the star inner width
        var restaurantComment = this.commentToShow(restaurant);
        var adressStreetViewURL = "https://maps.googleapis.com/maps/api/streetview?size=312x240&location=" + restaurant.lat + "," + restaurant.long + "&heading=151.78&pitch=-0.76&key=AIzaSyAqxE4oHzIGt8Bg9Eb3yhjz6-arNbRbE5A";    
    
        var listRestaurantHTMLClicked = $(`
            <div class="streetView"><img src="${adressStreetViewURL}"></div>
            <div class="showName">${restaurant.restaurantName}</div>
            <div class="showStar">
                <div class="stars-outer">
                    <div class="stars-inner" style="width: ${starPercentage}%;"></div>
                </div>
                <span class="showRating">${averRatingToShow}</span>
            </div>
            <div class="showAdress">${restaurant.address}</div>
            <div class="showComment">${restaurantComment}</div>
        `);
        $("#showRestaurantDetails").append(listRestaurantHTMLClicked);
    
    
        $("#form-addNewComment").submit(() => { //link the function to the submit function instead of button to avoid adding invalid comments to the page
            this.addNewRatingAndComment(restaurant);
            return false; //for not refresh the page and erase everything
        });
    }

    commentToShow(restaurant) {
        var commentToShow = "";
        restaurant.ratings.forEach(function(ratings) {
            commentToShow += "<p>Avis : " + ratings.comment + "</br></p>";  // try use map, then array.join() ["a", "b"].join(",") == "a,b"
        })
        return commentToShow;
    }

    // get the form input value and update the restaurant rating after submit
    addNewRatingAndComment(restaurant) {
        var selectedRatingString = $("#your-rating").val(); // get the selected value
        var newComment = $("#your-review").val(); // get the inputed comment
        var selectedRating = parseInt(selectedRatingString, 10); // convert the string value to a integer
        restaurant.ratings.push({ // send the new rating and comment to the listRestaurant array
            "stars":selectedRating,
            "comment":newComment,
        });
        $('#form-addComment').modal('hide') // hide the form modal after submit
        this.showRestaurantDetailsWhenClicked(restaurant); //refresh the detail page with the new rating
    
        $("#your-rating").val(""); // clear modal content after adding the new rating and comment
        $("#your-review").val("");
        this.sendListToHTML(listRestaurants);
    }
    
    filtListByOption(listRestaurants,sortListByMinStars,sortListByMaxStars) {
        var listResultAccordingOption = listRestaurants.filter((restaurant) => {
            var averageRating = this.calculateAverageRating(restaurant);
            if ((averageRating >= sortListByMinStars) && (averageRating <= sortListByMaxStars)){ // if the restaurant rating is above or equels to the chosen option
                return true;
            }
        })
        return listResultAccordingOption; // return the list which contains the restaurants which fit the option
    }
    

}

restaurantManager = new RestaurantManager();

function initMap() { // google maps init function called by the api script in the html file, with callback=initMap
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 48.8566969, lng: 2.3514616},
        zoom: 14
    });
    infoWindow = new google.maps.InfoWindow;
    newMap = new MyMap(map); // use the class to creat an objet to use

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
    $("#confirmAddingPlace").click(function() {
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
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
    $("#closeAddingPlace").click(function() { // close the infowindow of the button when click Fermer
        infowindow.close(); 
    });

    
    // // research the restaurant everytime screen center changes
    $("#searchAreaButton").click(function() {
        // var newCenter = map.getCenter();
        newMap.updateNearbyRestaurants(map.getCenter()); 
    });
    restaurantManager.sendListToHTML(listRestaurants); //show the list on the right of the screen when load
}

class MyMap { 
    constructor(map) {
        this.map = map;
        this.markers = []; // to replace var markers = [] in a class
    }
    
    addMarker(props) { // a method, it's a function in an objet
        // two ways to pass the this value to the nested function, solution 1 : add var self = this at the top of the function to keep a reference to this. Solution two, use ES6 way of writing function : () =>, functions written in this way will check and keep the same value of this for the nested function.

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
                    marker.infowindow.close(this.map, marker);
                });  //onclick on marker close infoWindow of other markers
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

    updateNearbyRestaurants(centerLocation) {
        var request = {
            location: centerLocation,
            radius: '500',
            type: ['restaurant']
        };
        listRestaurants = []; // clear the result list everytime the center changes to only show restaurant of the newest search
        var service = new google.maps.places.PlacesService(this.map);
        service.nearbySearch(request, this.nearbySearchCallback.bind(this)); // nearby search to get a list of restaurants with place id, using bind(this) to keep the this in the nearbySearchCallback, otherwise "this" is undefined.
    }

    nearbySearchCallback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            // console.log(results);
            for (var i = 0; i < results.length; i++) {
                // var detailplaceID = results[i].place_id;
                var request = {
                    placeId: results[i].place_id,
                    fields: ["formatted_address","reviews"]
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
                service.getDetails(request, this.detailSearchCallBack(integrateGoogleRestaurants)); //
                // newMap.addMarker(results[i]);
            }
        }
    }

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
                listRestaurants.unshift(integrateGoogleRestaurants); // push the list here because if leave it after line 157, the push will be executed before the function createCallBack finishs, end up with list being pushed to listRestaurant without the ratings and comments
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

$("#returnToList").click(function() {  // if leave here ? or in the RestaurantManager
    $("#box-showRestaurantDetails").hide();
    $("#list-wrap").show();
});

//filter restaurants by min and max stars
$("#sortMinStars").change(function() {
    for (var i = 1; i <= 5; i++) { // disable all the button in case of changing the min several times, avoid leaving max options little than tha min options
        $("#sortMaxStars option[value=" + i + "]").prop("disabled", true); 
    }

    sortListByMinStars  = parseInt($("#sortMinStars").val(), 10); // get the min chosen value and transform it to an interger

    for (var i = sortListByMinStars; i <= 5; i++) { // activate the min options according to the min option
        $("#sortMaxStars option[value=" + i + "]").prop("disabled", false); 
    }
    restaurantManager.sendListToHTML(restaurantManager.filtListByOption(listRestaurants,sortListByMinStars,sortListByMaxStars)); // sort the list first with the min option and default max value
});

$("#sortMaxStars").change(function() {
    sortListByMaxStars = parseInt($("#sortMaxStars").val(), 10);
    restaurantManager.sendListToHTML(restaurantManager.filtListByOption(listRestaurants,sortListByMinStars,sortListByMaxStars)); // sort the list with the chosen min and max options
});

// empty the value of select and textarea if user cancels adding new comment
$("#cancelAddingComment").click(function() {
    $("#your-rating").val("");
    $("#your-review").val("");
});
