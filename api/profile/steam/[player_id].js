import {getSteamProfiles} from '../../../lib/steamFunctions';

const SteamID = require('steamid');

module.exports = async (req, res) => {
    const {
        query: { player_id },
    } = req

    let sid = new SteamID(req.query.player_id)
    sid = sid.getSteamID64()
    getSteamProfiles([sid]).then(result => {
        res.status(200).json(result)
    })
}