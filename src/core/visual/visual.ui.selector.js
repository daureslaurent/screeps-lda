class VisualUiSelector {

    /**
     * @param roomVisual {RoomVisual}
     * @param pos {RoomPosition}
     * @param flagNameSelector {string}
     */
    constructor(roomVisual, pos, flagNameSelector) {
        this.roomVisual = roomVisual;
        this.pos = {
            x: pos.x - .5,
            y: pos.y - .5,
        }

        this.width = 1; //largeur
        this.height = 1; //hauteur

        this.styleBox = {
            /*fill: 'transparent',*/
            stroke: '#000000',
        }

        this.flagNameSelector = flagNameSelector;
        this.selectors = [];
    }

    addSelector(value, style) {
        this.selectors.push({
            value: value,
            style: style,
        });
    }

    setTitle(txt, style) {
        this.title = {
            txt: txt,
            style: style,
        }
    }

    getValue() {
        if (this.flagNameSelector) {
            const flagSelect = Game.flags[this.flagNameSelector].pos;
            const target = {
                x: flagSelect.x - .5,
                y: flagSelect.y - .5,
            }
            const ret = this.selectors.filter((select, index) => {
                const look = {
                    x: this.pos.x + index,
                    y: this.pos.y,
                }
                return target.x === look.x && target.y === look.y;
            })
            if (ret.length > 0) {
                return ret[0].value
            }
        } else {
            return 0;
        }
    }

    draw() {
        this.width = this.selectors.length > 0 ?
            this.selectors.length :
            1;

        this.roomVisual.rect(this.pos.x, this.pos.y, this.width, this.height, this.styleBox);

        this.selectors.forEach((selector, index) => {
            this.roomVisual.rect(this.pos.x + (index) + 0.25, this.pos.y + .25, .5, .5,
                selector.style);
        })
    }

}

module.exports = VisualUiSelector;