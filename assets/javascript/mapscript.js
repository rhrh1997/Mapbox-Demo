$(document).ready(function() {

  mapboxgl.accessToken = "pk.eyJ1Ijoia3JpZWcyIiwiYSI6ImNqZ2RueHR5eDA3bmgzMmt0YWJpbmVhb28ifQ.Lh9cwp2VkDjPL638TArXuQ";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v10",
    center: [-97.738359, 30.284129],
    hash: false,
    zoom: 16
  });

  var pubnub = new PubNub({
    subscribeKey: "sub-c-595cd95a-3a2e-11e8-a2e8-d2288b7dcaaf",
    publishKey: "pub-c-43aafac6-8e76-4451-9fd1-2f47cfb8fe36",
    ssl: true
  });

  var globalLayers = {};
  var globalSources = {};
  var monitorTags = {};
  var pubnubChannels = ["demo_channel"];
  var uRL = "";
  var floorNum = 0;

  pubnub.addListener({
    message: function(m) {
        // handle message
        var channelName = m.channel; // The channel for which the message belongs
        var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
        var pubTT = m.timetoken; // Publish timetoken
        var msg = m.message; // The Payload

        if(msg.id){
          var id = parseInt(msg.id);
          if(msg.x && msg.y && monitorTags[id]){
            updateTagSource(id, [msg.x.toFixed(6), msg.y.toFixed(6)])
          }
        }
    },
    presence: function(p) {
        // handle presence
        var action = p.action; // Can be join, leave, state-change or timeout
        var channelName = p.channel; // The channel for which the message belongs
        var occupancy = p.occupancy; // No. of users connected with the channel
        var state = p.state; // User State
        var channelGroup = p.subscription; //  The channel group or wildcard subscription match (if exists)
        var publishTime = p.timestamp; // Publish timetoken
        var timetoken = p.timetoken;  // Current timetoken
        var uuid = p.uuid; // UUIDs of users who are connected with the channel
    },
    status: function(s) {
        var affectedChannelGroups = s.affectedChannelGroups;
        var affectedChannels = s.affectedChannels;
        var category = s.category;
        var operation = s.operation;
    }
  });

  map.on("load", function (){

    // Add 3d buildings layer.
    //add3dBuildings();
  });

  map.on("styledata", function (){

    // Add back custom layers.
    restoreGlobalMap();
  });

  // Add draw controls to the map.
  var draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        trash: true
    }
  });
  map.addControl(draw, "bottom-left");

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

  // Setup polygon tool event handlers;
  map.on("draw.create", createArea);
  map.on("draw.delete", deleteArea);
  map.on("draw.update", updateArea);

  // Center the map on the coordinates of a clicked symbol.
  map.on("click", "symbols", function(e){
    map.panTo({center: e.features[0].geometry.coordinates});
  })
  // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
  map.on("mouseenter", "symbols", function(){
      map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on("mouseleave", "symbols", function(){
      map.getCanvas().style.cursor = '';
  });

  function updateArea(e){

    if(e.features.length > 0) {

      //var id = e.features[0].id;
      var coords = e.features[0].geometry.coordinates[0];
      map.getSource("polygon-source_"+floorNum)
      .setCoordinates([coords[0], coords[1], coords[2], coords[3]]);
    }
  }

  function deleteArea(e){

    //for(var i=0; i < e.features.length; i++){
      //var id = e.features[i].id;
      map.removeLayer("polygon-layer_"+floorNum);
      map.removeSource("polygon-source_"+floorNum);
    //}
  }

  function createArea(e){

    if(e.features.length > 0) {

      //var id = e.features[0].id;
      var coords = e.features[0].geometry.coordinates[0];

      if(map.getSource("polygon-source_"+floorNum) === undefined){
        map.addSource("polygon-source_"+floorNum, {
          "type": "image",
          "url": uRL,
          "coordinates": [coords[0], coords[1], coords[2], coords[3]]
        });
      }

      if(map.getLayer("polygon-layer_"+floorNum) === undefined){
        // Insert the polygon layer beneath any tag layer.
        var layers = map.getStyle().layers;

        var labelLayerId;
        for(var i=0; i < layers.length; i++){
            if(layers[i].type === "symbol" &&
               layers[i].id.slice(0, 10) === "tag-layer_"){

                labelLayerId = layers[i].id;
                break;
            }
        }

        map.addLayer({
          "id": "polygon-layer_"+floorNum,
          "type": "raster",
          "source": "polygon-source_"+floorNum
        }, labelLayerId);
      }
    }
  }

  // We must store the layers and sources in case style is changed.
  // (Style changes erase all layers and sources.)
  function storeGlobalMap(){

      var mapStyle = map.getStyle();
      //console.log(mapStyle);
      globalLayers = mapStyle.layers.filter(function(item){
        return (item.id.slice(0, 14) === "polygon-layer_" ||
                item.id.slice(0, 10) === "tag-layer_" ||
                item.id === "3d-buildings");
      });

      var temp = {};
      Object.keys(mapStyle.sources).forEach(function(key){
        if(key.slice(0, 15) === "polygon-source_" ||
           key.slice(0, 11) === "tag-source_"){

          temp[key] = mapStyle.sources[key];
        }
      });
      globalSources = temp;
  }

  function restoreGlobalMap(){

    Object.keys(globalSources).forEach(function(key){
      map.addSource(key, globalSources[key]);
    });
    for(var i = 0; i < globalLayers.length; i++){
      map.addLayer(globalLayers[i]);
    }
  }

  // Materialize init.
  $(".dropdown-trigger").dropdown();
  $("select").formSelect();

  // jQuery event handlers.
  $("#toggleMenu").on("click", function(event){
    event.preventDefault();
    $("#menu").slideToggle();
  });

  $("#left-sidebar-nav").on("click", "li", function(event){
    event.preventDefault();
    $("#left-sidebar-nav > ul > li").removeClass("active-item");
    $(this).addClass("active-item");
  });

  $("#outdoorMaps").on("click", function(event){
    var enabled = $(this).prop("checked");
    storeGlobalMap();
    if(enabled){
      map.setStyle("mapbox://styles/mapbox/outdoors-v10");
    } else{
      map.setStyle("mapbox://styles/mapbox/streets-v10");
    }
  });

  $("#liveUpdates").on("click", function(event){
    var enabled = $(this).prop("checked");
    if(enabled){
      pubnub.subscribe({
        channels: pubnubChannels
      });
    } else{
      pubnub.unsubscribe({
        channels: pubnubChannels
      });
    }
  });

  // Handle floor button clicks.
  $("#floorMenu").on("click", ".toggle-floor", function(event){

    var dataNum = $(this).data("num");
    $("#floorMenu").find(".toggle-floor").removeClass("active-button");
    
    uRL = $(this).data("url");
    floorNum = $(this).data("num");
    $(this).addClass("active-button");

    var floorsArr = $("#floorMenu").find(".toggle-floor");

    for(var i=0; i < floorsArr.length; i++){
      var otherNum = $(floorsArr[i]).data("num");

      if(otherNum !== dataNum){
        if(map.getLayer("polygon-layer_"+otherNum) !== undefined){
          map.setLayoutProperty("polygon-layer_"+otherNum, "visibility", "none");
        }
      } else if(otherNum === dataNum){
        if(map.getLayer("polygon-layer_"+dataNum)){
          map.setLayoutProperty("polygon-layer_"+dataNum, "visibility", "visible");
        }
      }
    }
  });

  $("#displayedTags").on("change", function(event){

    var val = $(this).val().toString();

    if(val.length > 0){
      var tagsArr = val.split(",");
      for(var i=0; i < tagsArr.length; i++){
        if(monitorTags[tagsArr[i]] === undefined){
          monitorTags[tagsArr[i]] = {};
          addTagSource(tagsArr[i]);
        }
      }
      Object.keys(monitorTags).forEach(function(key){
        if(tagsArr.indexOf(key) < 0){
          monitorTags[key] = undefined;
          removeTagSource(key);
        }
      });
    } else{
      monitorTags = {};
    }
  });

  function addTagSource(num){

    var geoJson = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [0, 0]
        },
        "properties": {
          "title": "Tag "+num
        }
    };
    map.addSource("tag-source_"+num, { type: "geojson", data: geoJson });
    map.addLayer({
        "id": "tag-layer_"+num,
        "type": "circle",
        "source": "tag-source_"+num,
        "paint": {
          "circle-radius": 8,
          "circle-color": {
            "property": "title",
            "type": "categorical",
            "stops": [
                ["Tag 1", "#fbb03b"],
                ["Tag 2", "#223b53"],
                ["Tag 3", "#e55e5e"],
                ["Tag 4", "#59d132"],
                ["Tag 5", "#9132d1"]
            ]
          }
        }
    });
  }

  function updateTagSource(num, coords){

    var geoJson = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [coords[0], coords[1]]
        },
        "properties": {
          "title": "Tag "+num
        }
    };
    if(map.getSource("tag-source_"+num)){
      map.getSource("tag-source_"+num).setData(geoJson);
    }
  }

  function removeTagSource(num){

    if(map.getLayer("tag-layer_"+num)){
      map.removeLayer("tag-layer_"+num);
    }
    if(map.getSource("tag-source_"+num)){
      map.removeSource("tag-source_"+num);    
    }
  }

  function add3dBuildings(){

    // Insert the buildings layer beneath any symbol layer.
    var layers = map.getStyle().layers;

    var labelLayerId;
    for(var i=0; i < layers.length; i++){
        if(layers[i].type === "symbol" && layers[i].layout["text-field"]){
            labelLayerId = layers[i].id;
            break;
        }
    }

    map.addLayer({
        "id": "3d-buildings",
        "source": "composite",
        "source-layer": "building",
        "filter": ["==", "extrude", "true"],
        "type": "fill-extrusion",
        "minzoom": 15,
        "paint": {
            "fill-extrusion-color": "#aaa",

            // use an "interpolate" expression to add a smooth transition effect to the
            // buildings as the user zooms in
            "fill-extrusion-height": [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            "fill-extrusion-base": [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            "fill-extrusion-opacity": .6
        }
    }, labelLayerId);
  }

});
