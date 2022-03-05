import { useEffect } from "react";
import * as d3 from 'd3';

var globalData = null;
var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 700     - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
var x = null;
var y = null;

function CoronaLine() {

    useEffect(() => {
        chart();
    })

    return (
        <div className="col-lg-12 col-12 mb-3">
            <div className="card">
                <div className="card-header">Corona Map</div>
                <div className="card-body">
                    <div>
                    <svg id="my_dataviz" width="930" height="700"></svg>
                    </div>
                    <select onChange={update} id="select">
                        
                        <option>China</option>
                        <option>Italy</option>
                        <option>Spain</option>
                        <option>France</option>
                        <option>Germany</option>
                        <option>United Kingdom</option>
                    </select>  
                </div>
            </div>
        </div>
        
    );
}

function chart() {
    // set the dimensions and margins of the graph
    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
    //Read the data
    d3.queue()
        .defer(d3.csv, "/data/time-series-19-covid-combined.csv")
        .await(ready);
    function ready(error, data) {
        console.log("Ready loading");
        globalData = data;
        data = convertDataCumulative(data);
        // Add X axis --> it is a date format
        console.log(d3.extent(data, function(d) { return new Date(d.Date); }))
        x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return new Date(d.Date); }))
            .range([ 0, width ]);
        y = d3.scaleLinear()
            .domain( [100, 20000])
            .range([ height, 0 ]);
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickFormat(function(d) {
                console.log(d);
                return `${d.getDate()}-${d.getMonth() + 1}`
            }));
            // Add Y axis
        
        svg.append("g")
            .call(d3.axisLeft(y));
            // Add the line
        svg.append("path")
            .datum(data)
            .transition()
            .duration(1000)
            .attr("fill", "none")
            .attr("stroke", "#69b3a2")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return x(new Date(d.Date)) })
                .y(function(d) { return y(+d.newCases) })
                )
            .attr("id", "line")
        
            // Add the points
            // svg
            //     .append("g")
            //     .selectAll("dot")
            //     .data(data)
            //     .enter()
            //     .append("circle")
            //     .attr("cx", function(d) { return x(d.date) } )
            //     .attr("cy", function(d) { return y(d.value) } )
            //     .attr("r", 5)
            //     .attr("fill", "#69b3a2")

    }

    
}

function convertDataCumulative() {
    var data = globalData
        .filter(function(d,i) {
            return d.Confirmed > 100 && d.Country.localeCompare(document.getElementById('select').value) === 0;
        })
        .sort(function(a,b) {
            //
            if (a.Date.localeCompare(b.Date) !== 0) 
                return a.Date.localeCompare(b.Date);
            else if (a.State.localeCompare(b.State) !== 0)
                return a.State.localeCompare(b.State);
            else
                return a.Confirmed - b.Confirmed; 
        })
    // assuming that the data is sorted, combine frequency for cases of a country in a certain date
    data = data.filter(function(d, i) {
            if (i !== data.length - 1)
                if (data[i].Country.localeCompare(data[i + 1].Country) === 0 && data[i].Date.localeCompare(data[i + 1].Date) === 0) {
                    // var a = parseInt(data[i].Confirmed);
                    // var b = parseInt(data[i + 1].Confirmed);
                    data[i + 1].Confirmed = +data[i + 1].Confirmed + +d.Confirmed;
                    data[i + 1].Recovered = +data[i + 1].Recovered + +d.Recovered;
                    data[i + 1].Deaths = +data[i + 1].Deaths + +d.Deaths;
                    return false;
                }
            return true;
        })
    // convert to cumulative frequency over time
    data.forEach(function(d, i) {
            if (i == 0) {
                data[i].newCases = d.Confirmed;
                return;
            }
            data[i].newCases = +data[i].Confirmed - +data[i - 1].Confirmed;
        })
    return data;
}

function update() {
    var data = convertDataCumulative();
    var line = d3.select("#line");
    line
        .datum(data)
        .transition()
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) {return x(new Date(d.Date))})
            .y(function(d) { return y(+d.newCases) })
        );
}

export default CoronaLine; 