import {connectToDatabase} from '../../../lib/database';
import {startOfWeek,startOfMonth} from '../../../lib/dateFunctions';

module.exports = async (req, res) => {
    const db = await connectToDatabase();
    const {
        query: { player_id },
    } = req
    let time_range = req.query["time_range"];
    if(req.method == "GET"){ 
        if(!time_range) time_range = "all"
        if(time_range == "all" || time_range == "weekly" || time_range == "monthly"){
            const p_id = player_id;
            let dt = new Date();
            if(time_range == 'all')dt = 1;
            else if(time_range == 'weekly')dt =  startOfWeek(dt);
            else if(time_range == 'monthly')dt =  startOfMonth(dt);
            let z = new Date(dt);
            z = z.getTime()

            
            db.collection('logs').aggregate(
            [
                {
                    '$match': {
                        ['players.'+p_id]: {
                            '$exists': true
                        }, 
                        'info.date': {
                            '$gt': z / 1000
                        },
                        'players_count': {
                            '$lt': 15
                        }
                    }
                }, {
                    '$project': {
                    'stats': `$players.${p_id}`
                    }
                }, {
                    '$project': {
                    'kills': '$stats.kills', 
                    'dapm': '$stats.dapm', 
                    'dmg': '$stats.dmg', 
                    'kpd': '$stats.kpd'
                    }
                }, {
                    '$group': {
                    '_id': null, 
                    'maxKills': {
                        '$max': '$kills'
                    }, 
                    'maxDpm': {
                        '$max': '$dapm'
                    }, 
                    'maxDmg': {
                        '$max': '$dmg'
                    }, 
                    'maxKpd': {
                        '$max': {
                            '$convert': {
                              'input': '$kpd', 
                              'to': 'double'
                            }
                        }
                    }
                    }
                }
            ]).toArray((cmdErr, result) => {
                if(cmdErr){
                    console.log(cmdErr)
                    res.status(400).json({status: "Failure", err: cmdErr})
                }
                else res.status(200).json(result[0])
            })
            }
        else res.status(400).json({status: "Failure", err: "Wrong query parameter/s "})
    }
}