"use strict";
var sortListByMinStars = '';
var sortListByMaxStars = 5;
var showExampleRestaurants = false;
$("#box-showRestaurantDetails").hide(); 
$("#addNewPlace").hide(); 

if (showExampleRestaurants === false) {
    listRestaurants = [];
}

var map, infoWindow, newMap, restaurantManager;

$("#returnToList").click(function() {
    $("#box-showRestaurantDetails").hide();
    $("#list-wrap").show();
});

//filter restaurants by min and max stars
$("#sortMinStars").change(function() {
    for (var i = 1; i <= 5; i++) { // disable all the button in case of changing the min several times, avoid leaving max options smaller than tha min options
        $("#sortMaxStars option[value=" + i + "]").prop("disabled", true); 
    }

    sortListByMinStars  = parseInt($("#sortMinStars").val(), 10); // get the min chosen value and transform it to an interger

    for (var i = sortListByMinStars; i <= 5; i++) { // activate the max options according to the min option
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
