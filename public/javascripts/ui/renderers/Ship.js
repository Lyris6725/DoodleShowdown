class Ship {
    static textWidth = 150;
    static textHeight = 200;
    static vRatio = 0.33;
    static space = 20;
    static swaptime = 100;
    static nRipplesSprites = 5;

    constructor (title,ship,x,y,sheight,img,ripplesImg,fliped) {
        this.title = title;
        this.ship = ship;
        this.x = x;
        this.y = y;
        this.sheight = sheight;
        this.swidth = Ship.vRatio*sheight
        this.img = img;
        this.ripplesImg = ripplesImg;
        this.ripplesPos = 1;
        this.time = millis();
        if (fliped) {
            this.textOffset = this.swidth+Ship.space;
            this.imgOffset = 0;
        } else {
            this.textOffset = 0;
            this.imgOffset = Ship.textWidth+Ship.space;
        }
    }
    update(ship) {
        this.ship = ship;
    }
    draw() {
        // the text box
        fill(100,100,200);
        stroke(0);
        rect(this.textOffset+this.x,this.y,Ship.textWidth,Ship.textHeight);
        fill(255);
        textAlign(CENTER,CENTER);
        textSize(18);
        textStyle(BOLD);
        text(this.title,this.textOffset+this.x,this.y,Ship.textWidth,1*Ship.textHeight/4);
        text(this.ship.state,this.textOffset+this.x,this.y+Ship.textHeight/4,Ship.textWidth,Ship.textHeight/4);
        text("HP: "+this.ship.hp,this.textOffset+this.x,this.y+2*Ship.textHeight/4,Ship.textWidth,Ship.textHeight/4);
        text("AP: "+this.ship.ap,this.textOffset+this.x,this.y+3*Ship.textHeight/4,Ship.textWidth,Ship.textHeight/4);        
        // the image
        let ellapsed = millis() - this.time;
        if (ellapsed > Ship.swaptime) {
            this.ripplesPos++;
            if (this.ripplesPos >= Ship.nRipplesSprites) this.ripplesPos=0;
            this.time = millis();
        }
        let spriteWidth = this.ripplesImg.width/Ship.nRipplesSprites;
        image(this.ripplesImg,this.x+this.imgOffset-this.swidth*0.15,this.y-this.sheight*0.15,this.swidth*1.3,this.sheight*1.3,
             spriteWidth* this.ripplesPos, 0, spriteWidth, this.ripplesImg.height);
        image(this.img,this.x+this.imgOffset,this.y,this.swidth,this.sheight);
    }
}