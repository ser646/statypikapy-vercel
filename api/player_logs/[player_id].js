import {connectToDatabase} from '../../lib/database';
import {startOfWeek,startOfMonth} from '../../lib/dateFunctions';

const fetch = require('node-fetch');

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

            db.collection('logs').aggregate([
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
                },
                {
                    '$sort': {
                        'info.date': -1
                    }
                    },
                {
                    '$project': {
                    'map': '$info.map', 
                    'team' : '$players.'+p_id+'.team',
                    'score' : {
                        'Red' : '$teams.Red.score',
                        'Blue' : '$teams.Blue.score'
                    },
                    'result' : {
                        "$switch": {
                        "branches": [
                            { "case": 
                            { 
                                '$and': [
                                {'$eq' : ['$players.'+p_id+'.team','Red']},
                                {"$gt": [ '$teams.Red.score', '$teams.Blue.score' ]}
                                ]
                            },
                            "then": 'won' 
                            },
                            { "case": 
                            { 
                                '$and': [
                                {'$eq' : ['$players.'+p_id+'.team','Blue']},
                                {"$gt": [ '$teams.Blue.score', '$teams.Red.score' ]}
                                ]
                            },
                            "then": 'won' 
                            },
                            { "case": 
                            { 
                                '$and': [
                                {'$eq' : ['$players.'+p_id+'.team','Blue']},
                                {"$lt": [ '$teams.Blue.score', '$teams.Red.score' ]}
                                ]
                            },
                            "then": 'lost' 
                            },
                            { "case": 
                            { 
                                '$and': [
                                {'$eq' : ['$players.'+p_id+'.team','Red']},
                                {"$lt": [ '$teams.Red.score', '$teams.Blue.score' ]}
                                ]
                            },
                            "then": 'lost' 
                            }
                        ],
                        "default": 'tied'
                        }
                    },
                    'stats' : {
                        'kills' : '$players.'+p_id+'.kills',
                        'assists':'$players.'+p_id+'.assists',
                        'deaths':'$players.'+p_id+'.deaths',
                        'dmg':'$players.'+p_id+'.dmg',
                        'dapm':'$players.'+p_id+'.dapm',
                        'kpd':'$players.'+p_id+'.kpd',
                        'cpc':'$players.'+p_id+'.cpc'
                    }, 
                    'classes': {
                        '$map': {
                        'input': '$players.'+p_id+'.class_stats', 
                        'as': 'class', 
                        'in': '$$class.type'
                        }
                    }
                    }
                }
            ],{allowDiskUse: true}
            ).toArray((cmdErr, result) => {
                if(cmdErr){
                    console.log(cmdErr)
                    res.status(400).json({status: "Failure", err: cmdErr})
                }
                else res.status(200).json(result)
            })
        }
        else res.status(400).json({status: "Failure", err: "Wrong query parameter/s "})
    }
  }