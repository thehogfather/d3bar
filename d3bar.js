/**
 *
 * @author Patrick Oladimeji
 * @date 10/14/13 15:21:21 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, module, $, property, self */

(function () {
    "use strict";
    var pad = 50;
    function property(v) {
        var p = function (_) {
            if (!arguments.length) {
                return v;
            }
            return this;
        };
        return p;
    }
    /**
        Data can be a 2d array. If this is the case, then each child array represents a dataset for the bar chart
    */
    function bar(data) {
        if (data instanceof Array && !(data[0] instanceof Array)) { data = [data]; }

        var fill = '#76d', axisfont = 'bold 8px sans-serif', gap = 2;
        bar.margin = property.call(bar, {top: 20, left: 45, right: 200, bottom: 50});
        bar.width = property.call(bar, 600);
        bar.height = property.call(bar, 300);
        bar.ylabel = property.call(bar, "");
        bar.xlabel = property.call(bar, "");
        bar.label = property.call(bar, "");
        bar.data = property.call(bar, data || []);
        //legend is an array of names to use for each group.
        //the length of the legend should be the same as the length of the 2d array
        bar.legend = property.call(bar, []);
        bar.legendheight = property.call(bar, 20);

        bar.xdata = property.call(bar, function (d) {
            return d.value;
        });
        bar.ydata = property.call(bar, function (d) { return d.N; });
        //error bar is a function that returns the height of the errorbar to use for each data
        bar.errorbar = property.call(bar, undefined);

        bar.fill = property.call(bar, function (d) { return fill; });

        bar.rectClicked = property.call(bar, function (d, i) {  });
        bar.barSpace = property.call(bar, 0);
        bar.groupSpace = property.call(bar, 10);
        //specifies whether or not text is shown on top of bars would usually return
        bar.columnText = property.call(bar, undefined);
        bar.showXAxis = property.call(bar, true);
        bar.showYAxis = property.call(bar, true);

        bar.render = function (id) {
            id = id || "body";
            var margin = bar.margin();
            var xfield = bar.xdata(), yfield = bar.ydata(), fillfunc = bar.fill();

            var ymax = d3.max(bar.data(), function (d) {
                return d3.max(d, function (n) {
                    if (bar.errorbar()) {
                        return bar.errorbar()(n) + yfield(n);
                    }
                    return yfield(n);
                });
            });
            //padding is a function of the length of the yaxis label
            var yrange = [0, ymax], bspace = bar.barSpace(), gspace = bar.groupSpace();
            var xdomain = bar.data()[0].map(xfield);
            var x = d3.scale.ordinal().rangeRoundBands([0, bar.width()], 0.15).domain(xdomain);
            var y = d3.scale.linear().range([0, bar.height()]).domain(yrange);
            var yaxisscale = d3.scale.linear().range([bar.height(), 0]).domain(yrange);
            var vis = d3.select(id).append("svg:svg")
                .attr("width", bar.width() + margin.left + margin.right)
                .attr("height", bar.height() + margin.top + margin.bottom);
            var gw = x.rangeBand(), bw = gw / bar.data().length;
            var g = vis.append("svg:g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            var bgs = g.selectAll("g.bargroup").data(bar.data()[0]).enter()
                    .append("g").attr("class", "bargroup").attr("transform", function (d, i) {
                        return "translate(" + x(xfield(d, i)) + ")";
                    });
            var rectGroup = bgs.selectAll("g.rectgroup").data(function (d, i) {
                return bar.data().map(function (a) {
                    return a[i];
                });
            }).enter().append("g").attr("transform", function (d, i) {
                return "translate(" + (i * bw) + ")";
            });
            rectGroup.append("svg:rect").attr("width", bw - bspace)
                .attr("height", function (d, i) {
                    return y(yfield(d, i));
                }).attr("y", function (d, i) {
                    return bar.height() - y(yfield(d, i));
                }).attr("class", 'bar')
                .style("fill", fillfunc).style('stroke', function (d, i) {
                    return d3.rgb(fillfunc(d, i)).darker();
                }).on("click", bar.rectClicked()).append("title").text(function (d, i) {
                    return "x: " + xfield(d, i) + " y:" + yfield(d, i);
                });
            //if there is error bar function draw the error bars
            if (bar.errorbar()) {
                var errorbar = bar.errorbar();
                var bars = bgs.selectAll('line.errorbar').data(function (d, i) {
                    return bar.data().map(function (a) {
                        return a[i];
                    });
                }).enter();
                bars.append('line')
                    .attr("x1", function (d, i) {
                        return i * bw + (bw - bspace) / 2;
                    })
                    .attr("y1", function (d, i) {
                        var ebh = y(errorbar(d, i));//error bar height
                        return isNaN(ebh) ? 0 : bar.height() - y(yfield(d, i)) + ebh;
                    }).attr("x2", function (d, i) {
                        return i * bw + (bw - bspace) / 2;
                    })
                    .attr("y2", function (d, i) {
                        var ebh = y(errorbar(d, i));
                        return isNaN(ebh) ? 0 : bar.height() -  y(yfield(d, i)) - ebh;
                    })
                    .style("fill", "none")
                    .style("stroke", "#a22").style("stroke-width", 0.5);
                //bar hat
                bars.append('line')
                    .attr("x1", function (d, i) {
                        return i * bw + (bw - bspace) / 2  + bw / 4;
                    }).attr("x2", function (d, i) {
                        return i * bw + (bw - bspace) / 2  - bw / 4;
                    }).attr("y1", function (d, i) {
                        var ebh = y(errorbar(d, i));//error bar height
                        return isNaN(ebh) ? 0 : bar.height() - y(yfield(d, i)) + ebh;
                    }).attr("y2", function (d, i) {
                        var ebh = y(errorbar(d, i));//error bar height
                        return isNaN(ebh) ? 0 : bar.height() - y(yfield(d, i)) + ebh;
                    }).style("fill", "none")
                    .style("stroke", "#a22").style("stroke-width", 0.5);

                //bar bottom
                bars.append('line')
                    .attr("x1", function (d, i) {
                        return i * bw + (bw - bspace) / 2  + bw / 4;
                    }).attr("x2", function (d, i) {
                        return i * bw + (bw - bspace) / 2  - bw / 4;
                    }).attr("y1", function (d, i) {
                        var ebh = y(errorbar(d, i));
                        return isNaN(ebh) ? 0 : bar.height() -  y(yfield(d, i)) - ebh;
                    }).attr("y2", function (d, i) {
                        var ebh = y(errorbar(d, i));
                        return isNaN(ebh) ? 0 : bar.height() -  y(yfield(d, i)) - ebh;
                    }).style("fill", "none")
                    .style("stroke", "#a22").style("stroke-width", 0.5);
            }

            //if there is a column text draw it
            if (bar.columnText()) {
                var colText = bar.columnText();
                rectGroup.append("text")
                    .text(colText)
                    .attr("y", function (d, i) {
                        return bar.height() - y(yfield(d, i));
                    }).attr("x", bw / 2)
                    .attr("dy", "-10")
                    .style("text-anchor", "middle")
                    .style("alignment-baseline", "text-after-edge");
            }

            if (bar.showYAxis()) {
                var yaxis = d3.svg.axis().scale(yaxisscale).orient('left');
                g.append("svg:g")
                    .attr("class", "y axis")
                    .call(yaxis);
            }
            if (bar.showXAxis()) {
                var xaxis = d3.svg.axis().scale(x).tickSubdivide(true);
                var xg = g.append("svg:g")
                    .attr("class", 'x axis')
                    .attr("transform", "translate(0," + bar.height() + ")")
                    .call(xaxis);
                xg.selectAll("text").remove();
                //overriding the labels drawn by the svg.axis here so we can use word wrapping
                bgs.append("foreignObject")
                    .attr("width", gw).attr("height", 100)
                    .attr("x", 0).attr("y", bar.height() + 5)
                    .append("xhtml:body")
                    .style("text-align", "center")
                    .style("padding", 0).style("margin", 0)
                    .append("p").html(function (d, i) {
                        return xfield(d, i);
                    });
            }

            //render labels
            vis.append("g").attr("transform", "translate(" + margin.left + ")")
                .append("text")
                .text(bar.label()).attr("x", bar.width() / 2).attr("class", "chartlabel")
				.style("alignment-baseline", "text-before-edge").style("text-anchor", "middle");
            vis.append("g").attr("transform", "translate(" + margin.left + "," + (bar.height() + margin.top + margin.bottom / 2) + ")")
                .append("text").text(bar.xlabel()).style("text-anchor", "middle").style("alignment-baseline", "text-after-edge")
                .attr("class", "axislabel").attr("x", bar.width() / 2);

            vis.append("g").attr("transform", "translate(0," + margin.top + ")").append("text").text(bar.ylabel())
                .style("text-anchor", "middle").style("alignment-baseline", "text-before-edge")
                .attr("class", "axislabel").attr("x", 0).attr("y", bar.height() / 2)
                .attr("transform", "rotate(-90 0 " + (bar.height() / 2) + ")");

            //render legend if any
            if (bar.legend() && bar.legend().length > 0) {
                var keys = vis.append("g").attr('transform', 'translate(' + (pad + bar.width()) + ")")
                    .selectAll('g.key').data(bar.legend()).enter()
                    .append("g").attr("transform", function (d, i) {
                        return "translate(0, " + (pad + bar.legendheight() * i) + ")";
                    });

                keys.append("svg:rect").attr("width", bar.legendheight() * 0.75).attr("height", bar.legendheight() * 0.75)
                    .style('fill', fillfunc).style('stroke', function (d, i) {
                        return d3.rgb(fillfunc(d, i)).darker();
                    });
                keys.append("svg:text").attr("x", bar.legendheight())
                    .attr("y", bar.legendheight() / 2)
                    .text(String).style("alignment-baseline", 'text-after-edge')
                    .style("font-size", (0.65 * bar.legendheight()) + "px");
            }
            return vis;
        };
        return bar;
    }

    if (typeof module === "undefined") {
        self.bar = bar;
    } else {
        module.exports = bar;
    }
}());
