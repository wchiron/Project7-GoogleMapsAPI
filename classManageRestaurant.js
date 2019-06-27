class RestaurantManager { // managing restaurant content related functions
    constructor() { // things to reuse, 
        this.totalStar = 5; // to use when calculate average rating
    }

    calculateAverageRating(restaurant) {
        var totalRating = 0;
        var averageRating = 0;
    
        restaurant.ratings.forEach(function(ratings) {
            totalRating += ratings.stars;
        });
    
        if (restaurant.ratings.length === 0) {
            averageRating = 0; // put the rating to 0 in case the restaurant currently has no rating to avoid showing NaN
        } else {
            averageRating = totalRating/restaurant.ratings.length; // get the average rating
        }
       
        var roundedAverageRating = Math.round(averageRating * 10) / 10; // round the average rating to 1 decimal
        return roundedAverageRating;
    }

    sendListToHTML(restaurants) {
        $(".listRestaurant").remove(); // not emptying the list-wrap to keep the sort option
        newMap.clearMarkers(); // clear all the markers before updating the markers to avoid adding multiple for one location, since sendListToHTML is called multiple times
        restaurants.forEach((restaurant) => { //using forEach instead of a for loop to have a distinct closure for every iteration, meaning get the right i every time. Use => instead of function to be able to pass the "this" value, since calculateAverageRating function is called inside this function.
            var averRatingToShow = this.calculateAverageRating(restaurant);  // could use this. here thanks to the => in line 36
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
           
            newMap.addMarker(restaurant);  // add marker for each restaurant
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
            return false; //submit button by default will refresh the page, add return false for not refresh the page and erase everything
        });
    }

    commentToShow(restaurant) {
        var commentToShow = "";
        restaurant.ratings.forEach(function(ratings) {
            commentToShow += "<p>Avis : " + ratings.comment + "</br></p>"; 
        })
        return commentToShow;
    }

    // get the form input value and update the restaurant rating after submit
    addNewRatingAndComment(restaurant) {
        var selectedRatingString = $("#your-rating").val(); // get the selected value
        var newComment = $("#your-review").val(); // get the inputed comment
        var selectedRating = parseInt(selectedRatingString, 10); // convert the string value to an integer
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