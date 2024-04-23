const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');

const TOKEN = '73d62591af4b3ccb51986ff5f8af5676';
const BASE_URL = 'https://rest.entitysport.com/v4';

async function fetchTournaments() {
  const response = await axios.get(`${BASE_URL}/tournaments?token=${TOKEN}`);
  return response.data.response.items;
}

async function fetchCompetitions(tournamentId) {
    const url = `${BASE_URL}/tournaments/${tournamentId}/competitions?token=${TOKEN}&per_page=80`;
    const response = await axios.get(url);

    const competitions = response.data.response.items.competitions;
    return competitions.map(comp => ({
      season: comp.season,
      cid: comp.cid,
      title: comp.title,
      match_format: comp.match_format,
      tournament_id: tournamentId,
      tournament_name: comp.title
    }));
}

async function writeSeasonWiseCompetitionsToCSV(seasonalData) {
  for (const season in seasonalData) {
    const csvWriter = createObjectCsvWriter({
      path: `./competitions_${season}.csv`,
      header: [
        {id: 'tournament_id', title: 'Tournament ID'},
        {id: 'tournament_name', title: 'Tournament Name'},
        {id: 'cid', title: 'Competition ID'},
        {id: 'title', title: 'Competition Title'},
        {id: 'match_format', title: 'Match Format'},
        {id: 'season', title: 'Season'}
      ]
    });

    await csvWriter.writeRecords(seasonalData[season]);
    console.log(`Written competitions for season ${season} to CSV.`);
  }
}

async function main() {
  const tournaments = await fetchTournaments();
  let seasonalData = {};

  for (const tournament of tournaments) {
    console.log(`Fetching competitions for tournament ID: ${tournament.tournament_id}`);
    const competitions = await fetchCompetitions(tournament.tournament_id);
    competitions.forEach(comp => {
      if (!seasonalData[comp.season]) {
        seasonalData[comp.season] = [];
      }
      seasonalData[comp.season].push(comp);
    });
  }

  await writeSeasonWiseCompetitionsToCSV(seasonalData);
}

main().catch(console.error);
