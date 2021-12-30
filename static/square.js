class Square {

    constructor(id, x, y, r, lon, lat, code, sent, sent_avg) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.r = r;
        this.sent = sent;
        this.sent_avg = sent_avg;
        this.lat = lat;
        this.lon = lon;
        this.code = code;

        this.brightness = 0;
        this.clickstate = false;
        this.alpha = 0;
        this.stroke = 100;
        this.strokeweight = 1;

        this.sent_current = 0;

        //timecontrol
        this.t = 0;
        this.abst = 10;

        //overall style
        this.show = function () {
            push();

            if (this.sent_current == 0) {
                this.brightness = 0;
                this.alpha = 0;
            }

            if (this.sent_current != 0) {
                this.brightness = map(this.sent_current, -0.5, 0.5, 0, 200);
                this.alpha = map(Math.abs(this.sent_current), 0, 0.3, 0, 255);
            }
            stroke(this.stroke);
            strokeWeight(this.strokeweight);
            fill(this.brightness, this.alpha);
            rectMode(CENTER);
            rect(this.x, this.y, this.r, this.r);
            pop();

            this.sent_chg();
        };


        this.sent_chg = function () {
            push();
            fill(255);
            textSize(10);
            if (Number(this.sent_current).toFixed(2) == 0) {
                text("...", this.x - this.r / 3, this.y);
            }
            else {
                text(Number(this.sent_current).toFixed(2), this.x - this.r / 3, this.y);
            }
            pop();

            this.diff = Math.abs(this.sent_avg - this.sent_current);

            if (this.diff > 0.01) {
                if (this.sent_current > this.sent_avg) {
                    this.sent_current -= 0.01;
                }
                else if (this.sent_current < this.sent_avg) {
                    this.sent_current += 0.01;
                }
            }

        }




        //check mouse on squares
        this.intersects = function (px, py) {
            if (px > this.x - (this.r / 2) && px < this.x + (this.r / 2) && py > this.y - (this.r / 2) && py < this.y + (this.r / 2)) {
                return true;
            }
        }
        //mouse on squares style
        this.over = function () {
            this.r = r;
            // this.brightness = 255;
            // this.alpha = 255;
            if (this.clickstate) {
                this.stroke = 255;
                this.strokeweight = 1.5;
            } else {
                this.stroke = 100;
                this.strokeweight = 1.2;
            }
        }

        this.notover = function () {
            this.chag = (r - this.r) * this.t / this.abst + this.r;
            this.r = this.chag;
            this.t = this.t + 1;
            if (this.t > this.abst) {
                this.t = this.abst;
            }
        }

        this.inf = function (dis) {
            if (!this.clickstate) {
                this.chag = (dis - r) * this.t / this.abst + r;
                this.r = this.chag;
                this.t = this.t + 1;
                if (this.t > this.abst) {
                    this.t = this.abst;
                }
                // this.brightness = 0;
                // this.alpha = 10;
            }
        }

        //click style
        this.clicked = function () {
            if (this.clickstate) {
                this.clickstate = false;
            } else {
                this.clickstate = true;
            }
        }


    }
}
