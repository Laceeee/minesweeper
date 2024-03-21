// Gamemodes:
const beginner = [9, 9, 10];
const intermediate = [16, 16, 40];
const expert = [30, 16, 99];
// Order: [width or x or xCord, height or y or yCord, mines count]

const scale = 2;
const tileSize = 15 * scale;
const canvas = document.getElementById("map");
const context = canvas.getContext("2d");
const gameButton = document.getElementById('gameButton');

let gamemode = expert;
let gameOver = false;
let isMouseDown = false;
let minesLeft;
let map;

let remainingCoordinates;
let revealedCoordinates;
let flaggedCoordinates;
let minesCoordinates;
function generateMap(coordinates) {
    let width = gamemode[0];
    let height = gamemode[1];
    let map = Array(height).fill(null).map(() => Array(width).fill(0));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            remainingCoordinates.add(`${x}-${y}`);
        }
    }
    generateMines(map, gamemode[2], width, height, coordinates);
    setNumbersForTiles(map);
    return map;
}

function generateMines(map, mines, width, height, coordinates) {
    let noMines = new Set();
    let noMineX = coordinates[0];
    let noMineY = coordinates[1];

    for (let y = noMineY - 1; y <= noMineY + 1; y++) {
        for (let x = noMineX - 1; x <= noMineX + 1; x++) {
            if (x >= 0 && x < gamemode[0] && y >= 0 && y < gamemode[1]) {
                noMines.add(`${x}-${y}`);
            }
        }
    }

    while (mines > 0) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);

        if (map[y][x] === 0 && !noMines.has(`${x}-${y}`)) {
            map[y][x] = 9;
            minesCoordinates.add(`${x}-${y}`);
            mines--;
        }
    }
}

function setNumbersForTiles(map) {
    let numRows = gamemode[1];
    let numCols = gamemode[0];

    for (let y = 0; y < numRows; y++) {
        for (let x = 0; x < numCols; x++) {
            if (map[y][x] !== 9) {
                let minesCount = 0;
                for (let k = y-1; k < y+2; k++) {
                    for (let l = x-1; l < x+2; l++) {
                        if (k >= 0 && l >= 0 && k < numRows && l < numCols && map[k][l] === 9) {
                            minesCount++;
                        }
                    }
                }
                map[y][x] = minesCount;
            }
        }
    }
}

function drawCanvas() {
    canvas.width = gamemode[0] * tileSize;
    canvas.height = gamemode[1] * tileSize;

    drawHiddenTiles(new Set());
}

function drawHiddenTiles(coordinates) {
    let img = new Image();
    img.src = `assets/hidden.png`;
    img.onload = function () {
        for (let y = 0; y < gamemode[1]; y++) {
            for (let x = 0; x < gamemode[0]; x++) {
                if (!coordinates.has(`${x}-${y}`) && !revealedCoordinates.has(`${x}-${y}`) && !flaggedCoordinates.has(`${x}-${y}`)) {
                    drawTileLoadedImg(x, y, img);
                }
            }
        }
    }
}

function drawTileWithImgLoading(xCord, yCord, imgSource) {
    let img = new Image();
    img.src = imgSource;
    img.onload = function () {
        drawTileLoadedImg(xCord, yCord, img);
    }
}

function drawTileLoadedImg(xCord, yCord, img) {
    context.drawImage(img, xCord * tileSize, yCord * tileSize, tileSize, tileSize);
}

function newGame(isPressed) {
    gameButton.style.backgroundImage = isPressed ? "url('assets/smiley-pressed.png')" : "url('assets/smiley-base.png')";
    if (!isPressed) {
        revealedCoordinates = new Set();
        flaggedCoordinates = new Set();
        minesCoordinates = new Set();
        remainingCoordinates = new Set();
        gameOver = false;
        minesLeft = gamemode[2];
        map = undefined;
        document.getElementById("minesLeftDisplay").innerHTML = minesLeft;
        drawCanvas();
    }
}

function revealTile(xCord, yCord) {
    if (revealedCoordinates.has(`${xCord}-${yCord}`) || flaggedCoordinates.has(`${xCord}-${yCord}`)) {
        return;
    }
    let coordinates = getCoordinatesToReveal(xCord, yCord);

    for (let i = 0; i < coordinates.length; i++) {
        let imgSource;
        let coordinate = coordinates[i];
        let tile = map[coordinate[1]][coordinate[0]]

        if (tile >= 0 && tile < 9) {
            imgSource = `assets/${tile}.png`;
        }
        revealedCoordinates.add(`${coordinate[0]}-${coordinate[1]}`);
        remainingCoordinates.delete(`${coordinate[0]}-${coordinate[1]}`);
        drawTileWithImgLoading(coordinate[0], coordinate[1], imgSource);
    }
}

function revealRemainingTiles() {
    for (let coordinate of remainingCoordinates) {
        let coord = coordinate.split('-');
        let tileValue = map[coord[1]][coord[0]];
        let imgSource = `assets/${tileValue}.png`;
        drawTileWithImgLoading(coord[0], coord[1], imgSource);
    }
}

function revealMine(minesInVicinity) {
    gameOver = true;
    gameButton.style.backgroundImage = "url('assets/smiley-ded.png')";
    let img = new Image();
    img.src = `assets/mine-pressed.png`;
    img.onload = function () {
        for (let mine of minesInVicinity) {
            let coords = mine.split("-");
            drawTileLoadedImg(coords[0], coords[1], img);
        }
    }
    revealRemainingMines(minesInVicinity);
}

function revealRemainingMines(minesToNotReveal) {
    let img = new Image();
    img.src = 'assets/mine.png';
    img.onload = function () {
        for (let y = 0; y < gamemode[1]; y++) {
            for (let x = 0; x < gamemode[0]; x++) {
                if (map[y][x] === 9 && !flaggedCoordinates.has(`${x}-${y}`) && !minesToNotReveal.has(`${x}-${y}`)) {
                    drawTileLoadedImg(x, y, img);
                }
            }
        }
    };
}

function toggleFlag(xCord, yCord) {
    if (revealedCoordinates.has(`${xCord}-${yCord}`)) {
        return;
    }

    if (map[yCord][xCord] === 0) {
        map[yCord][xCord] = -10;
    }
    else if (map[yCord][xCord] === -10) {
        map[yCord][xCord] = 0
    }
    else {
        map[yCord][xCord] = map[yCord][xCord] * -1;
    }

    let imgSource;
    if (map[yCord][xCord] < 0) {
        imgSource = `assets/flag.png`;
        flaggedCoordinates.add(`${xCord}-${yCord}`);
        remainingCoordinates.delete(`${xCord}-${yCord}`);
    }
    else {
        imgSource = `assets/hidden.png`;
        flaggedCoordinates.delete(`${xCord}-${yCord}`);
        remainingCoordinates.add(`${xCord}-${yCord}`);
    }

    minesLeft = gamemode[2]-flaggedCoordinates.size;
    document.getElementById("minesLeftDisplay").innerHTML = minesLeft;

    drawTileWithImgLoading(xCord, yCord, imgSource);

    if (equalSets(minesCoordinates, flaggedCoordinates)) {
        revealRemainingTiles();
        gameOver = true;
        gameButton.style.backgroundImage = "url('assets/smiley-cool.png')";
    }
}

function getCoordinatesToReveal(xCord, yCord) {
    const tile = map[yCord][xCord];
    const coordinatesToReveal = [];
    const revealedCoordinates = new Set();

    if (tile === 9 || (tile > 0 && !hasZeroNeighbor(xCord, yCord))) {
        coordinatesToReveal.push([xCord, yCord]);
        return coordinatesToReveal;
    }

    if (map[yCord][xCord] > 0) {
        const neighbours = findFirstZeroNeighbour(xCord, yCord);
        yCord = neighbours[0];
        xCord = neighbours[1];
    }
    function revealAdjacentTiles(xCord, yCord) {
        if (yCord >= 0 && yCord < gamemode[1] && xCord >= 0 && xCord < gamemode[0] && !revealedCoordinates.has(`${xCord}-${yCord}`)) {
            revealedCoordinates.add(`${xCord}-${yCord}`);
            coordinatesToReveal.push([xCord, yCord]);

            if (map[yCord][xCord] === 0) {
                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (!(x === 0 && y === 0)) {
                            revealAdjacentTiles(xCord + x, yCord + y);
                        }
                    }
                }
            }
        }
    }

    if (tile === 0 || (tile > 0 && hasZeroNeighbor(xCord, yCord))) {
        revealAdjacentTiles(xCord, yCord);
    }

    return coordinatesToReveal;
}

function hasZeroNeighbor(xCord, yCord) {
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const neighbourX = xCord + x;
            const neighbourY = yCord + y;

            if (neighbourX >= 0 && neighbourX < gamemode[0] && neighbourY >= 0 && neighbourY < gamemode[1]) {
                if (map[neighbourY][neighbourX] === 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function findFirstZeroNeighbour(xCord, yCord) {
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const neighbourX = xCord + x;
            const neighbourY = yCord + y;

            if (neighbourX >= 0 && neighbourX < gamemode[0] && neighbourY >= 0 && neighbourY < gamemode[1]) {
                if (map[neighbourY][neighbourX] === 0) {
                    return [neighbourY, neighbourX];
                }
            }
        }
    }
}

function getNonRevealedNeighbours(xCord, yCord) {
    let nonRevealedNeghbours = [];
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const neighbourX = xCord + x;
            const neighbourY = yCord + y;

            if (neighbourX >= 0 && neighbourX < gamemode[0] && neighbourY >= 0 && neighbourY < gamemode[1]) {
                if (!revealedCoordinates.has(`${neighbourX}-${neighbourY}`)) {
                    nonRevealedNeghbours.push([neighbourX, neighbourY]);
                }
            }
        }
    }
    return nonRevealedNeghbours;
}

function showNonRevealedNeighbours(xCord, yCord, imgSource, trigger) {
    let neighbours = getNonRevealedNeighbours(xCord, yCord);
    let minesCountInNeighbours = 0;
    let flagsCountInNeighbours = 0;

    for (const neighbour of neighbours) {
        if(flaggedCoordinates.has(`${neighbour[0]}-${neighbour[1]}`)) {
            flagsCountInNeighbours++;
        }
        if(minesCoordinates.has(`${neighbour[0]}-${neighbour[1]}`)) {
            minesCountInNeighbours++;
        }
    }
    if (trigger && minesCountInNeighbours === flagsCountInNeighbours && map[yCord][xCord] !== 0 && !flaggedCoordinates.has(`${xCord}-${yCord}`)) {
        let minesInVicinity = new Set();
        for (const neighbour of neighbours) {
            let tile = map[neighbour[1]][neighbour[0]];
            if (tile >= 0 && tile < 9) {
                revealTile(neighbour[0], neighbour[1]);
            }
            if (flaggedCoordinates.has(`${neighbour[0]}-${neighbour[1]}`) && !minesCoordinates.has(`${neighbour[0]}-${neighbour[1]}`)) {
                let imageSource = `assets/mine-naah.png`;
                drawTileWithImgLoading(neighbour[0], neighbour[1], imageSource);
            }
            if (tile === 9) {
                minesInVicinity.add(`${neighbour[0]}-${neighbour[1]}`)
            }
        }
        if (minesInVicinity.size > 0) {
            revealMine(minesInVicinity);
        }
        return null;
    }
    else {
        let coordinatesSet = new Set();
        let img = new Image();
        img.src = imgSource;
        img.onload = function () {
            for (const neighbour of neighbours) {
                if (!flaggedCoordinates.has(`${neighbour[0]}-${neighbour[1]}`)) {
                    coordinatesSet.add(`${neighbour[0]}-${neighbour[1]}`)
                    drawTileLoadedImg(neighbour[0], neighbour[1], img);
                }
            }
        }
        return coordinatesSet;
    }
}

function eventListener(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const x = Math.floor(mouseX / tileSize);
    const y = Math.floor(mouseY / tileSize);

    return [x, y];
}

function equalSets(set1, set2) {
    if (set1.size !== set2.size) {
        return false;
    }

    for (const entry of set1) {
        if (!set2.has(entry)) {
            return false;
        }
    }

    return true;
}

function print2DArray(map) {
    for (let y = 0; y < map.length; y++) {
        let row = "";
        for (let x = 0; x < map[y].length; x++) {
            const cell = map[y][x];
            const cellStr = cell >= 0 ? ` ${cell} ` : `${cell} `;
            row += cellStr;
        }
        console.log(row);
    }
}

canvas.addEventListener("mousedown", function (event) {
    if (gameOver) {
        return;
    }

    isMouseDown = true;
    gameButton.style.backgroundImage = "url('assets/smiley-pog.png')";
    let imgSource = `assets/0.png`;
    let coordinates = eventListener(event);

    if (event.button === 0) {
        if (!flaggedCoordinates.has(`${coordinates[0]}-${coordinates[1]}`) && !revealedCoordinates.has(`${coordinates[0]}-${coordinates[1]}`)) {
            drawTileWithImgLoading(coordinates[0], coordinates[1], imgSource);
        }
    }
    if (event.button === 1) {
        showNonRevealedNeighbours(coordinates[0], coordinates[1], imgSource, false);
    }
    if (event.button === 2) {
        let coordinates = eventListener(event);
        toggleFlag(coordinates[0], coordinates[1]);
    }
});

canvas.addEventListener("mouseup", function (event) {
    isMouseDown = false;

    if (gameOver) {
        return;
    }
    gameButton.style.backgroundImage = "url('assets/smiley-base.png')";
    let coordinates = eventListener(event);

    if (event.button === 0) {
        if (map === undefined) {
            map = generateMap(coordinates);
        }
        let tile = map[coordinates[1]][coordinates[0]];
        if (tile >= 0 && tile < 9) {
            revealTile(coordinates[0], coordinates[1]);
        }
        else {
            let mineCoordinates = new Set();
            mineCoordinates.add(`${coordinates[0]}-${coordinates[1]}`);
            revealMine(mineCoordinates);
        }
    }
    if (event.button === 1) {
        let imgSource = `assets/hidden.png`;
        showNonRevealedNeighbours(coordinates[0], coordinates[1], imgSource, true);
    }
});

canvas.addEventListener("mousemove", function (event) {
    let imgSource = `assets/0.png`;
    if (isMouseDown) {
        let coordinates = eventListener(event);
        if (event.buttons === 1) {
            let coordinatesSet = new Set();
            coordinatesSet.add(`${coordinates[0]}-${coordinates[1]}`);
            if (!flaggedCoordinates.has(`${coordinates[0]}-${coordinates[1]}`) && !revealedCoordinates.has(`${coordinates[0]}-${coordinates[1]}`)) {
                drawTileWithImgLoading(coordinates[0], coordinates[1], imgSource);
            }
            drawHiddenTiles(coordinatesSet);
        }
        if (event.buttons === 4) {
            let coordinatesSet = showNonRevealedNeighbours(coordinates[0], coordinates[1], imgSource, false);
            drawHiddenTiles(coordinatesSet);
        }
    }
});

canvas.addEventListener("mouseleave", function () {
    if (isMouseDown) {
        drawHiddenTiles(new Set());
    }
});

canvas.addEventListener("contextmenu", function (event) {
    event.preventDefault();
});

window.onload = function() {
    newGame(false);
};