const DEFAULT_FONT = 0.4;
const styleLed = {
    radius: 0.2,
    fill: '#b75353',
    opacity: 0.7,
}
const DEFAULT_STYLE_TITLE = {
    color: '#ffffff',
    font: DEFAULT_FONT,
    align: 'left',
    opacity: 0.6,
    stroke: '#000000FF',
}
const DEFAULT_STYLE_LINE = {
    color: '#000000',
    font: DEFAULT_FONT,
    align: 'left',
    opacity: 0.7,
    /*stroke: '#000000FF'*/
}
const CHUNK_SIZE = 50;

class VisualUiBox {

    /**
     * @param roomVisual {RoomVisual}
     * @param pos {RoomPosition}
     */
    constructor(roomVisual, pos) {
        this.roomVisual = roomVisual;
        this.pos = pos;

        this.width = 8; //largeur
        this.height = 10; //hauteur

        this.font = .4;
        this.space = this.font + .05;

        this.style = {}
        this.styleBox = {
            /*fill: 'transparent',*/
            stroke: '#000000',
        }
        this.title = undefined;
        this.setTitle('Win box')
        this.titleOffset = .2;
        this.titleBoxOffset = .3;


        this.datas = [];
        this.leds = [];
        this.ledXOffset = -.3;
        this.ledYOffset = .3;
        this.ledSpace = -.5;
    }

    addLine(txt, style) {
        const styleEnd = !style ?
            DEFAULT_STYLE_LINE : style;
        this.datas.push({
            txt: String(txt),
            style: styleEnd,
        });
    }

    addLineChunk(txt, style) {
        if (txt.length >= CHUNK_SIZE) {
            const chunks = txt.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [];

            chunks.forEach(chunk => {
                this.addLine(chunk, style);
            });
        } else {
            this.addLine(txt, style);
        }
    }

    setTitle(txt, style) {
        const styleEnd = !style ?
            DEFAULT_STYLE_TITLE : style;
        this.title = {
            txt: txt,
            style: styleEnd,
        }
    }

    addLed(color) {
        this.leds.push({
            color: color,
        });
    }

    draw() {
        this.width = this.getMaxTxt();
        const afterLine = (this.space * this.datas.length) + (this.space + .1) +
            (this.title !== undefined ? this.titleBoxOffset : 0);
        this.roomVisual.rect(this.pos.x, this.pos.y, this.width, afterLine, this.styleBox);

        let ledWidth = this.ledXOffset;
        this.leds.forEach(led => {
            const style = styleLed;
            if (led.color) {
                style.fill = led.color;
            }
            this.roomVisual.circle(
                this.pos.x + (this.width + ledWidth),
                this.pos.y + this.ledYOffset,
                style,
            );
            ledWidth += this.ledSpace;
        })

        let lineSpace; /* = this.space;*/
        if (this.title !== undefined) {
            lineSpace = this.space;
            this.roomVisual.text(
                this.title.txt,
                this.pos.x + 0.2,
                this.pos.y + lineSpace,
                this.title.style);
            if (this.datas.length > 0) {
                lineSpace += this.titleOffset;
            }
        }

        this.datas.forEach(line => {
            lineSpace += this.space;
            this.roomVisual.text(
                line.txt,
                this.pos.x + 0.2,
                this.pos.y + lineSpace,
                line.style);
        })
    }

    getMaxTxt() {
        const datas = Array.from(this.datas);
        if (datas.length === 0) {
            return this.getStringWidth(this.title.txt)
            // return (this.title.txt.length / (this.font * 10))
            //     + ((this.leds.length) * (-this.ledSpace)) + (-this.ledXOffset);
        }
        let maxWidth = this.getStringWidth(this.title.txt);

        for (let i = 1; i < datas.length; i++) {
            const width = this.getStringWidth(datas[i].txt)
            if (width > maxWidth) {
                maxWidth = width;
            }
        }

        return maxWidth + 0.2;
        // return longestString.length > 0
        //     ? longestString.length / (this.font * 10)
        //     : 5;
    }

    /**
     *
     * @param str {string}
     * @param charWidth
     * @return {number}
     */
    getStringWidth(str, charWidth = 0.5) {
        let width = 0;
        const big = 0.5
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '[' || char === ']' || char === '(' || char === ')') {
                width += 0.2 * charWidth;
            } else if (char === ' ') {
                width += big * charWidth;
            } else if (Number.isInteger(Number(char))) {
                width += big * charWidth;
            } else if (char.toUpperCase() === char) {
                width += big * charWidth;
            } else {
                width += 0.3 * charWidth;
            }
        }
        return width;
    }

}

module.exports = VisualUiBox;