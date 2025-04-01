import { NextResponse } from 'next/server';


/**
* GET handler for the planet API route
* Fetches planet data from the API Ninjas planet API
* Always includes Earth data along with any searched planet
*/
export async function GET(request) {
 try {
   // Get search parameters from the request URL
   const { searchParams } = new URL(request.url);
   const planetName = searchParams.get('name') || 'Earth';
   const API_KEY = process.env.API_NINJAS_KEY;


   // Check if API key is available
   if (!API_KEY) {
     return NextResponse.json(
       { error: 'API key not configured. Please add API_NINJAS_KEY to your .env.local file' },
       { status: 500 }
     );
   }


   // If the search is already for Earth, just return Earth data
   if (planetName.toLowerCase() === 'earth') {
     console.log('Fetching Earth data');
     const earthData = await fetchPlanetData('Earth', API_KEY);
     return NextResponse.json({ planets: earthData });
   }
  
   // Otherwise, fetch both the requested planet and Earth
   console.log(`Fetching data for: ${planetName} and Earth`);
   const [searchedPlanetData, earthData] = await Promise.all([
     fetchPlanetData(planetName, API_KEY),
     fetchPlanetData('Earth', API_KEY)
   ]);
  
   // If no planets found for the search, return Earth data only with a message
   if (searchedPlanetData.length === 0) {
     return NextResponse.json({
       message: `No planets found matching '${planetName}'`,
       planets: earthData.map(planet => ({ ...planet, isEarth: true }))
     });
   }
  
   // Combine the data, marking Earth for easy identification
   const combinedData = {
     planets: [
       ...earthData.map(planet => ({ ...planet, isEarth: true })),
       ...searchedPlanetData.map(planet => ({ ...planet, isEarth: false }))
     ]
   };
  
   return NextResponse.json(combinedData);
 } catch (error) {
   console.error('Error fetching planet data:', error);
   return NextResponse.json(
     { error: 'Failed to fetch planet data', message: error.message },
     { status: 500 }
   );
 }
}


/**
* Helper function to fetch planet data from the API
*/
async function fetchPlanetData(name, apiKey) {
 const API_URL = `https://api.api-ninjas.com/v1/planets?name=${encodeURIComponent(name)}`;
  const response = await fetch(API_URL, {
   headers: {
     'X-Api-Key': apiKey,
     'Content-Type': 'application/json'
   }
 });


 // Check if the request was successful
 if (!response.ok) {
   console.error(`API request failed for ${name} with status ${response.status}`);
   return [];
 }


 return response.json();
}
