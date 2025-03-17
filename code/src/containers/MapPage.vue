<template>
  <div class="map-page">
    <div id="map" />
    <div class="info-wrapper">
      <div class="total-info">
        <span class="num">{{ poi_count ?? "--" }}</span>
        {{ selectedList.includes("Jobs") ? " total workforce" : " total pois" }}
      </div>
      <div class="slider-block">
        <span class="demonstration">Max Travel Time in Min (By Walking)</span>
        <el-slider v-model="time" :min="10" :max="60" />
      </div>
      <div class="checkbox-block">
        <div>POI Types</div>
        <el-checkbox-group v-model="selectedList">
          <el-checkbox
            v-for="item in POIOptions"
            :label="item.name"
            size="large"
            :key="item"
          />
        </el-checkbox-group>
      </div>
      <div class="apply-btn">
        <el-button type="primary" @click="apply">Apply</el-button>
        <el-button type="primary" @click="addGeojson">add Geojson</el-button>
      </div>
    </div>
    <div class="input-block">
      Search Key:
      <el-input
        v-model="inputValue"
        style="width: 240px"
        placeholder="Please input"
      />
      <el-button type="primary" @click="handSend">Send</el-button>
    </div>
  </div>
</template>
<script>
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { fromLonLat, toLonLat } from "ol/proj";
import geojson from "../tool/data.json";

import "ol/ol.css";

export default {
  name: "mapContainer",
  data() {
    return {
      time: 1,
      selectedList: [],
      POIOptions: [
        {
          name: "Bank",
          value: "ny_bank",
        },
        {
          name: "Food",
          value: "ny_food",
        },
        {
          name: "Grocery",
          value: "ny_glocery",
        },
        {
          name: "Pharmacy",
          value: "ny_pharmacy",
        },
        {
          name: "Police",
          value: "ny_police",
        },
        {
          name: "Postal",
          value: "ny_postal",
        },
        {
          name: "Jobs",
          value: "ny_jobs",
        },
      ],
      circleCenterCoordinate: [],
      poi_count: null,
      inputValue: "",
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          new VectorLayer({
            source: new VectorSource(),
          }),
        ],
        view: new View({
          center: fromLonLat([-74.006, 40.7128]),
          zoom: 12,
        }),
      });
      this.map.on("click", (event) => {
        this.map.removeLayer(this.clickPointLayer);
        const coordinate = toLonLat(event.coordinate);
        this.circleCenterCoordinate = coordinate;
        const pointFeatures = this.getPointFeatures([[5, coordinate]], "red");
        const vectorSource = new VectorSource({
          features: pointFeatures,
        });
        this.clickPointLayer = new VectorLayer({
          source: vectorSource,
        });
        this.map.addLayer(this.clickPointLayer);
      });
    },
    addGeojson() {
      const { isochrone, pois } = geojson;
      if (this.pointLayer) {
        this.map.removeLayer(this.pointLayer);
      }
      if (this.polygonLayer) {
        this.map.removeLayer(this.polygonLayer);
      }

      if (pois.length) {
        this.addPoint(
          pois.map((s) => [5, s.coordinates]),
          "green"
        );
      }
      if (isochrone.coordinates) {
        this.addPolygon(isochrone.coordinates);
      }
    },
    async apply() {
      if (!this.circleCenterCoordinate.length) {
        this.$message.error("Please select a location on the map first.");
        return;
      }

      if (!this.selectedList.length) {
        this.$message.error("Please select at least one POI type.");
        return;
      }

      const selectedPOIs = this.POIOptions.filter((s) =>
        this.selectedList.includes(s.name)
      ).map((l) => l.value);
      const [lng, lat] = this.circleCenterCoordinate;
      fetch("http://192.168.31.138:3001/api/isochrone", {
      //fetch("http://createserver.ostiumaxioma.net:3001/api/isochrone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          center: { lng, lat },
          time: this.time,
          selectedPOIs,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Response:", data);
          const { isochrone, pois, poi_count } = data;
          this.poi_count = poi_count;

          if (this.pointLayer) {
            this.map.removeLayer(this.pointLayer);
          }
          if (this.polygonLayer) {
            this.map.removeLayer(this.polygonLayer);
          }

          if (pois?.length) {
            this.addPoint(
              pois.map((s) => [s.properties.c000, s.coordinates]),
              "green"
            );
          }
          if (isochrone?.coordinates) {
            this.addPolygon(isochrone.coordinates);
          }
          return data;
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
    addPoint(coords, color = "red") {
      const pointFeatures = this.getPointFeatures(coords, color);
      const vectorSource = new VectorSource({
        features: pointFeatures,
      });
      this.pointLayer = new VectorLayer({
        source: vectorSource,
      });
      this.map.addLayer(this.pointLayer);
    },
    getPointFeatures(points, color) {
      const pointFeatures = points.map(([radius, coord]) => {
        const pointFeature = new Feature({
          geometry: new Point(fromLonLat(coord)),
        });
        const pointStyle = new Style({
          image: new CircleStyle({
            radius: Math.max(5, Math.log(radius) * 1.5),
            fill: new Fill({ color }),
            stroke: new Stroke({ color: "white", width: 1 }),
          }),
        });
        pointFeature.setStyle(pointStyle);
        return pointFeature;
      });
      return pointFeatures;
    },
    addPolygon(isochrone) {
      const transformedCoords = isochrone.map((ring) =>
        ring.map((point) => fromLonLat(point))
      );
      const polygonFeature = new Feature({
        geometry: new Polygon(transformedCoords),
      });
      const polygonStyle = new Style({
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.3)",
        }),
        stroke: new Stroke({
          color: "red",
          width: 2,
        }),
      });
      polygonFeature.setStyle(polygonStyle);
      const vectorSource = new VectorSource({
        features: [polygonFeature],
      });
      this.polygonLayer = new VectorLayer({
        source: vectorSource,
      });
      this.map.addLayer(this.polygonLayer);
    },
    handSend() {
      fetch("url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchValue: this.inputValue,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("data", data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
  },
};
</script>
<style lang="less">
.map-page {
  width: 100%;
  height: 100%;
  #map {
    width: 100%;
    height: 100%;
    .ol-zoom {
      left: unset !important;
      right: 10px !important;
      top: 3% !important;
    }
  }
  .info-wrapper {
    position: absolute;
    top: 50px;
    left: 50px;
    width: 300px;
    padding: 15px 15px 30px 15px;
    border-radius: 5px;
    background: #fff;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.4);
    .total-info {
      .num {
        font-size: 20px;
        font-weight: 800;
      }
    }
    .slider-block {
      margin-top: 20px;
      .el-slider {
        width: 95%;
        margin-left: 10px;
      }
    }
    .checkbox-block {
      margin-top: 20px;
      .el-checkbox-group {
        display: flex;
        flex-direction: column;
        .el-checkbox {
          height: 32px;
        }
      }
    }
    .apply-btn {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
  }
  .input-block {
    position: absolute;
    right: 10px;
    bottom: 30px;
    display: flex;
    align-items: center;
    .el-input {
      margin-left: 6px;
      margin-right: 6px;
    }
  }
}
</style>