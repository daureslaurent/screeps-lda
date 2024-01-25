const _module = require('core/interface/_module');
const DIGITS_NUMBER = 3;

class _moduleMonitoring extends _module {
    constructor(name) {
        super(name);
    }

    banner() {
        // console.log(`=MONITOR==--- -==-- ${this.catching?'|C+|':''}[${this.name}]`)
    }

    logFromCpu(cpu) {
        console.log(this.name, '!! run() not implemented')
    }

    getNumberDigits() {
        return DIGITS_NUMBER;
    }

    getMultiplicateDigits() {
        const digits = DIGITS_NUMBER;
        if (digits < 1) {
            return 'Invalid input';
        }
        return 10 ** digits;
    }

}

module.exports = _moduleMonitoring;