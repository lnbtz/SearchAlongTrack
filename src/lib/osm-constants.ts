import type { OverpassJson } from "overpass-ts";

export const SEARCH_CORRIDOR_RADIUS = 5000; // in meters, this is the radius around the track where we search for points of interest

export const OSMCategories = {
  key: {
    AMENITY: 'amenity',
    SHOP: 'shop',
    TOURISM: 'tourism',
    ICE_CAFE: 'ice_cafe',
    ACCOMMODATION: 'accommodation',
    BICYCLE_REPAIR: 'bicycle_repair',
  },
  value: {
    SHELTER: 'shelter',
    CAFE: 'cafe',
    FUEL: 'fuel',
    SUPERMARKET: 'supermarket',
    BAKERY: 'bakery',
    VENDING_MACHINE: 'vending_machine',
    ICE_CREAM: 'ice_cream',
    KIOSK: 'kiosk',
    DRINKING_WATER: 'drinking_water',
    TOILETS: 'toilets',
    RESTAURANT: 'restaurant',
    CAMP_SITE: 'camp_site',
    BICYCLE_REPAIR_STATION: 'bicycle_repair_station',
    BICYCLE: 'bicycle',
    HOTEL: 'hotel',
    APARTMENT: 'apartment',
    ALPINE_HUT: 'alpine_hut',
    HOSTEL: 'hostel',
    MOTEL: 'motel',
    WILDERNESS_HUT: 'wilderness_hut',
    GUEST_HOUSE: 'guest_house',
    FAST_FOOD: 'fast_food',
  },
};

export const OSMCategoriesMap = new Map<string, string[]>([
  [OSMCategories.value.VENDING_MACHINE, [OSMCategories.value.VENDING_MACHINE]],
  [OSMCategories.value.SHELTER, [OSMCategories.value.SHELTER]],
  [OSMCategories.key.ICE_CAFE, [OSMCategories.value.CAFE, OSMCategories.value.ICE_CREAM]],
  [OSMCategories.value.FUEL, [OSMCategories.value.FUEL]],
  [OSMCategories.value.SUPERMARKET, [OSMCategories.value.SUPERMARKET]],
  [OSMCategories.value.BAKERY, [OSMCategories.value.BAKERY]],
  [OSMCategories.value.KIOSK, [OSMCategories.value.KIOSK]],
  [OSMCategories.value.DRINKING_WATER, [OSMCategories.value.DRINKING_WATER]],
  [OSMCategories.value.TOILETS, [OSMCategories.value.TOILETS]],
  [OSMCategories.value.RESTAURANT, [OSMCategories.value.RESTAURANT]],
  [OSMCategories.value.FAST_FOOD, [OSMCategories.value.FAST_FOOD]],
  [OSMCategories.value.CAMP_SITE, [OSMCategories.value.CAMP_SITE]],
  [OSMCategories.key.BICYCLE_REPAIR, [OSMCategories.value.BICYCLE_REPAIR_STATION, OSMCategories.value.BICYCLE]],
  [OSMCategories.key.ACCOMMODATION, [
    OSMCategories.value.HOTEL,
    OSMCategories.value.APARTMENT,
    OSMCategories.value.ALPINE_HUT,
    OSMCategories.value.HOSTEL,
    OSMCategories.value.MOTEL,
    OSMCategories.value.WILDERNESS_HUT,
    OSMCategories.value.GUEST_HOUSE
  ]]
]);

export const QueryBodies = [
  {
    key: "AMENITIES",
    query: `["${OSMCategories.key.AMENITY}"~"${OSMCategories.value.FAST_FOOD}|${OSMCategories.value.TOILETS}|${OSMCategories.value.DRINKING_WATER}|${OSMCategories.value.CAFE}|${OSMCategories.value.FUEL}|${OSMCategories.value.ICE_CREAM}|${OSMCategories.value.RESTAURANT}|${OSMCategories.value.BICYCLE_REPAIR_STATION}"]`,
  },
  {
    key: "AMENITY_VENDING",
    query: `["${OSMCategories.key.AMENITY}"="${OSMCategories.value.VENDING_MACHINE}"]["vending"~"food|drink|sweets|pizza|ice_cream|coffee|chemist|bicycle_tube"]`,
  },
  {
    key: "AMENITY_SHELTERS",
    query: `["${OSMCategories.key.AMENITY}"="${OSMCategories.value.SHELTER}"]["shelter_type"!="public_transport"]`,
  },
  {
    key: "SHOPS",
    query: `["${OSMCategories.key.SHOP}"~"${OSMCategories.value.SUPERMARKET}|${OSMCategories.value.BAKERY}|${OSMCategories.value.KIOSK}|${OSMCategories.value.BICYCLE}"]`,
  },
  {
    key: "TOURISM",
    query: `["${OSMCategories.key.TOURISM}"~"${OSMCategories.value.CAMP_SITE}|${OSMCategories.value.HOTEL}|${OSMCategories.value.APARTMENT}|${OSMCategories.value.ALPINE_HUT}|${OSMCategories.value.HOSTEL}|${OSMCategories.value.MOTEL}|${OSMCategories.value.WILDERNESS_HUT}|${OSMCategories.value.GUEST_HOUSE}"]`,
  }
];


