const axios = require('axios');

async function getAllStationsByName(name) {
  try {
    const response = await axios.get(
      `https://www.lefrecce.it/Channels.Website.BFF.WEB/website/locations/search?name=${encodeURIComponent(name)}`
    );

    const data = response.data;

    if (data.length != null) {
      return data
    }
    else{
      return null
    }




  } catch (error) {
    console.log("errore " + error);
    return null;
  }
}

function checkMultiStation(obj) {
    return obj.multistation === true
}


async function main(){
  const id = await getAllStationsByName('sdfdsfdfs');
  if(id === null){
    //open ai clutcha
  }
  else{
  console.log("ID trovato:", id);
  }
};





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
  console.log(item)
  return {
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

console.log(solutions)
return solutions;

}

console.log(getAllStationsByName('Milano Centrale'))


// nel caso di input arrivo delta treni prima o dopo
