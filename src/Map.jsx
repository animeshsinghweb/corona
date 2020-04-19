import React from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";

import "./map.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoidmlnaG5lc2hkZWVwMjAiLCJhIjoiY2s4ajU3OTR5MDJzNDNocjd0eG9vcG02MCJ9.fpfraPMqhDGWgskVdTn2oQ";

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lng: 85,
      lat: 23,
      zoom: 3,
    };
  }

  componentDidMount() {
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      // style: "mapbox://styles/mapbox/streets-v11",
      style: "mapbox://styles/mapbox/dark-v10",
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom,
    });

    map.on("move", () => {
      this.setState({
        lng: map.getCenter().lng.toFixed(4),
        lat: map.getCenter().lat.toFixed(4),
        zoom: map.getZoom().toFixed(2),
      });
    });

    map.on("load", async () => {
      const res = await axios.get("https://corona.lmao.ninja/v2/countries");
      // const geojson = res.data;

      const { data = [] } = res;

      const geojson = {
        type: "FeatureCollection",
        features: data.map((country = {}) => {
          const { countryInfo = {} } = country;
          const { lat, long: lng } = countryInfo;
          return {
            type: "Feature",
            properties: {
              ...country,
            },
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          };
        }),
      };

      let totalDeath = 0,
        totalConfirmed = 0;

      data.forEach((country) => {
        totalDeath += country.deaths;
        totalConfirmed += country.cases;
      });

      // add markers to map
      geojson.features.forEach(function (marker) {
        const { properties = {} } = marker;
        let updatedFormatted;
        let casesString;

        const {
          country,
          updated,
          cases,
          deaths,
          recovered,
          todayCases,
          todayDeaths,
        } = properties;

        casesString = `${cases}`;

        if (cases > 1000) {
          casesString = `${casesString.slice(0, -3)}k+`;
        }

        if (updated) {
          updatedFormatted = new Date(updated).toLocaleString();
        }

        let casesToday = "",
          deathsToday = "";

        if (deaths > 0) deathsToday = `, <em>${todayDeaths} today</em>`;
        if (cases > 0) casesToday = `, <em>${todayCases} today</em>`;

        let deathsPercent = ((deaths / totalDeath) * 100).toFixed(2);
        let confirmedPercent = ((cases / totalConfirmed) * 100).toFixed(2);
        let recoveredPercent = ((recovered / cases) * 100).toFixed(1);

        // create a HTML element for each feature
        var el = document.createElement("div");
        el.className = "marker";

        // Comment Line below to show default marker's image
        //  instead of country's flag
        el.style = `background-image: url(${properties.countryInfo.flag})`;

        // make a marker for each feature and add to the map
        const markele = new mapboxgl.Marker(el)
          .setLngLat(marker.geometry.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(
                `
                  <span class="icon-marker-tooltip">
                    <h2>${country}</h2>
                    <p>accounts for <strong>${confirmedPercent}% cases</strong> of the world and <strong>${deathsPercent}% deaths</strong> of the world</p>
                    <ul>
                      <li><strong>Confirmed:</strong> ${casesString}${casesToday}</li>
                      <li><strong>Deaths:</strong> ${deaths}${deathsToday}</li>
                      <li><strong>Recovered:</strong> ${recovered} <strong>(${recoveredPercent}%)</strong></li>
                      <li><strong>Last Update:</strong> ${updatedFormatted}</li>
                    </ul>
                  </span>
                `,
              ),
          )
          .addTo(map);

        // show markers on mouse overs
        el.addEventListener("mouseenter", () => markele.togglePopup());
        el.addEventListener("mouseleave", () => markele.togglePopup());
      });
    });
  }

  render() {
    return (
      <div>
        {/* <div className="sidebarStyle">
          <div>
            Longitude: {this.state.lng} | Latitude: {this.state.lat} | Zoom:{" "}
            {this.state.zoom}
          </div>
        </div> */}
        <div ref={(el) => (this.mapContainer = el)} className="mapContainer" />
      </div>
    );
  }
}

export default Map;
