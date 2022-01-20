import {connectToDatabase} from '../lib/database';
import {startOfWeek,startOfMonth} from '../lib/dateFunctions';
import {getSteamProfiles} from '../lib/steamFunctions';

const SteamID = require('steamid');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const db = await connectToDatabase();
    if(req.method == "GET"){ 
        const time_range = req.query['time_range'];
        const param = req.query['param'];
        let filter_class = JSON.parse(req.query['filter_class']);
        !filter_class ? filter_class = {'$exists' : 1} : false;
        let filter_maps = JSON.parse(req.query['filter_maps']);
        filter_maps.length == 0 ? filter_maps = {'$exists' : 1} : filter_maps = {'$in' : filter_maps};
        let dt = new Date();
        if(time_range == 'all')dt = 1;
        else if(time_range == 'weekly')dt =  startOfWeek(dt);
        else if(time_range == 'monthly')dt =  startOfMonth(dt);
        let z = new Date(dt);
        z = z.getTime()

        db.collection('logs').aggregate([
            {
            '$match': {
                'players_count': {
                '$lt': 15
                }, 
                'info.date': {
                '$gt': z / 1000
                }
            }
            }, {
            '$project': {
                'names': {
                '$objectToArray': '$names'
                }, 
                'players_arr': {
                '$objectToArray': '$players'
                }, 
                'map': '$info.map'
            }
            }, {
            '$unwind': {
                'path': '$players_arr'
            }
            }, {
            '$project': {
                '_id': 1, 
                'p_id': '$players_arr.k', 
                'name': {
                '$arrayElemAt': [
                    '$names', {
                    '$indexOfArray': [
                        '$names.k', '$players_arr.k'
                    ]
                    }
                ]
                }, 
                'class_stats': '$players_arr.v.class_stats',
                'map': '$map', 
                'value': {'$convert': {
                    'input': `$players_arr.v.${param}`, 
                    'to': 'double'
                  }
                }
            }
            }, {
            '$project': {
                '_id': 1, 
                'p_id': 1, 
                'name': '$name.v', 
                'map': 1, 
                'class_stats' : 1,
                'value': 1
            }
            },{
            '$match':{
                'map' : filter_maps,
                'class_stats.type' : filter_class
            }
            }, {
            '$sort': {
                'value': -1
            }
            }, {
            '$limit': 10
            }
        ]).toArray(async (cmdErr, result) => {
            let steamids64 = [];
            for(let {p_id} of result){
                p_id = new SteamID(p_id).getSteamID64();
                if(!steamids64.includes(p_id))steamids64.push(p_id)
            }

            const steam_profiles = await getSteamProfiles(steamids64);
            for(let r of result){
                let p_id = new SteamID(r.p_id).getSteamID64();
                r['m_id'] = r._id,
                r = Object.assign(r,steam_profiles.find(x => {return x._id == p_id}))
            }
            res.status(200).json(result);
        });
    }
};