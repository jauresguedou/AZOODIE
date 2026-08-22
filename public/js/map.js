document.addEventListener("DOMContentLoaded", function() {

     const data = window.AZOODIE_SEARCH;
     if (!data) return;


     const map = L.map("map").setView([data.clientLat, data.clientLng], 13);

     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        
        attribution:"&copy; OpenStreetMap contributors"

     }).addTo(map);

     L.circleMarker( [data.clientLat, data.clientLng], {
        radius: 10,
        fillColor: "#E8853B",
        color: "#fff",
        weight: 2,
        fillOpacity: 1

     }).addTo(map).bindPopup("Vous êtes ici");

     data.professionals.forEach(function (pro) {
        L.circleMarker([pro.base_lat, pro.base_lng], {
           radius: 9,
           fillColor: "#0F6E6E",
           color: "#fff",
           weight: 2,
           fillOpacity: 1
        }).addTo(map).bindPopup(pro.name + "_" + pro.trade_category + "(" + pro.distance_km.toFixed(1) + " km)");
     });

     const nearest = data.professionals[0];
     if (nearest) {
       fetch(`/api/route?originLat=${data.clientLat}&originLng=${data.clientLng}&destLat=${nearest.base_lat}&destLng=${nearest.base_lng}`)
        .then(response => response.json())
        .then(routeData => {
           if (routeData.geometry) {
               L.geoJSON(routeData.geometry, {
                    style: { color: "#0F6E6E", weight: 4}
               }).addTo(map);

               const minutes = Math.round(routeData.duration_s / 60);
               L.popup()
                    .setLatLng([nearest.base_lat, nearest.base_lng])
                    .setContent(`Trajet réel: ${minutes} min`)
                    .openOn(map);
           }
        })
        .catch(err => console.error("Route fetch failed:", err));
     }
     
     document.getElementById("btn-list").addEventListener("click", function() {
        document.getElementById("list-view").style.display = "block";
        document.getElementById("map-view").style.display = "none";
        this.classList.add("active");
        document.getElementById("btn-map").classList.remove("active");
     });

     document.getElementById("btn-map").addEventListener("click", function() {
        document.getElementById("list-view").style.display = "none";
        document.getElementById("map-view").style.display = "block";
        this.classList.add("active");
        document.getElementById("btn-list").classList.remove("active");
        map.invalidateSize();
     });







});