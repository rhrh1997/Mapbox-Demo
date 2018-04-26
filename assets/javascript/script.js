
$(document).ready(function() {

  mapboxgl.accessToken = "pk.eyJ1Ijoia3JpZWcyIiwiYSI6ImNqZ2RueHR5eDA3bmgzMmt0YWJpbmVhb28ifQ.Lh9cwp2VkDjPL638TArXuQ";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v10",
    center: [-75.789, 41.874],
    hash: false,
    zoom: 5
  });

  var layerCount = 0;

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

  $("#menu").on("click", ".toggle-floor", function(event){

    var dataNum = $(this).data("num");
    var uRL = $(this).data("url");
    if(map.getLayer("overlay_"+dataNum)){
      map.removeLayer("overlay_"+dataNum);
    } else{
      map.addLayer({
      "id": "overlay_"+dataNum,
      "type": "raster",
      "source": {
        "type": "image",
        "url": uRL,
        "coordinates": [
              [-80.425, 46.437],
              [-71.516, 46.437],
              [-71.516, 37.936],
              [-80.425, 37.936]
          ]
        }
      });
    }

  });
});
