Vue.config.devtools = true;

//uri = 'http://192.168.0.46:8081/';
uri = 'https://statypikapy.cloudno.de/';
uri2 = "http://localhost:3000/api/"
var t0 = performance.now()

$('#logs_list').flowtype({
    minFont   : 13,
    maxFont   : 16
 });

var log = {
    props: ['lkey'],
    template: '#log',
    data: function() {
        return {
            show_details: false,
            log_details: {
                Red : {},
                Blu : {}
            }
        }
    },
    methods: {
        toggle() {
            this.show_details = !this.show_details
            if(this.show_details){
                
                app.getLog(this.$props.lkey._id).then(r=>{
                    Red = [];
                    Blu = [];
                    for(p in r.players){
                        if(r.players[p].team == 'Red'){
                            a = [];
                            for(c of r.players[p].class_stats){
                                a.push(c.type);
                            }
                            Red.push({
                                name : r.names[p],
                                classes : a,
                                kills : r.players[p].kills,
                                assists : r.players[p].assists,
                                deaths : r.players[p].deaths,
                                dpm : r.players[p].dapm,
                            })
                        }
                        else if(r.players[p].team == 'Blue'){
                            a = [];
                            for(c of r.players[p].class_stats){
                                a.push(c.type);
                            }
                            Blu.push({
                                name : r.names[p],
                                classes : a,
                                kills : r.players[p].kills,
                                assists : r.players[p].assists,
                                deaths : r.players[p].deaths,
                                dpm : r.players[p].dapm,
                            })
                        }
                    }
                    Red.sort(function(a, b) {
                        return b.kills - a.kills;
                    });
                    Blu.sort(function(a, b) {
                        return b.kills - a.kills;
                    });
                    
                    this.log_details.Red = Red;
                    this.log_details.Blu = Blu;
                })

            }
        }
      }
};

var app = new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    components: {
        'log': log
    },
    data: {
        logs_or_score: 'score',
        logs_to_show: [],
        logs_to_download : [],
        logs_to_download_total : 0,
        logs_time_range: 'monthly',
        logs_last_sort : false,
        loading: true,
        updating: true,
        show_player_info: false
    },
    methods: {
        update : function (){
            fetch(uri2+'logs'+'/diff',{method : "GET"}).then(r => r.json()).then(r => {
                app.logs_to_download = r;
                app.logs_to_download_total = r.length
                
                logsFetches = [];
                for(i = 0;i<r.length;i++){
                    logsFetches[i] = fetch(uri2+'logs?id='+r[i],{method: "POST"}).then(r => r.json()).then(r => {
                        if(r.status == 'Success'){       
                            app.logs_to_download.shift();
                            console.log(app.logs_to_download.length)
                            document.getElementById('update_info').innerText = "Logs to download: " + app.logs_to_download.length;
                        }
                        else console.log(res);
                    })
                }

                Promise.all(logsFetches).then(r => {
                    app.main();
                    document.getElementById('update_info').innerText='All logs up to date!';
                    console.log('All logs up to date!')
                })
            })
        },
        changeTimeRange : function(event){
            app.logs_time_range = event.target.attributes.value.value;
        },
        downloadLog : function (matchid,counter){                
            fetch(uri2+'logs?id='+matchid,{method: "POST"}).then(r => r.json()).then(r => {
                if(r.status == 'Success'){       
                    app.logs_to_download.shift();
                    console.log(app.logs_to_download.length)
                    document.getElementById('update_info').innerText = "Logs to download: " + app.logs_to_download.length;
                    counter++;
                    if(app.logs_to_download.length > 0){
                        if(counter < 15)app.downloadLog(app.logs_to_download[0],counter)
                        else setTimeout(function () {app.downloadLog(app.logs_to_download[0],0)},2000)
                    }
                    else {app.main()}
                }
                else console.log(r);
            })
        },
        getLog: function (matchid){
            return fetch(uri2 + 'logs/'+matchid).then(r => r.json())
        },
        main : function (){
            document.getElementById('update_info').style = 'display: none';
            app.updating = false;
            app.loading = false;
            var t1 = performance.now()
            console.log("Call took " + (t1 - t0) + " milliseconds.")
        },
        sortLogs : function (param) {
            if(param == app.logs_last_sort){app.player_logs.reverse()}
            else (
                this.player_logs.sort(function(a, b){
                    return b.stats[param]-a.stats[param]
                })
            )
            
            app.logs_last_sort = param;
        },
    },
    asyncComputed: {
        logs : function () {
            if(!this.updating){
                this.loading = true;
                return fetch(uri2 + 'logs/' +this.logs_time_range).then(r => r.json()).then(r => {
                    for(log of r){
                        const d = new Date(log.date * 1000);
                        options = {
                            year: 'numeric', month: 'numeric', day: 'numeric',
                            hour: 'numeric', minute: 'numeric',
                            hour12: false,
                            timeZone: 'Europe/Berlin' 
                        };
                        log.date = new Intl.DateTimeFormat('pl', options).format(d);
                    }
                    this.loading = false;
                    return r;
                })
            }
        },
        scores : function () {
            if(!this.updating){
                this.loading = true;
                return fetch(uri2 + 'scores/' +this.logs_time_range).then(r => r.json()).then(r => {
                    console.log(r)
                    s_ids = []
                    for(p_id in r){
                        s_ids.push(p_id)
                     }
                    for(p_id of s_ids){
                        if(app.logs_time_range == 'weekly' || app.logs_time_range == 'monthly')r[p_id].score = (r[p_id].games_won*2) - (r[p_id].games_lost*2) + (r[p_id].games_tied)
                        else r[p_id].score = (r[p_id].games_won*2) - (r[p_id].games_lost*2) + (r[p_id].games_tied)
                    }
                    r = sortObject(r,'score')
                    this.loading = false;
                    
                    return r;
                })
            }
        },
        player_logs : function(){
            if(this.show_player_info){
                return fetch(uri2 + 'player_logs/'+this.show_player_info+'?time_range='+this.logs_time_range).then(r => r.json()).then(r => {
                    this.logs_last_sort = false;
                    return r;
                })
            }
        }
    },
    created: function (){
        this.update(); 
    }
})

function sortObject(obj,param){
    var newObject = {};
        var sortable=[];
        for(var key in obj){
            if(obj.hasOwnProperty(key))sortable.push([key, obj[key]]);
            sortable.sort(function(a, b){
            return b[1][param]-a[1][param]})
        }
        return sortable; //returns array not object!
}