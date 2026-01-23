const ai = require("./ai")
const axios = require('axios');

async function getAllStationsByName(name) {
  try {
    const response = await axios.get(
      `https://www.lefrecce.it/Channels.Website.BFF.WEB/website/locations/search?name=${encodeURIComponent(name)}`
    );

    const data = response.data;

    if (!data || data.length === 0) {
      return null;
    }

    const multi = data.find(station => station.multistation === true);

    if (multi) {
      return multi;
    }

    return data[0];

  } catch (error) {
    console.log("errore " + error);
    return null;
  }
}


function checkMultiStation(obj) {
    return obj.multistation === true
}


 async function getSolutionsByJSON(departureName, destinationName, orario = null){
  console.log(departureName)
  console.log("getsolution in ")
  const [departureStation, destinationStation] = await Promise.all([
    getAllStationsByName(departureName),
    getAllStationsByName(destinationName)
  ]);

  if (!departureStation || departureStation.length === 0) {
    console.log("Stazione di partenza non trovata");
    return -1;
  }

  if (!destinationStation || destinationStation.length === 0) {
    console.log("Stazione di destinazione non trovata");
    return -1;
  }

  const Solutions = await getAllSolutions(
    departureStation.id,
    destinationStation.id,
    orario
  );

  return Solutions
}






async function getAllSolutions(idDeparture, idDestination, orario = null){
  if(orario == null){
    orario = new Date();
  }

  const response = await axios.post("https://www.lefrecce.it/Channels.Website.BFF.WEB/website/ticket/solutions",
    {
	"departureLocationId": idDeparture,
	"arrivalLocationId": idDestination,
	"departureTime": orario,
	"adults": 1,
	"children": 0,
	"criteria": {
		"frecceOnly": false,
		"regionalOnly": false,
		"noChanges": false,
		"order": "DEPARTURE_DATE",
	        "limit": null,
		"offset": 0
	},
	"advancedSearchRequest": {
		"bestFare": false
	}
})

let array = response.data.solutions;

array = array.filter(item => item.solution.price !== null);

const solutions = array.map(item => {

  return {
    trains: item.solution.trains,
    origin: item.solution.origin,
    destination: item.solution.destination,
    departureTime: item.solution.departureTime,
    arrivalTime: item.solution.arrivalTime,
    duration: item.solution.duration,
    name: item.solution.trains[0].name,
    acronym: item.solution.trains[0].acronym,
    price: item.solution.price.amount
  }
})

return solutions;
}

module.exports = {getSolutionsByJSON}






