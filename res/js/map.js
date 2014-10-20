
/*
 Geocoding
 ----------------------*/

var map;
var layerGroup;
var markers;
var fetchedAddresses = new Object();
var mapQuestApiKey = window.plp.config.mapQuestApiKey; // Open Steps APIKey, change please
var geocodeApiURL="http://www.mapquestapi.com/geocoding/v1/address?key="+mapQuestApiKey+"&country=#country#&city=#city#&postalCode=#postalCode#&street=#street#";
var currentArticle = undefined;

var initializeMap = function() {

  // Init Map
  map = L.map('map').setView([13.4061, 52.5192], 1);
        mapLink =
            '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; ' + mapLink,
            maxZoom: 8,
            }).addTo(map);

  markers = new L.MarkerClusterGroup({showCoverageOnHover: false});

  map.addLayer(markers);

  // Disable wheel zoom
  map.scrollWheelZoom.disable();

}

// Calls the geocoding webservice for an article and adds the marker on the map when found. If it is the last one, set the map bounds so all markers are visible.
var codeAddressFromArticle = function(context,article,last) {

  if (!article["about"]["address"][0]) return;

	var addressToGeocode = article["about"]["address"][0]["country"]+', '+article["about"]["address"][0]["city"]+', '+article["about"]["address"][0]["code"]+', '+article["about"]["address"][0]["street"];

	// Setup marker icon
	var imgIcon = L.icon({
	    iconUrl: 'res/img/dot.png',
	    //shadowUrl: 'res/img/avatar_bg.png',

	    iconSize:     [16, 16], // size of the icon
	    //shadowSize:   [34, 34], // size of the shadow
	    iconAnchor:   [8,8], // point of the icon which will correspond to marker's location
	    //shadowAnchor: [1,1],  // the same for the shadow
	    popupAnchor:  [16,0] // point from which the popup should open relative to the iconAnchor
	});

	// If the address was not already fetched, do it
	if (!fetchedAddresses[addressToGeocode]){

		// replace placeholders in the url
		var finalGeocodeApiURL = geocodeApiURL.replace('#city#',article["about"]["address"][0]["city"]);
		finalGeocodeApiURL = finalGeocodeApiURL.replace('#country#',article["about"]["address"][0]["country"]);
    finalGeocodeApiURL = finalGeocodeApiURL.replace('#postalCode#',article["about"]["address"][0]["code"]);
    finalGeocodeApiURL = finalGeocodeApiURL.replace('#street#',article["about"]["address"][0]["street"]);

		//console.log("Fetching address on: "+finalGeocodeApiURL);

		$.getJSON( finalGeocodeApiURL, function( data ) {

			if (data.info.statuscode == 0 && data.results[0].locations[0]) {

				// Store fetched address
				fetchedAddresses[addressToGeocode] = data.results[0].locations[0].latLng.lat+","+data.results[0].locations[0].latLng.lng;

				// Add marker
				var marker = new L.marker(new L.latLng(data.results[0].locations[0].latLng.lat,data.results[0].locations[0].latLng.lng),{icon: imgIcon});
				setupMarkerWithArticle(context,marker,article,last);
			}

		});

	}else{

		// Extract coordinates from map
		var latLng = fetchedAddresses[addressToGeocode].split(",");
		var marker = new L.marker(new L.latLng(latLng[0],latLng[1]),{icon: imgIcon});
		setupMarkerWithArticle(context,marker,article,last);

	}

}

// Moves the centre of the map to the position of an article
var panMapToArticle = function(context,article){

  if (!article["about"]["address"][0]) return;

	var addressToGeocode = article["about"]["address"][0]["country"]+', '+article["about"]["address"][0]["city"]+', '+article["about"]["address"][0]["code"]+', '+article["about"]["address"][0]["street"];

	// If the address was not already fetched, do it
	if (!fetchedAddresses[addressToGeocode]){

		// replace placeholders in the url
    var finalGeocodeApiURL = geocodeApiURL.replace('#city#',article["about"]["address"][0]["city"]);
    finalGeocodeApiURL = finalGeocodeApiURL.replace('#country#',article["about"]["address"][0]["country"]);
    finalGeocodeApiURL = finalGeocodeApiURL.replace('#postalCode#',article["about"]["address"][0]["code"]);
    finalGeocodeApiURL = finalGeocodeApiURL.replace('#street#',article["about"]["address"][0]["street"]);

		//console.log("Fetching address on: "+finalGeocodeApiURL);

		$.getJSON( finalGeocodeApiURL, function( data ) {

			if (data.info.statuscode == 0 && data.results[0].locations[0]) {

				// Store fetched address
				fetchedAddresses[addressToGeocode] = data.results[0].locations[0].latLng.lat+","+data.results[0].locations[0].latLng.lng;

				map.panTo(new L.latLng(data.results[0].locations[0].latLng.lat,data.results[0].locations[0].latLng.lng));
				//map.setZoom(6);
			}

		});

	}else{

		// Extract coordinates from map
		var latLng = fetchedAddresses[addressToGeocode].split(",");

		map.panTo(new L.latLng(latLng[0],latLng[1]));
		//map.setZoom(6);

	}

}

// Utility method to bind the popup of the marker and add it to the layer.
var setupMarkerWithArticle = function(context,marker,article,last){

 	marker.on('click', function (a) {

    currentArticle = article;
    nd._showArticleDetails(currentArticle);

 	});

 	marker.on('mouseout', function (a) {

    	//$('#details').html("<img src=\"res/img/avatar_placeholder.png\"/>");

 	});

 	markers.addLayer(marker);

 	if (last){
 		mapFitBounds();
 	}

}

var mapFitBounds = function(){

	map.fitBounds(markers.getBounds(),{padding: [50,50]});

}

/*--------------------
  HELPERS
--------------------*/

var clearLayers = function(){

  //layerGroup.clearLayers();
  markers.clearLayers();

};
