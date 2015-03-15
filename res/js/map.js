/*
 Geocoding
 ----------------------*/
var map;
var layerGroup;
var markers;
var fetchedAddresses = new Object();
var currentArticle = undefined;

var initializeMap = function() {

  map = L.map('map').setView([13.4061, 52.5192], 1);
  L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
      attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
      maxZoom: 8,
      }).addTo(map);

  markers = new L.MarkerClusterGroup({showCoverageOnHover: false});
  map.addLayer(markers);
  map.scrollWheelZoom.disable();

}

var codeAddressFromArticle = function(context,article,last) {

  console.log(article["about"]["address"]);

  if (!article["about"]["address"]) return;

  var addressToGeocode = article["about"]["address"]["addressCountry"]+'_'+article["about"]["address"]["addressLocality"];

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

    var finalGeocodeApiURL =  window.plp.config.geocoderCacherUrl+"?location="+addressToGeocode;
    superagent.get(finalGeocodeApiURL)
    .withCredentials()
    .set('Accept', 'text/plain')
    .end(function(err,res){

      if (err){
        console.log(err);
      }else if(res.status != 400){
        fetchedAddresses[addressToGeocode] = res.text;
        var latLng = fetchedAddresses[addressToGeocode].split(",");
        var marker = new L.marker(new L.latLng(latLng[0],latLng[1]),{icon: imgIcon});
        setupMarkerWithArticle(context,marker,article,last);
      }

    });

  }else{
    var latLng = fetchedAddresses[addressToGeocode].split(",");
    var marker = new L.marker(new L.latLng(latLng[0],latLng[1]),{icon: imgIcon});
    setupMarkerWithArticle(context,marker,article,last);
  }

}

// Moves the centre of the map to the position of an article
var panMapToArticle = function(context,article){

  if (!article["about"]["address"]) return;

  var addressToGeocode = article["about"]["address"]["addressCountry"]+', '+article["about"]["address"]["city"];
  if (!fetchedAddresses[addressToGeocode]){

    var finalGeocodeApiURL =  window.plp.config.geocoderCacherUrl+"?location="+addressToGeocode;
    superagent.get(finalGeocodeApiURL)
    .withCredentials()
    .set('Accept', 'text/plain')
    .end(function(err,res){

      if (err){
        console.log(err);
      }else if(res.status != 400){
        fetchedAddresses[addressToGeocode] = res.text;
        var latLng = fetchedAddresses[addressToGeocode].split(",");
        map.panTo(new L.latLng(latLng[0],latLng[1]));
      }

    });

  }else{
    var latLng = fetchedAddresses[addressToGeocode].split(",");
    map.panTo(new L.latLng(latLng[0],latLng[1]));
  }

}

var setupMarkerWithArticle = function(context,marker,article,last){

   marker.on('click', function (a) {
    currentArticle = article;
    nd._showArticleDetails(currentArticle);
   });

   markers.addLayer(marker);
   if (last){
     mapFitBounds();
   }

}

var mapFitBounds = function(){
  map.fitBounds(markers.getBounds(),{padding: [50,50]});
}

var clearLayers = function(){
  markers.clearLayers();
};
