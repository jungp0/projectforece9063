import * as d3 from d3;

window.onload = () => {
    console.log(1);
    put_it_all_together();
}

function put_it_all_together() {
    let container = d3
      .create('div')
      .style('width', width + 'px')
      .style('height', 0.54 * width + 'px');
    container.append(() => mandel_canvas.node()).style('float', 'left');
    container.append(() => julia_svg);
    container.append(() => c.node());
    return container.node();
}

mandel_canvas = () =>{
    let xmin = -2;
    let xmax = 0.6;
    let ymin = -1.3;
    let ymax = 1.3;
    let w = 0.5 * width;
    let canvas = d3
      .create('canvas')
      .attr('width', w)
      .attr('height', w);
    draw_mandelbrot_set(canvas.node(), xmin, xmax, ymin, ymax);
    let context = canvas.node().getContext("2d");
    context.fillStyle = "#f30";
    let ij = xy_to_ij([-1, 0], xmin, xmax, ymin, ymax, w);
    context.fillRect(ij[0] + 1, ij[1] - 1, 3, 3);
    const render = function(ij) {
      let xy = ij_to_xy(ij, xmin, xmax, ymin, ymax, w);
      // The lazy programmer's way to cover up the previous clicked point
      draw_mandelbrot_set(canvas.node(), xmin, xmax, ymin, ymax);
      context.fillRect(ij[0] + 1, ij[1] - 1, 3, 3);
  
      d3.select(julia_svg)
        .attr('c', ij_to_xy(ij, xmin, xmax, ymin, ymax, w))
        .select('image')
        .attr('xlink:href', generate_julia_im_url({ re: xy[0], im: xy[1] }));
      c.html(`c = ${d3.format('.2f')(xy[0])} + ${d3.format('.2f')(xy[1])} i`);
    };
    let clicked = false;
    canvas.on('mousedown', function() {
      clicked = true;
      render(d3.mouse(this));
    });
    canvas.on('mousemove', function() {
      if (clicked) render(d3.mouse(this));
    });
    canvas.on('mouseup', function() {
      clicked = false;
    });
  
    return canvas;
  }

  function draw_mandelbrot_set(canvas, xmin, xmax, ymin, ymax) {
    let bail = 100;
    let w = width / 2;
    let mandel_context = canvas.getContext("2d");
    let canvasData = mandel_context.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < canvas.width; i++) {
      for (let j = 0; j < canvas.height; j++) {
        var c = ij_to_xy([i, j], xmin, xmax, ymin, ymax, w);
        var it_cnt = mandelbrot_iteration_count(c[0], c[1], bail);
        var scaled_it_cnt = 255 - (255 * it_cnt) / (bail + 1);
        var idx = (i + j * canvas.width) * 4;
        canvasData.data[idx + 0] = scaled_it_cnt;
        canvasData.data[idx + 1] = scaled_it_cnt;
        canvasData.data[idx + 2] = scaled_it_cnt;
        canvasData.data[idx + 3] = 255;
      }
    }
    mandel_context.putImageData(canvasData, 0, 0);
  }

  function mandelbrot_iteration_count(cre, cim, bail = 200) {
    let x = cre;
    let y = cim;
    let xtemp;
    let ytemp;
    let cnt = 0;
    while (x * x + y * y <= 4 && ++cnt < bail) {
      xtemp = x;
      ytemp = y;
      x = xtemp * xtemp - ytemp * ytemp + cre;
      y = 2 * xtemp * ytemp + cim;
    }
    return cnt;
  }

  julia_svg = ()=>{
    let w = width / 2;
  
    const xScale = d3
      .scaleLinear()
      .domain([-2, 2])
      .range([0, w]);
    const yScale = d3
      .scaleLinear()
      .domain([-2, 2])
      .range([w, 0]);
    const rScale = d3
      .scaleLinear()
      .domain([0, 4])
      .range([0, w]);
    const pts_to_path = d3
      .line()
      .x(function(d) {
        return xScale(d[0]);
      })
      .y(function(d) {
        return yScale(d[1]);
      });
  
    let svg = d3
      .create("svg")
      .attr('width', w)
      .attr('height', w);
    if (!svg.attr('c')) {
      svg.attr('c', '-1,0');
    }
  
    // Set up the SVG background
    const mapbg = DOM.uid('mapbg');
  
    svg
      .append("defs")
      .append('pattern')
      .attr('id', mapbg.id)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', w)
      .attr('height', w)
      .append("image")
      .attr("xlink:href", generate_julia_im_url({ re: -1, im: 0 }))
      .attr('width', w)
      .attr('height', w);
  
    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", w)
      .attr("height", w)
      .attr("fill", mapbg);
  
    svg
      .on('mousemove', function() {
        svg.selectAll('.orbit').remove();
        let c = svg
          .attr('c')
          .split(',')
          .map(parseFloat);
        let xy = ij_to_xy(d3.mouse(this), -2, 2, -2, 2, w);
        let orbit = compute_orbit(c, xy);
        for (let i = 0; i < orbit.length; i++) {
          svg
            .append("path")
            .attr('class', 'orbit')
            .attr("d", pts_to_path(orbit.slice(i, i + 2)))
            .attr("stroke", "#8888FF")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .style('opacity', 0.5);
          svg
            .append("circle")
            .attr("class", 'orbit')
            .attr("cx", xScale(orbit[i][0]))
            .attr("cy", yScale(orbit[i][1]))
            .attr("r", 4)
            .attr("fill", "red")
            .attr("stroke", "none")
            .attr('fill-opacity', 0.03);
        }
        svg
          .append("circle")
          .attr("class", 'orbit')
          .attr("cx", xScale(orbit[0][0]))
          .attr("cy", yScale(orbit[0][1]))
          .attr("r", 4)
          .attr("fill", "green")
          .attr("stroke", "black")
          .attr("stroke-width", 1);
      })
      .on('mouseleave', function() {
        svg.selectAll('.orbit').remove();
      });
  
    return svg.node();
  }

  function generate_julia_im_url(c, bail = 200) {
    let w = Math.floor(width / 2);
    let context = DOM.context2d(w, w);
    context.canvas.width = w;
    context.canvas.height = w;
    let xmin = -2;
    let xmax = 2;
    let ymin = -2;
    let ymax = 2;
    let canvasData = context.createImageData(w, w);
  
    for (let i = 0; i < w; i = i + 1) {
      for (let j = 0; j < w; j = j + 1) {
        let xy = ij_to_xy([i, j], xmin, xmax, ymin, ymax, w);
        let it_cnt = julia_iteration_count(c.re, c.im, xy[0], xy[1], bail);
        let color = 255 - (255 * it_cnt) / (bail + 1);
        let idx = (i + j * w) * 4;
        canvasData.data[idx + 0] = color;
        canvasData.data[idx + 1] = color;
        canvasData.data[idx + 2] = color;
        canvasData.data[idx + 3] = 255;
      }
    }
    context.putImageData(canvasData, 0, 0);
    return context.canvas.toDataURL();
  }


function julia_iteration_count(cre, cim, x0, y0, bail) {
  let x = x0;
  let y = y0;
  let xtemp;
  let ytemp;
  let cnt = 0;
  while (x * x + y * y <= 4 && ++cnt < bail) {
    xtemp = x;
    ytemp = y;
    x = xtemp * xtemp - ytemp * ytemp + cre;
    y = 2 * xtemp * ytemp + cim;
  }
  return cnt;
}

function f(c, z) {
    let cx = c[0];
    let cy = c[1];
    let x = z[0];
    let y = z[1];
    return [x * x - y * y + cx, 2 * x * y + cy];
}

function compute_orbit(c, z0) {
    let z = z0;
    let orbit = [z0];
    let cnt = 0;
    while (z[0] * z[0] + z[1] * z[1] < 20 && cnt < 500) {
      z = f(c, z);
      orbit.push(z);
      cnt = cnt + 1;
    }
    return orbit;
}

c = d3
  .create('div')
  .style('width', width + 'px')
  .style('height', 0.033 * width + 'px')
  .style('text-align', 'center')
  .text('c = -1');

function ij_to_xy(ij, xmin, xmax, ymin, ymax, w) {
  return [
    ((xmax - xmin) / (w - 1)) * ij[0] + xmin,
    ((ymin - ymax) / (w - 1)) * ij[1] + ymax
  ];
}

function xy_to_ij(xy, xmin, xmax, ymin, ymax, w) {
    return [
      ((w - 1) * (xy[0] - xmin)) / (xmax - xmin),
      ((1 - w) * (xy[1] - ymax)) / (ymax - ymin)
    ];
}


