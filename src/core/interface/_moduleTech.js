class _moduleTech {
    /**
     *
     * @param name {string}
     */
    constructor(name) {
        this.name = name + 'ModuleTech';
        console.log('construct module Tech', this.name)
    }

    /**
     *
     * @returns {[Action]|void}
     */
    execute() {
        // console.log('==========--- -==')
        this.banner();
        this.preRun();
        this.run();
        this.afterRun();

    }

    banner() {
        // console.log(`=TECH=====--- -==-- [${this.name}]`)
    }

    preRun() {

    }

    afterRun() {

    }

    run() {
        console.log(this.name, '!! run() not implemented')
    }

}

module.exports = _moduleTech;