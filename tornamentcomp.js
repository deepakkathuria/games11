const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');

const TOKEN = '73d62591af4b3ccb51986ff5f8af5676';
const BASE_URL = 'https://rest.entitysport.com/v4';

async function fetchTournaments() {
  const response = await axios.get(`${BASE_URL}/tournaments?token=${TOKEN}`);
  return response.data.response.items;
}

async function fetchCompetitions(tournamentId, page = 1, allCompetitions = []) {
    const url = `${BASE_URL}/tournaments/${tournamentId}/competitions?token=${TOKEN}&per_page=80`;
    const response = await axios.get(url);

    const { competitions, total_pages } = response.data.response.items;
    allCompetitions.push(...competitions);

    if (page < total_pages) {
      return fetchCompetitions(tournamentId, page + 1, allCompetitions);
    } else {
      return allCompetitions;
    }
}

async function writeCompetitionsToCSV(competitions) {
  const csvWriter = createObjectCsvWriter({
    path: './all_competitions.csv',
    header: [
      {id: 'tournament_id', title: 'TID'},
      {id: 'tournament_name', title: 'TName'},
      {id: 'cid', title: 'CID'},
      {id: 'title', title: 'Title'},
      {id: 'season', title: 'Season'},
      {id: 'match_format', title: 'Match Format'}
    ]
  });

  await csvWriter.writeRecords(competitions);
  console.log('Written all competitions to CSV.');
}

async function main() {
  const tournaments = await fetchTournaments();
  let allCompetitions = [];

  for (const tournament of tournaments) {
    const competitions = await fetchCompetitions(tournament.tournament_id);
    competitions.forEach(comp => {
      comp.tournament_id = tournament.tournament_id;
      comp.tournament_name = tournament.name;
      // Add match_format to the existing fields
      comp.match_format = comp.match_format; // Assuming the field is directly available like other fields
    });
    allCompetitions.push(...competitions);
  }

  // Transform the data to the desired format for the CSV
  const transformedData = allCompetitions.map(comp => ({
    tournament_id: comp.tournament_id,
    tournament_name: comp.tournament_name,
    cid: comp.cid,
    title: comp.title,
    season: comp.season,
    match_format: comp.match_format
  }));

  await writeCompetitionsToCSV(transformedData);
}

main().catch(console.error);
