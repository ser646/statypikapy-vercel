import {connectToDatabase} from '../../lib/database';
import {startOfWeek,startOfMonth} from '../../lib/dateFunctions';
import {getSteamProfiles} from '../../lib/steamFunctions';

const SteamID = require('steamid');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const db = await connectToDatabase();
    const {
      query: { option },
    } = req

    if(req.method == "GET"){ 
        if(option == "weekly" || option == "monthly" || option == "all"){
            let time_range = option;
            let dt = new Date();
            if(time_range == 'all')dt = 1;
            else if(time_range == 'weekly')dt =  startOfWeek(dt);
            else if(time_range == 'monthly')dt =  startOfMonth(dt);
            let z = new Date(dt);
            z = z.getTime()

            let players = {};
            let steamids = [];
            let steamids64 = [];
                      
            db.collection('logs').aggregate([
              {
                '$match': {
                  'info.date': {
                    '$gt': z / 1000
                  }, 
                  'players_count': {
                    '$lt': 15
                  }
                }
              }, {
                '$project': {
                  'players': {
                    '$map': {
                      'input': {
                        '$objectToArray': '$players'
                      }, 
                      'as': 'p', 
                      'in': {'id' : '$$p.k','team' : '$$p.v.team'}
                    }
                  }, 
                  'score': {
                    'Blue': '$teams.Blue.score', 
                    'Red': '$teams.Red.score'
                  },
                  'names' : 1
                }
              }
            ]).toArray(function (err,result){
              for(let log of result){
                let winner;
                if(log.score.Red > log.score.Blue)winner = 'Red';
                else if(log.score.Red < log.score.Blue)winner = 'Blue';
                else winner = false;

                for(let p of log.players){
                    let id = p.id;
                    if(players[id] == undefined){
                        let sid = new SteamID(id);
                        steamids.push(id);
                        sid = sid.getSteamID64(); 
                        steamids64.push(sid);
                        players[id] = {
                          'name' : log.names[id],
                          'steamid64' : sid,
                          'avatar' : '',
                          'games_played' : 0,
                          'games_won' : 0,
                          'games_lost' : 0,
                          'games_tied' : 0,
                          'score' : 0
                      }
                  }
                  players[id].games_played += 1;
                  if(winner && p.team == winner){
                      players[id].games_won += 1;
                  }
                  else if(winner && p.team != winner){
                      players[id].games_lost += 1;
                  }
                  else {
                      players[id].games_tied += 1;
                      players[id].name = log.names[id];
                  }
                }
              }
              
              getSteamProfiles(steamids64).then(result => {
                for(let r of result){
                  let sid3 = new SteamID(r._id);
                  sid3 = sid3.getSteam3RenderedID()
                  players[sid3].avatar = r.avatar; 
                }
                res.status(200).json(players)
              })
            })
        }
    }
  }