import { supabase } from "./supabase";

export function hasServiceCache() {
    return (sessionStorage.getItem("services")? true : false);
}

export function getAllServices() {
    return JSON.parse(sessionStorage.getItem("services") || "[]");
}

export function getService(id) {
    const services = JSON.parse(sessionStorage.getItem("services") || "[]");
    for (let service of services) {
        if (service.id == id) {
            return service;
        }
    }
    return null;
}

export async function fetchServices() {
    try {
        const { data, error } = await supabase
            .from('static_locations')
            .select('id, name, tags, address, latitude, longitude, opening_hours, contact_info, services, images, additional_info, location_type');
        if (error) {
            console.error('Error fetching services:', error);
            return null; // Return null on error for better handling
        }
        sessionStorage.setItem("services", JSON.stringify(data || []));
        return data; // Return data for chaining
    } catch (err) {
        console.error('Unexpected error in fetchServices:', err);
        return null;
    }
}


