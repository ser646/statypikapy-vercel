import {connectToDatabase} from '../../lib/database';
import {startOfWeek,startOfMonth} from '../../lib/dateFunctions';

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const db = await connectToDatabase();
    const {
      query: { option },
    } = req
    if(req.method == "GET"){     
        if(Number(option)){
            const matchid = option
            db.collection('logs').findOne({_id : matchid}, (cmdErr, result) => {
                if(cmdErr){
                    console.log(cmdErr)
                    res.status(400).json(cmdErr);
                }
                else res.status(200).json(result);
            });
        }
        else {
            if(option == 'diff'){
                let p1 = fetch("https://logs.tf/api/v1/log?title=tf2pickup.pl&limit=10000")
				.then(r => r.json()).then(r => {
					let logs = [];
					for(let l of r.logs){
						logs.push(`${l.id}`)
					}
					return logs;
				})  
				let p2 = fetch("https://api.tf2pickup.pl/games?limit=100")
				.then(r => r.json()).then(r => {
					let logs = [];
					for(let l of r.results){
						if(l.logsUrl)logs.push(l.logsUrl.slice(15))
					}
					return logs;
				})
				let p3 = db.collection('logs').distinct('_id', {}, {})
                Promise.all([p1,p2,p3]).then(r => {
					let diff1 = r[0].filter(x => !r[2].includes(x));
                    let diff2 = r[1].filter(x => !r[2].includes(x));
					let diff = diff1.concat(diff2)
                    res.status(200).json(diff);
                })
            }
            else if(option == "weekly" || option == "monthly" || option == "all"){
                let time_range = option;
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
                                '$gt': z/1000
                            }
                        }
                    },
                    {
                    '$project': {
                        '_id': 1, 
                        'map': '$info.map', 
                        'date': '$info.date', 
                        'result': {
                            'Red': '$teams.Red.score', 
                            'Blue': '$teams.Blue.score'
                        }
                    }
                    },
                    {
                    '$sort' :{
                        'date': -1
                        }
                    }
                ])
                .toArray((err,r) => {
                    if(err){
                        console.log(err)
                        res.status(400).json(err);
                    }
                    else res.status(200).json(r);
                })
            }
        }
    }
  }