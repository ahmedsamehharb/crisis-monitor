import dotenv from 'dotenv';

dotenv.config();

/** Tunable hybrid clustering parameters — see docs/CLUSTERING.md */
export const clusteringConfig = {
  /** Merge into existing event when similarity >= this; otherwise create a new event */
  mergeThreshold: Number(process.env.CLUSTER_MERGE_THRESHOLD) || 0.7,

  /** Weight for geographic component in final similarity */
  weightGeo: Number(process.env.CLUSTER_WEIGHT_GEO) || 0.35,

  /** Weight for temporal component */
  weightTime: Number(process.env.CLUSTER_WEIGHT_TIME) || 0.3,

  /** Weight for event-type component */
  weightType: Number(process.env.CLUSTER_WEIGHT_TYPE) || 0.25,

  /** Weight for text/keyword overlap component */
  weightText: Number(process.env.CLUSTER_WEIGHT_TEXT) || 0.1,

  /** Max hours between signals per event type (defaults in event-type-clusters.ts) */
  maxWindowHours: {
    fire: Number(process.env.CLUSTER_WINDOW_FIRE_HOURS) || 12,
    wildfire: Number(process.env.CLUSTER_WINDOW_WILDFIRE_HOURS) || 12,
    flood: Number(process.env.CLUSTER_WINDOW_FLOOD_HOURS) || 48,
    flood_risk: Number(process.env.CLUSTER_WINDOW_FLOOD_RISK_HOURS) || 48,
    storm: Number(process.env.CLUSTER_WINDOW_STORM_HOURS) || 24,
    thunderstorm: Number(process.env.CLUSTER_WINDOW_THUNDERSTORM_HOURS) || 24,
    heavy_rain: Number(process.env.CLUSTER_WINDOW_HEAVY_RAIN_HOURS) || 24,
    traffic_accident: Number(process.env.CLUSTER_WINDOW_TRAFFIC_HOURS) || 6,
    default: Number(process.env.CLUSTER_WINDOW_DEFAULT_HOURS) || 12,
  },

  /** Match radius in km by location precision tier */
  radiusKm: {
    street: Number(process.env.CLUSTER_RADIUS_STREET_KM) || 5,
    city: Number(process.env.CLUSTER_RADIUS_CITY_KM) || 20,
    sensor: Number(process.env.CLUSTER_RADIUS_SENSOR_KM) || 10,
    district: Number(process.env.CLUSTER_RADIUS_DISTRICT_KM) || 30,
    default: Number(process.env.CLUSTER_RADIUS_DEFAULT_KM) || 15,
  },

  /** Geo score when municipalities match (street vs city case) */
  municipalityMatchScore: Number(process.env.CLUSTER_MUNICIPALITY_MATCH_SCORE) || 0.9,

  /** Geo score when one signal is street-level and other is city-only, same municipality */
  parentChildGeoScore: Number(process.env.CLUSTER_PARENT_CHILD_GEO_SCORE) || 0.9,

  /** High-confidence merge for unknown event type against typed event */
  unknownTypedMergeThreshold:
    Number(process.env.CLUSTER_UNKNOWN_TYPED_THRESHOLD) || 0.85,

  /** Trust boost per additional independent source category on an event */
  trustBoostPerSourceCategory:
    Number(process.env.CLUSTER_TRUST_BOOST_PER_CATEGORY) || 0.08,

  /** Trust boost per additional merged signal on the same event (beyond the first) */
  trustBoostPerSignal:
    Number(process.env.CLUSTER_TRUST_BOOST_PER_SIGNAL) || 0.05,

  /** Max open events to consider as merge candidates per incoming report */
  maxCandidates: Number(process.env.CLUSTER_MAX_CANDIDATES) || 50,
} as const;
