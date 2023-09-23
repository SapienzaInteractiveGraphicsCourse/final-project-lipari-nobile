window.addEventListener('keyup', function (event) {
    Key.onKeyup(event);
}, false);

window.addEventListener('keydown', function (event) {
    Key.onKeydown(event);
}, false);

window.addEventListener('keydown', function (event) {
    // prevent escape character to exit the modal
    event.preventDefault();
    const modal = document.getElementById("options");
    if (event.key === "Escape") {
        modal.open ? modal.close() : modal.showModal();
    } 
    
})

var Key = {
    _pressed: {},

    A: 65,
    W: 87,
    D: 68,
    S: 83,
    SPACE: 32,

    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },

    onKeydown: function (event) {
        this._pressed[event.keyCode] = true;
    },

    onKeyup: function (event) {
        delete this._pressed[event.keyCode];
    }
};

export default Key;