$(document).ready(function() {

  mapboxgl.accessToken = "pk.eyJ1Ijoia3JpZWcyIiwiYSI6ImNqZ2RueHR5eDA3bmgzMmt0YWJpbmVhb28ifQ.Lh9cwp2VkDjPL638TArXuQ";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v10",
    center: [-75.789, 41.874],
    hash: false,
    zoom: 5
  });

  // var pubnub = new PubNub({
  //   subscribeKey: "mySubscribeKey",
  //   publishKey: "myPublishKey",
  //   ssl: true
  // });

  // pubnub.addListener({
  //   message: function(m) {
  //       // handle message
  //       var channelName = m.channel; // The channel for which the message belongs
  //       var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
  //       var pubTT = m.timetoken; // Publish timetoken
  //       var msg = m.message; // The Payload
  //   },
  //   presence: function(p) {
  //       // handle presence
  //       var action = p.action; // Can be join, leave, state-change or timeout
  //       var channelName = p.channel; // The channel for which the message belongs
  //       var occupancy = p.occupancy; // No. of users connected with the channel
  //       var state = p.state; // User State
  //       var channelGroup = p.subscription; //  The channel group or wildcard subscription match (if exists)
  //       var publishTime = p.timestamp; // Publish timetoken
  //       var timetoken = p.timetoken;  // Current timetoken
  //       var uuid = p.uuid; // UUIDs of users who are connected with the channel
  //   },
  //   status: function(s) {
  //       var affectedChannelGroups = s.affectedChannelGroups;
  //       var affectedChannels = s.affectedChannels;
  //       var category = s.category;
  //       var operation = s.operation;
  //   }
  // });

  // pubnub.subscribe({
  //   channels: ["my_channel"],
  // });

  var uRL = "";

  // Live data point example.
  //var droneLocation = "https://wanderdrone.appspot.com/";
  map.on("load", function () {
    // Insert the buildings layer beneath any symbol layer.
    var layers = map.getStyle().layers;

    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === "symbol" && layers[i].layout["text-field"]) {
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


      // map.addSource("drone", { type: "geojson", data: droneLocation });
      // map.addLayer({
      //     "id": "drone",
      //     "type": "symbol",
      //     "source": "drone",
      //     "layout": {
      //         "icon-image": "circle-15"
      //     }
      // });
      // window.setInterval(function() {
      //     map.getSource("drone").setData(droneLocation);
      // }, 2000);
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

  // Setup event handlers;
  map.on("draw.create", createArea);
  map.on("draw.delete", deleteArea);
  map.on("draw.update", updateArea);

  // Handle floor button clicks.
  $("#floorMenu").on("click", ".toggle-floor", function(event){

    //var dataNum = $(this).data("num");
    $("#floorMenu").find(".toggle-floor").removeClass("active-button");
    
    uRL = $(this).data("url");
    $(this).addClass("active-button");

  });

  function updateArea(e) {

    console.log("update");
    console.log(e);
    if(e.features.length > 0) {

      var id = e.features[0].id;
      var coords = e.features[0].geometry.coordinates[0];
      map.getSource("source_"+id).setCoordinates([coords[0], coords[1], coords[2], coords[3]]);
    }
  }

  function deleteArea(e) {

    console.log("delete");
    console.log(e);
    for(var i=0; i < e.features.length; i++){
      var id = e.features[i].id;
      map.removeLayer("layer_"+id);
      map.removeSource("source_"+id);
    }
  }

  function createArea(e) {

    console.log("create");
    console.log(e);
    if(e.features.length > 0) {

      var id = e.features[0].id;
      var coords = e.features[0].geometry.coordinates[0];
      map.addSource("source_"+id, {
        "type": "image",
        "url": uRL,
        "coordinates": [coords[0], coords[1], coords[2], coords[3]]
      });
      map.addLayer({
        "id": "layer_"+id,
        "type": "raster",
        "source": "source_"+id
      });        
    }
  }

});
