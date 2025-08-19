export class InputHandler {
    constructor() {
        this.keyMap = new Map();
        this.setupDefaultControls();
    }

    setupDefaultControls() {
        this.keyMap.set('w', 'moveUp');
        this.keyMap.set('s', 'moveDown');
        this.keyMap.set('a', 'moveLeft');
        this.keyMap.set('d', 'moveRight');
        this.keyMap.set(' ', 'attack');
    }

    bind(game) {
        $(document).on('keydown', (e) => {
            const action = this.keyMap.get(e.key.toLowerCase());
            if (action) {
                e.preventDefault();
                this.handleAction(action, game);
            }
        });
    }

    handleAction(action, game) {
        switch (action) {
            case 'moveUp':
                game.moveHero(0, -1);
                break;
            case 'moveDown':
                game.moveHero(0, 1);
                break;
            case 'moveLeft':
                game.moveHero(-1, 0);
                break;
            case 'moveRight':
                game.moveHero(1, 0);
                break;
            case 'attack':
                game.attack();
                break;
        }
    }

    unbind() {
        $(document).off('keydown');
    }
}