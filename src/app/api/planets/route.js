import { NextResponse } from 'next/server';

/**
* Planet data API
* This file exports hardcoded planet data instead of making API calls
*/

/**
* Function to fetch planet data
* @param {string} name - The name of the planet to fetch
* @returns {Array} - Array of planet data objects
*/
function fetchPlanetData(name) {
  // Return the hardcoded planet data
  return [
    {
      "name": "Earth",
      "mass": 0.00315,
      "radius": 0.0892,
      "period": 365.2,
      "semi_major_axis": 1,
      "temperature": 288,
      "distance_light_year": 0,
      "host_star_mass": 1,
      "host_star_temperature": 6000
    }
  ];
}

/**
* GET handler for the planet API route
* Returns hardcoded planet data
*/
export async function GET() {
  const earthData = fetchPlanetData('Earth');
  
  return NextResponse.json({
    planets: earthData.map(planet => ({ ...planet, isEarth: true }))
  });
}
