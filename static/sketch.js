grid = codegrid.CodeGrid(); // add country_detector
let img;
let mouseoverstate = false;
let pts = [];  // for link
let data_st; // initialize
let data_ed; // initialize
let sq_length = 0;
let send_count = 0;

function preload() {
    mapimg = loadImage("https://api.mapbox.com/styles/v1/mapbox/dark-v9/static/0,0,1/1024x512?access_token=pk.eyJ1IjoiaHVsa21hIiwiYSI6ImNrd2ljN3o0cjE2aWgycG11NmJvaWJ4MHUifQ.Ve1W7M0sPwfdCtSK5dbzeA");
}


function setup() {
    print("setup ready")
    frameRate(60);

    initialize_sent();

    // let windowWidth = 2048;
    let windowHeight = windowWidth / 2;
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0, 0);
    bgcolor = 15;

    // append squares
    scl = windowWidth / 1024;
    interval = 15;
    r = interval * scl;
    squares = append_squares(scl, interval, windowWidth);
    sq_length = Object.keys(squares).length

    //send_data
    myData = squares;
    send_data(myData);
}


function draw() {
    // default squares

    // update squares
    if (data_st != data_ed && (frameCount % 60 == 0)) {
        data_st = data_ed;
        refresh_squares(data_st);
        if(send_count != 0){ //avoid intialize
            console.log("refreshing");
            send_data(myData);
        }
        console.log("refreshing times", send_count);
        send_count += 1;
    }

    background(bgcolor);
    translate(width / 2, height / 2);

    //map
    imageMode(CENTER);
    // image(mapimg, 0, 0);
    if (frameCount < 2) {
        mapimg.resize(windowWidth, windowWidth / 2);
    }


    mouseOver();
    // connect();

    ellipse(mouseX - width / 2, mouseY - height / 2, 8, 8);

    push();
    for (squa of squares) {
        squa.show();
    }
    pop();

    //framecount
    push();
    fill(255);
    text(Number(frameCount/60).toFixed(1), 0, height / 2 - 10)
    pop();
}

function initialize_sent() {
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: 'http://127.0.0.1:5000/getjs_st',
        dataType: 'json',

        success: function (data) {
            console.log("intial sent data received");
            data_ed = data;
        },
        error: function (data) {
            alert("fail to receive intial data");
        }

    });
}

function send_data(myData) {
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: 'http://127.0.0.1:5000/getjs',
        dataType: 'json',
        data: JSON.stringify(myData),

        success: function (data) {
            console.log("data received");
            data_ed = JSON.parse(data);
        },
        error: function (data) {
            alert("fail to receive data");
        }

    });
}

function append_squares(scl, interval, windowWidth) {
    let squares = []
    let r = interval * scl;
    let cx = mercX(0);
    let cy = mercY(0);
    let id = 0;
    for (var i = 1 / 2; i < 512; i += interval) {
        for (var j = 1 / 2; j < 1024; j += interval) {
            let lon = rmercX(j + cx - 512);
            let lat = rmercY(i + cy - 256);
            let code = geo(lat, lon);
            let sent = 0;
            let sent_avg = 0;

            //rough search
            let rou = 0.1 * scl;
            if (code == 'None') {
                for (i1 = -1; i1 < 2; i1++) {
                    for (j1 = -1; j1 < 2; j1++) {
                        // add pint in country
                        let lon_s = rmercX(j + cx - 512 + j1 * rou);
                        let lat_s = rmercY(i + cy - 256 + i1 * rou);
                        if (geo(lat_s, lon_s) != 'None') {
                            code = geo(lat_s, lon_s);
                        }
                    }

                }
            }

            let x = j * scl - windowWidth / 2;
            let y = i * scl - windowWidth / 4;

            if (code != 'None' && code) {
                let squa = new Square(id, x, y, r, lon, lat, code, sent, sent_avg);
                id += 1;
                squares.push(squa);
            }
        }
    }
    console.log("unit numbers =", id);
    return squares;
}

function refresh_squares(data_json) {
    for (let i = 0; i < sq_length; i++) {
        let rows_sameid = data_json.filter(function (data) {
            return data.raw_id == i;
        });
        // add to squares
        let id_sent_ttl = 0;
        let id_sent_avg = 1;
        let count = 1;
        $.each(rows_sameid, function () {
            if (this.sentiment != 0) {
                id_sent_ttl += this.sentiment;
                count += 1;

            }
        });

        id_sent_avg = id_sent_ttl / count;
        squares[i].sent = (Math.round(float(id_sent_ttl) * 100) / 100).toFixed(2);
        squares[i].sent_avg = (Math.round(float(id_sent_avg) * 100) / 100).toFixed(2);
    }
}



function mousePressed() {
    let mouse_code
    for (squa of squares) {
        if (squa.intersects(mouseX - width / 2, mouseY - height / 2)) {
            mouse_code = squa.code;
            print("country code is",mouse_code);
            print("geolocation:\n",squa.lat, squa.lon);
            print("sentiment index:",squa.sent_avg);
        }
    }

    for (squa of squares) {
        if (squa.code == mouse_code) {
            squa.clicked();
            pts.push(squa);
        }

    }

}

function mouseOver() {

    //check mouse in canvas
    if (mouseX < width && mouseX > 0 && mouseY < height && mouseY > 0) {
        if (!mouseoverstate) {
            for (squa of squares) {
                squa.t = 0;
            }
        }
        mouseoverstate = true;


    } else {
        //check mouse out canvas
        if (mouseoverstate) {
            for (squa of squares) {
                squa.t = 0;
            }
        }
        mouseoverstate = false;

    }




    if (mouseoverstate) {
        let code_mouse;
        //Influence squares
        for (q of squares) {
            let dis = (r / 3) + (abs((dist(q.x, q.y, mouseX - width / 2, mouseY - height / 2) - (3 * r))) ^ 2) / (3 * r);
            if (dis > r) {
                dis = r;
            }
            if (dist(q.x, q.y, mouseX - width / 2, mouseY - height / 2) < 60) {
                dis = dis * 2;
            }
            q.inf(dis);
        }

        //check nation
        for (squa of squares) {
            if (squa.intersects(mouseX - width / 2, mouseY - height / 2)) {
                code_mouse = squa.code;
                squa.over();
            }
        }
        if (code_mouse) {
            for (squa of squares) {
                if (squa.code == code_mouse) {
                    squa.over();
                }

            }
        }


    }

    if (!mouseoverstate) {
        for (squa of squares) {
            squa.notover();
        }
    }

}

function connect() {

    for (let i = 0; i < pts.length; i++) {
        if (i % 2 != 0 && i > 0) {
            push();
            strokeWeight(4);
            // line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
            pbezier(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, 0);
            pop();
        }
        if (i % 2 == 0 && i == (pts.length - 1)) {
            pbezier(pts[i].x, pts[i].y, mouseX - width / 2, mouseY - height / 2, 1);
        }
    }

}

function pbezier(x1, y1, x2, y2, dash) {

    let d = (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))) * 1.5;
    let x3 = 0;
    let y3 = 0;


    if (x2 > x1) {
        x3 = x2 - d * (y1 - y2) / Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        y3 = y2 + d * (x1 - x2) / Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

    } else {
        x3 = x2 + d * (y1 - y2) / Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        y3 = y2 - d * (x1 - x2) / Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

    }

    let x4 = x3 - x2 + x1;
    let y4 = y3 - y2 + y1;

    push();
    stroke(255);
    strokeWeight(1);
    noFill();
    beginShape();
    if (dash == 1) {
        drawingContext.setLineDash([4, 5]);
    }
    curveVertex(x4, y4);
    curveVertex(x1, y1);
    curveVertex(x2, y2);
    curveVertex(x3, y3);
    endShape();
    pop();
}

// function windowResized() {

//     //!should be translation approach (later)
//     resizeCanvas(windowWidth, windowHeight);
//     num = squares.length;
//     squares.splice(0, num);

//     r = windowWidth / 60;
//     let row = int(windowHeight / r);
//     let column = int(windowWidth / r);


//     for (var i = 0; i < row; i++) {
//         for (var j = 0; j < column; j++) {
//             let x = r / 2 + j * r;
//             let y = r / 2 + i * r;
//             let squa = new Square(x, y, r);
//             squares.push(squa);
//         }

//     }
// }

function geo(lat, lng) {
    grid.getCode(lat, lng, function (err, code) {
        var msg;
        if (err) {
            msg = err;
        } else {
            msg = "Calling getCode(" + lat + "," + lng + ") returned: " + code;
        }

        result = code;
    });
    return result;

}


//projection coordinate
function mercX(lon) {
    lon = radians(lon);
    var a = (256 / PI) * pow(2, 1);
    var b = lon + PI;
    return a * b;
}

function mercY(lat) {
    lat = radians(lat);
    var a = (256 / PI) * pow(2, 1);
    var b = tan(PI / 4 + lat / 2);
    var c = PI - log(b);
    return a * c;
}

function rmercX(x) {
    var a = (x * PI) / (256 * pow(2, 1)) - PI;
    return a * 180 / PI;
}

function rmercY(y) {
    var a = PI - (y * PI / 256) / pow(2, 1);
    var b = pow(Math.E, a);
    var c = Math.atan(b);
    var d = (4 * c - PI) / 2;
    return d * 180 / PI;

}