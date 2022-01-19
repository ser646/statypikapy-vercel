//const uri = "https://statypikapy.vercel.app/api";
const uri = "http://localhost:3000/api";

//[U:1:111270195]
fetch(`${uri}/player_logs/[U:1:60952177]?time_range=all&limit=50`).then(r => r.json()).then(r =>{
    kills = []
    kd = []
    ids = []
    for(log of r){
        kills.push(log.stats.kills)
        kd.push(log.stats.kpd)
        ids.push("_id:"+log._id)
    }
    options.series[0].data = kd.reverse()
    console.log(ids)
    options.xaxis.categories = ids.reverse()
    console.log(kd)
    var chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();

})

var options = {
    chart: {
      type: 'line',
      height: '400px', 
      //width: '800px'
    },
    series: [{
      name: 'Kills',
      data: []
    }],
    xaxis: {
        categories: [],
        labels: {
        show: false
      }  
    },
    stroke: {
        show: true,
        curve: 'straight',
        width: 2
    }
  }
  

  
 