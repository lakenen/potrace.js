
var image = new Image();
image.onload = function () {
    potrace(image);
};
image.src = 'signature.png';
document.body.appendChild(image);