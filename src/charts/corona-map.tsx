import * as d3 from 'd3';
import React, { useEffect } from "react";

function CoronaMap() {

	useEffect(() => {
		corona();
	})

    return(
        <div className="col-lg-12 col-12 mb-3">
            <div className="card">
                <div className="card-header">Corona Map</div>
                <div className="card-body">
                    <div>
                        <svg id="corona-map" width="1200" height="500"></svg>
                    </div>
                </div>
            </div>
        </div>
    )
}

const corona = () => {
    // The svg
    var svg_corona = d3.select("#corona-map"),
        width = +svg_corona.attr("width"),
        height = +svg_corona.attr("height");
    
    // Map and projection
    var projection = d3.geoMercator()
        .center([0,20])                // GPS of location to zoom on
        .scale(99)                       // This is like the zoom
        .translate([ width/2, height/2 ])
    var pathGenerator = d3.geoPath().projection(projection);
    var spanConfirmed = " <span style='color:#FFFF8F;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;'>";
    var spanRecovered = " <span style='color:#C0E055;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;'>";
    
    var tooltip = d3.select("#root")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("background-color", "rgba(255, 255, 255, 0.7)")
        .style("clip-path", "polygon(0 10%, 10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10% )")
        .style("border-style", "solid");

    
    d3.queue()
    .defer(d3.csv, "/data/corona.csv")
    .await(ready);
    function ready(error: any, data: any) {
		var worldMap = require("../assets/maps/world-map-min.json")
        // Add a scale for bubble size
        var extent: any = d3.extent(data, (d: any) => { return +d.confirmed; })
        var size = d3.scaleSqrt()
            .domain(extent)  // What's in the data
            .range([ 1, 50])  // Size in pixel
        
        // Draw the map
        svg_corona.append("g")
            .selectAll("path")
            .data(worldMap.features)
            .enter()
            .append("path")
                .attr("fill", "#b8b8b8")
                .attr("name", (d: any) => {return d.properties.ADMIN})
                .attr("d", (d: any) => pathGenerator(d))
                .style("stroke", "none")
                .style("opacity", .3)
        
        // Add circles:
        
        data = data.sort( (a: any, b: any) => { return +b.confirmed - +a.confirmed })
                    .filter((d: any,i: number) => {return d.confirmed > 10 && d.recovered > 0});
        const max = data[0];
        const min = data[data.length - 1];
        var enterCircle = svg_corona
            .selectAll("myCircles")
            .data(data);

        enterCircle.enter()
            .append("circle")
            .attr("class", "mainCircle")
            .attr("cx", (d: any) => projection([+d.longitude, +d.latitude])![0])
            .attr("cy", (d: any) => projection([+d.longitude, +d.latitude])![1])
            .style("fill", "green")
            .attr("stroke-width", 1)
            .attr("fill-opacity", .8)
            .attr("r", 0)
            .transition().delay((d, i: number) => {return i * 10;}).duration(150)
            .attr("r", (d, i: number) => {return size(scaleRecovered(d))})
        enterCircle.enter()
            .append("circle")
                .attr("cx", (d: any) => projection([d!.longitude!, d!.latitude!])![0])
                .attr("cy", (d: any) => projection([+d.longitude, +d.latitude])![1])
                .attr("r", (d) => { return size(scaleConfirmed(d))})
                .style("fill", "yellow")
                .attr("stroke-width", 1)
                .attr("fill-opacity", .5)
                .on("mouseover", (d: any) => {
                        tooltip.html(d.location + spanConfirmed + d.confirmed + "</span>" + spanRecovered + d.recovered + "</span>")
                        .style("visibility", "visible");
                        }
                    )
                .on("mousemove", () => {return tooltip.style("top",
                        (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                .on("mouseout", () => {return tooltip.style("visibility", "hidden");})
                .attr("r", 0)
                .transition().delay((d,i) =>  {return i * 10;}).duration(150)
                .attr("r", (d) => {return size(scaleConfirmed(d))})
        // Add title and explanation
        svg_corona
            .append("text")
            .attr("text-anchor", "end")
            .style("fill", "black")
            .attr("x", width - 10)
            .attr("y", height - 30)
            .attr("width", 90)
            .html("CORONA MAP")
            .style("font-size", 14)
    
    
        // --------------- //
        // ADD LEGEND //
        // --------------- //
        
        // Add legend: circles
        var valuesToShow = [ {radius: 150000, color: "#FFFF8F", text: "Cases"}, {radius: 40000, color: "#9ACD34", text: "Recovered"}]
        var xCircle = 40
        var xLabel = 90
        svg_corona
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", (d) => {return height - size(d.radius) } )
            .attr("r", (d) => { return size(d.radius) })
            .style("fill", (d) => { return d.color;})
            .attr("stroke", "black")
        
    
        // Add legend: segments
        svg_corona
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', (d) => { return xCircle + size(d.radius) } )
            .attr('x2', xLabel)
            .attr('y1', (d) => { return height - size(d.radius) } )
            .attr('y2', (d) => { return height - size(d.radius) } )
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'))
    
        // Add legend: labels
        svg_corona
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel)
            .attr('y', (d) => { return height - size(d.radius) } )
            .text( (d) => { return d.text } )
            .style("font-size", 10)
            .attr('alignment-baseline', 'middle')
    }
    function scaleConfirmed(d: any) {
        //return 399999 * ((d.confirmed - min.confirmed) / (max.confirmed - min.confirmed)) + 300;
        return d.confirmed /2 + 200;
    }
    
    function scaleRecovered(d: any) {    
        return d.recovered /2 + 200;
        //return 399999 * ((+d.recovered - min.confirmed) / (max.confirmed - min.confirmed)) + 300;
    }
}

export default CoronaMap;