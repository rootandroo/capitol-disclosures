const axios = require("axios");

const fetchCongressMembers = async (year) => {
  const url = "https://app-elastic-prod-eus2-001.azurewebsites.net/search";
  const params = {
    index: "bioguideprofiles",
    size: 96,
    filters: {
      "jobPositions.congressAffiliation.congress.name": [
        `The ${year - 1905}th United States Congress`,
      ],
    },
    from: 0,
    applicationName: "bioguide.house.gov",
  };
  headers = { "Content-Type": "application/json" };
  let resp = await axios.post(url, params, { headers: headers });
  const hitsTotal = resp.data.hitsTotal;
  const pages = Math.ceil(hitsTotal / 96);
  let hits = [];
  for (page = 1; page <= pages; page++) {
    hits = [...hits, ...resp.data.filteredHits];
    params.from = page * 96;
    resp = await axios.post(url, params, { headers: headers });
  }
  return hits;
};

const parseMembers = (members) => {
  result = [];
  members.forEach((member) => {
    const congress = member.congresses[member.congresses.length - 1];
    let first = member.unaccentedGivenName;
    const middle = member.unaccentedMiddleName;
    let last = member.unaccentedFamilyName;
    entry = {
      position: congress.position,
      last:
        last.toUpperCase() === last
          ? last.charAt(0) + last.slice(1).toLowerCase().trim()
          : last.trim(),
      first: middle ? `${first} ${middle}` : first,
      state: congress.stateCode,
      district: congress.stateDistrict ? congress.stateDistrict : "",
      party: congress.parties[0],
    };
    result.push(entry);
  });
  return result;
};

if (require.main === module) {
  fetchCongressMembers(2022).then((members) => {
    console.log(parseMembers(members));
  });
}

module.exports = { fetchCongressMembers, parseMembers };
