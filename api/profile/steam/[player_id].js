import {connectToDatabase} from '../../../lib/database';
import {startOfWeek,startOfMonth} from '../../../lib/dateFunctions';
import {getSteamProfiles} from '../../../lib/steamFunctions';

const SteamID = require('steamid');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const db = await connectToDatabase();
    const {
        query: { player_id },
    } = req

    let sid = new SteamID(req.query.player_id)
    sid = sid.getSteamID64()
    getSteamProfiles([sid]).then(result => {
        res.status(200).json(result)
    })
}