import "./Tag.css";

const HIDDEN_TAGS = new Set(["all", "fixed services", "miagao services", "save"]);

const MARKER_COLORS = {
    restaurant: "#E04000",
    cafe: "#602000",
    bakery: "#C08000",
    grocery: "#406000",
    gift: "#8020E0",
    hardware: "#602000",
    printing: "#C000C0",
    beauty: "#A02060",
    medical: "#C02020",
    pharmacy: "#E04040",
    financial: "#C0A020",
    university: "#800000",
    schools: "#6060C0",
    accommodation: "#2060C0",
    automotive: "#404040",
    laundry: "#008060",
    tourism: "#006020",
    religious: "#804000",
    entertainment: "#600080",
    government: "#0000A0",
    information: "#A00040",
    recycling: "#408000",
    funeral: "#000000",
    shelter: "#402020",
    toilet: "#A08080",
    lottery: "#C0A060",
    computer: "#008080",
    community: "#0000A0",
    save: "#E0C000",
};

const TAG_MARKER_MATCHES = [
    { marker: "restaurant", tags: ["restaurant", "fast_food", "seafood"] },
    { marker: "cafe", tags: ["cafe", "beverages"] },
    { marker: "bakery", tags: ["bakery", "pastry"] },
    { marker: "grocery", tags: ["convenience", "variety_store", "marketplace", "grocery"] },
    { marker: "gift", tags: ["clothes", "gift", "florist"] },
    { marker: "hardware", tags: ["trade", "furniture", "electronics", "hardware"] },
    { marker: "printing", tags: ["doityourself", "printing"] },
    { marker: "beauty", tags: ["beauty"] },
    { marker: "medical", tags: ["hospital", "clinic", "health_post", "doctors", "dentist", "medical"] },
    { marker: "pharmacy", tags: ["pharmacy"] },
    { marker: "financial", tags: ["bank", "money_transfer", "pawnbroker", "financial"] },
    { marker: "university", tags: ["university", "college", "research_institute", "upv"] },
    { marker: "schools", tags: ["school", "schools", "kindergarten", "childcare"] },
    { marker: "accommodation", tags: ["student_accommodation", "dormitory", "apartment", "accommodation"] },
    { marker: "automotive", tags: ["car_repair", "motorcycle", "tyres", "fuel", "car_wash", "bicycle", "parking", "automotive"] },
    { marker: "laundry", tags: ["laundry"] },
    { marker: "tourism", tags: ["attraction", "museum", "artwork", "tourism"] },
    { marker: "religious", tags: ["place_of_worship", "religious"] },
    { marker: "entertainment", tags: ["karaoke_box", "events_venue", "bar", "entertainment"] },
    { marker: "government", tags: ["townhall", "police", "fire_station", "social_facility", "garden_centre", "government"] },
    { marker: "information", tags: ["information", "post_office"] },
    { marker: "recycling", tags: ["recycling"] },
    { marker: "funeral", tags: ["funeral_directors", "funeral"] },
    { marker: "shelter", tags: ["shelter"] },
    { marker: "toilet", tags: ["toilets", "toilet"] },
    { marker: "lottery", tags: ["lottery"] },
    { marker: "computer", tags: ["internet_cafe", "computer"] },
    { marker: "community", tags: ["community"] },
    { marker: "save", tags: ["save", "created pins", "pinned"] },
];

const ALL_TAGS = {
    'accommodation': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Accommodation"
    },
    
    'automotive': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Automotive"
    },

    'bakery': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Bakery"
    }, 

    
    'beauty': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Beauty"
    },

    'cafe': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Cafe"
    },

    
    'community': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Community"
    },

    'computer': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Technology"
    },

    'entertainment': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Entertainment"
    },
    
    'financial': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Finance",
    },

    'funeral': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Cemetery"
    }, 

    'gift': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Gifts"
    }, 

    'government': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Government"
    },
    
    'grocery': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Grocery"
    },
    
    'hardware': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Hardware"
    },

    'information': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Information"
    },

    
    'laundry': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Laundry"
    },
    
    'lottery': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Lottery"
    },

    'medical': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Medical"
    },

    'pharmacy': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Pharmacy"
    },

    'printing': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Printing"
    },

    'trash': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Trash"
    },

    'religious': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Religion"
    },

    'restaurant': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Restaurant"
    },

    'save': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Created Pins"
    },

    'schools': {
        'bgColor' : "",
        "color"   : "",
        "content" : "School"
    },

    'shelter': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Shelter"
    },
    
    'toilet': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Toilet"
    },
    
    'tourism': {
        'bgColor' : "",
        "color"   : "",
        "content" : "Tourism"
    },

    'university': {
        'bgColor' : "",
        "color"   : "",
        "content" : "University"
    },

    'upv': {
        'bgColor' : "",
        "color"   : "",
        "content" : "UP Visayas"
    }
}

function formatTagLabel(tag) {
    return String(tag)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeTag(tag) {
    return String(tag).trim().toLowerCase();
}

function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
    };
}

function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function mixHex(hex, target, targetWeight) {
    const baseRgb = hexToRgb(hex);
    const targetRgb = hexToRgb(target);
    return rgbToHex({
        r: Math.round(baseRgb.r * (1 - targetWeight) + targetRgb.r * targetWeight),
        g: Math.round(baseRgb.g * (1 - targetWeight) + targetRgb.g * targetWeight),
        b: Math.round(baseRgb.b * (1 - targetWeight) + targetRgb.b * targetWeight),
    });
}

function getMarkerKeyForTag(tagKey) {
    return TAG_MARKER_MATCHES.find(({ tags }) => tags.includes(tagKey))?.marker ?? "save";
}

function getMarkerStyle(tagKey) {
    const accent = MARKER_COLORS[getMarkerKeyForTag(tagKey)] ?? MARKER_COLORS.save;
    return {
        bg: mixHex(accent, "#ffffff", 0.84),
        color: mixHex(accent, "#111111", 0.32),
        border: accent,
    };
}

export function shouldShowTag(tag) {
    if (tag === null || tag === undefined) return false;
    const tagKey = normalizeTag(tag);
    return tagKey.length > 0 && !HIDDEN_TAGS.has(tagKey);
}

export function Tag({ children, name, className = "", style, ...props }) {
    const rawTag = typeof name === "string" ? name : children;
    const tagKey = typeof rawTag === "string" ? normalizeTag(rawTag) : "";
    if (tagKey && !shouldShowTag(tagKey)) return null;

    const content = ALL_TAGS[tagKey]?.content
        ?? (typeof name === "string" ? formatTagLabel(name) : children);
    const tagStyle = getMarkerStyle(tagKey);

    return (
        <div
            className={`tag ${className}`.trim()}
            style={{
                "--tag-bg": tagStyle.bg,
                "--tag-text": tagStyle.color,
                "--tag-border": tagStyle.border,
                ...style,
            }}
            {...props}
        >
            {content}
        </div>
    );
}
