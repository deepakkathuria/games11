const axios = require('axios');

// URL of the API endpoint
const url = 'https://rest.entitysport.com/v2/teams/5/matches?status=2&token=42ea9225d5aaf95f2da2a0f45f1d5584';

// Function to fetch match IDs
const fetchMatchIds = async () => {
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'ok') {
      const matchIds = data.response.items.map(item => item.match_id);
      console.log(matchIds);
      return {matchIds:matchIds};
    } else {
      console.error('Error: Status not OK');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Call the function
fetchMatchIds();
