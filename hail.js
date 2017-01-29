
function onlyUniqueCategory(value, index, self) { 
  return self.indexOf(value) === index;
};

drawCustom = function(err, d) {
  drawGraph(err, d, "svg.custom-location");
}

drawGraph = function(err, d, svgSearch) {
  "use strict";

  if (err) {
    customLoadFailed();
    return;
  }
  ///// Clean data
  var data = d.result;

  // need both data and summary, and don't want to walk rollup
  // var cloneData = _.clone(data);


  // Convert dates to Date, get year
  for (var i = 0; i < data.length; i++) {
    data[i].dayDate = new Date(data[i].DAY);
    data[i].year = data[i].dayDate.getFullYear();
  }
  // Convert FCOUNT to number
  for (var i = 0; i < data.length; i++) {
    data[i].FCOUNT = +data[i].FCOUNT;
  }

  // Summarize year
  var yearTotalData = d3.nest()
    .key(function(d) {return d.year;})
    .rollup(function(v) {
      return v.map(function(o) {
        return o.FCOUNT;
      }).reduce(function(a,b) {
        return a + b;
      });
    }).entries(data);

  //////////// Graphing

  var margin = 75,
      topMargin = 10,
      width = 1000 - margin,
      height = 500 - margin;


  var svg = d3.select(svgSearch)
    .attr("width", width + margin)
    .attr("height", height + margin + topMargin);


  // Create the parts of the graph. Order matters for layer order.
  svg.selectAll('rect.year').data(yearTotalData).enter().append('rect').attr('class', 'year');
  svg.selectAll('rect.day').data(data).enter().append('rect').attr('class', 'day');
  svg.selectAll('circle.single').data(data).enter().append('circle').attr('class', 'single');
  
  // Get scales
  var time_extent = d3.extent(data, function(d) {
    return d['dayDate'];
  });
  var time_scale = d3.time.scale().range([margin, width]).domain(time_extent).nice(d3.time.year);
  var count_max = d3.max(data, function(d) {
    return d['FCOUNT'];
  });
  var count_scale = d3.scale.linear().range([height, topMargin]).domain([0, count_max]);
  
  var time_axis = d3.svg.axis().scale(time_scale).ticks(d3.time.months, 6).tickFormat(d3.time.format("%b %Y"));
  svg.append('g').attr('class', 'x axis')
    .attr('transform', "translate(0," + height + ")").call(time_axis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", "0.35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

  // y axis
  var count_axis = d3.svg.axis().scale(count_scale).orient('left');
  svg.append('g').attr('class', 'y axis')
    .attr('transform', 'translate(' + margin + ',0)').call(count_axis);
    // y axis label
  svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", margin / 2)
  .attr("x", -(height / 2))
  // .attr("dy", "1em")
  .style("text-anchor", "middle")
  .attr("class", "label")
  .text("Hail events per day");


  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "<strong>Date:</strong> <span style='color:red'>" + moment(d.dayDate).format("dddd, MMMM Do YYYY") + "</span>";
  })

  svg.call(tip);

  

  // draw daily rectangles
  svg.selectAll('rect.day').attr('x', function(d) {
    return time_scale(d['dayDate']);
  }).attr('width', 0.01)
  .attr('y', function(d) {
    return count_scale(d['FCOUNT']);
  }).attr('height', function(d) {
    return count_scale(0) - count_scale(d['FCOUNT']);
  }).attr('stroke-width', '1').attr('stroke', "red")
  .on('mouseover', tip.show)
  .on('mouseout', tip.hide);


  
  //Full year
  var total_max = d3.max(yearTotalData, function(d) {
    return d.values;
  });
  // y axis
  var total_scale = d3.scale.linear().range([height, margin]).domain([0, total_max * 4]); // 4 exists to keep these shorter by a factor of 4

  
  // draw annual total rectangles
  svg.selectAll('rect.year').attr('x', function(d) {
    return time_scale(new Date(d['key']));
  }).attr('height', function(d) {
    return total_scale(0) - total_scale(d['values']);
  }).attr('width', (time_scale(new Date("2015")) - time_scale(new Date("2014"))) * 0.9)
  .attr('y', function(d) {
    return(total_scale(d['values']))
  }).attr('fill', 'blue');

  customLoadDone($('#custom-location-form').find('button'));
}


// d3.csv("1993-2015_ColSprgs.csv", function(d) {
//   d['fcount'] = +d['fcount'];
//   d['totalYear'] = +d['totalYear'];
//   return d;
// }, draw);

// d3.json("http://www.ncdc.noaa.gov/swdiws/json/nx3hail_all/20140101:20160101/?stat=tilesum:-104.8213634,38.8338816", function (d) {
//   debugger;
// })

// source: http://www.ncdc.noaa.gov/swdiws/xml/nx3hail_all/19930101:20150101/?stat=tilesum:-104.8213634,38.8338816
// http://www.ncdc.noaa.gov/swdi/#TileSearch
// Also fun: http://www.stormersite.com/hail_reports/colorado_springs_colorado

// http://www.kktv.com/home/headlines/Damage-From-The-Hail-Storm--260216461.html
//d3.json("exampleCustomData.json", drawCustom);

// Run when load is done, on success or fail
function customLoadDone(button) {
  $(button).prop('disabled', false);
  $('#loading').addClass('hidden');
}

// Run when load is done, on success or fail
function customLoadFailed() {
  var button = $("#custom-location-form").find('button'); 
  $(button).prop('disabled', false);
  $('#loading').text('Sorry, we were unable to get the requested hail data.');
}

function drawMain(err, d) {
  drawGraph(err, d, "svg.co-sprg");
}

$(document).ready(function() {
  d3.json("/static/ColSprgs_1993_2015.json", drawMain)

  $('#custom-location-form').submit(function(event) {
    var button = $(this).find('button');
    $(button).prop('disabled', true);
    $('#loading').text('Loading...');
    $('#loading').removeClass('hidden');
    d3.select("svg.custom-location").selectAll('*').remove();

    var googleApiUrl = 'http://maps.google.com/maps/api/geocode/json?address='
    // Get from Jan 1 on start year to Dec 31 on end year
    var dateRange = $(this).find('#start-year').val() + '0101:' + $(this).find('#end-year').val() + '1231'
    var hailApiUrl = 'http://www.ncdc.noaa.gov/swdiws/json/nx3hail_all/' + dateRange + '/?stat=tilesum:'

    $.getJSON(googleApiUrl + $(this).find('#address').val())
      .done(function(data) {
        try {
          var latLong = data.results[0].geometry.location;
          d3.json(hailApiUrl + latLong.lng + ',' + latLong.lat, drawCustom);
        } catch (e) {
          customLoadFailed();
        }
      })
      .fail(function(data) {
        customLoadFailed();
      });
    
    event.preventDefault();
  })
});