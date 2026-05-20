const GROUPS = {
  "All": {
    tags: ["All"],
    description: "Browse all available locations and services in Miagao.",
    icon: "sunflower"
  },

  "Food & Drinks": {
    tags: [
      "restaurant", "fast_food", "cafe", "bakery", "seafood",
      "pastry", "bar", "beverages", "convenience"
    ],
    description: "Restaurants, cafes, bakeries, bars, and other places to eat and drink.",
    icon: "food"
  },

  "Shopping": {
    tags: [
      "variety_store", "clothes", "electronics", "furniture",
      "gift", "florist", "garden_centre", "doityourself",
      "bicycle", "tyres", "motorcycle", "trade"
    ],
    description: "Retail stores, markets, and shops for goods and everyday needs.",
    icon: "shopping"
  },

  "Health": {
    tags: [
      "hospital", "clinic", "pharmacy", "doctors",
      "dentist", "health_post", "social_facility"
    ],
    description: "Hospitals, clinics, pharmacies, and other medical and wellness services.",
    icon: "health"
  },

  "Finance": {
    tags: [
      "bank", "money_transfer", "pawnbroker", "lottery"
    ],
    description: "Banks, money transfer centers, and other financial services.",
    icon: "finance"
  },

  "Education": {
    tags: [
      "university", "college", "school", "kindergarten",
      "childcare", "research_institute"
    ],
    description: "Schools, universities, childcare centers, and research institutions.",
    icon: "education"
  },

  "Utility Services": {
    tags: [
      "laundry", "car_repair", "car_wash", "beauty",
      "funeral_directors", "recycling", "post_office",
      "internet_cafe", "karaoke_box"
    ],
    description: "Everyday services including laundry, repairs, salons, and more.",
    icon: "services"
  },

  "Accommodation": {
    tags: [
      "dormitory", "apartment", "student_accommodation", "shelter"
    ],
    description: "Dormitories, apartments, student housing, and other lodging options.",
    icon: "accommodation"
  },

  "Tourism": {
    tags: [
      "attraction", "museum", "artwork", "information",
      "events_venue", "marketplace", "place_of_worship", "townhall"
    ],
    description: "Tourist spots, cultural sites, museums, and local landmarks worth visiting.",
    icon: "tourism"
  },

  "Government & Safety": {
    tags: [
      "police", "fire_station", "parking", "fuel", "toilets"
    ],
    description: "Police stations, fire stations, public utilities, and safety services.",
    icon: "safety"
  },

  "Worship & Community": {
    tags: [
      "place_of_worship", "social_facility", "townhall"
    ],
    description: "Churches, mosques, community centers, and places for social gatherings.",
    icon: "community"
  }
};

export function getGroupForTag(tag) {
  for (const [group, data] of Object.entries(GROUPS)) {
    if (data.tags.includes(tag)) return group;  // data.tags not data
  }
  return "Other";
}

export const GROUP_NAMES = Object.keys(GROUPS);
export const TAG_GROUPS = GROUPS;