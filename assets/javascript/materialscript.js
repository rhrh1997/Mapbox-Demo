$(document).ready(function() {

  $("#menuBtn").on("click", function(event){
    event.preventDefault();
    var drawer = new mdc.drawer.MDCPersistentDrawer($("#asideMenu")[0]);
    drawer.open = !drawer.open;
  });
 
 });
