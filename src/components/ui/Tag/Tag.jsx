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

export function Tag({ children, className }) {
    return (
        <div className={`tag ${className}`}>
            {children}
        </div>
    );
}