// --- SOLO MODO ALTERNATIVO CON SONIDOS Y MÁS PARTÍCULAS ---

const colors = ['#FF69B4','#FFD700','#00FF00','#00BFFF','#FF4500','#ADFF2F','#FF00FF','#FFA500'];

let canvas, ctx, explosionAudio = null, particulasAudio = null, startBtn = null;
let animRunning = false;

// Detectar si es móvil
function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Sonidos
function playExplosionSound() {
    if (!explosionAudio) return;
    try {
        explosionAudio.currentTime = 0;
        explosionAudio.play();
    } catch(e){}
}
function playParticulasSound() {
    if (!particulasAudio) return;
    try {
        let s = particulasAudio.cloneNode();
        s.currentTime = 0;
        s.play();
    } catch(e){}
}

// --- MODO ALTERNATIVO: Fuegos artificiales y globos de letras estilo "Letter" ---
function runAltFireworks() {
    // Variables y opciones del modo alternativo
    let c = canvas;
    // Escala de resolución para móviles
    let pixelRatio = 1;
    if (isMobile()) pixelRatio = 0.5;

    let w = c.width = Math.floor(window.innerWidth * pixelRatio),
        h = c.height = Math.floor(window.innerHeight * pixelRatio),
        ctx2 = c.getContext('2d');

    // Escalar el canvas visualmente para que ocupe toda la pantalla
    c.style.width = window.innerWidth + "px";
    c.style.height = window.innerHeight + "px";
    ctx2.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx2.scale(pixelRatio, pixelRatio);

    let hw = w / 2,
        hh = h / 2,

        opts = {
            strings: [ 'HAPPY', 'BIRTHDAY!','MY LOVE' ],
            charSize: isMobile() ? 22 : 30,
            charSpacing: isMobile() ? 25 : 35,
            lineHeight: isMobile() ? 30 : 40,
            cx: w / 2,
            cy: h / 2,
            fireworkPrevPoints: 8,
            fireworkBaseLineWidth: 4,
            fireworkAddedLineWidth: 5,
            fireworkSpawnTime: 120,
            fireworkBaseReachTime: 20,
            fireworkAddedReachTime: 15,
            fireworkCircleBaseSize: isMobile() ? 12 : 20,
            fireworkCircleAddedSize: isMobile() ? 6 : 10,
            fireworkCircleBaseTime: 18,
            fireworkCircleAddedTime: 12,
            fireworkCircleFadeBaseTime: 7,
            fireworkCircleFadeAddedTime: 3,
            fireworkBaseShards: isMobile() ? 8 : 18, // Menos partículas en móvil
            fireworkAddedShards: isMobile() ? 4 : 12,
            fireworkShardPrevPoints: 2,
            fireworkShardBaseVel: 3,
            fireworkShardAddedVel: 1.5,
            fireworkShardBaseSize: 2,
            fireworkShardAddedSize: 2,
            gravity: .1,
            upFlow: -.1,
            letterContemplatingWaitTime: isMobile() ? 180 : 360,
            balloonSpawnTime: 12,
            balloonBaseInflateTime: 6,
            balloonAddedInflateTime: 6,
            balloonBaseSize: isMobile() ? 12 : 20,
            balloonAddedSize: isMobile() ? 10 : 20,
            balloonBaseVel: .3,
            balloonAddedVel: .3,
            balloonBaseRadian: -( Math.PI / 2 - .5 ),
            balloonAddedRadian: -1,
        },
        calc = {
            totalWidth: opts.charSpacing * Math.max( opts.strings[0].length, opts.strings[1].length )
        },

        Tau = Math.PI * 2,
        TauQuarter = Tau / 4,

        letters = [];

    ctx2.font = opts.charSize + 'px Verdana';

    function Letter( char, x, y ){
        this.char = char;
        this.x = x;
        this.y = y;
        this.dx = -ctx2.measureText( char ).width / 2;
        this.dy = +opts.charSize / 2;
        this.fireworkDy = this.y - hh;
        var hue = x / calc.totalWidth * 360;
        this.color = 'hsl(' + hue + ',80%,50%)';
        this.lightAlphaColor = function(light, alp) {
            return 'hsla(' + hue + ',80%,' + light + '%,' + alp + ')';
        };
        this.lightColor = function(light) {
            return 'hsl(' + hue + ',80%,' + light + '%)';
        };
        this.alphaColor = function(alp) {
            return 'hsla(' + hue + ',80%,50%,' + alp + ')';
        };
        this.reset();
    }
    Letter.prototype.reset = function(){
        this.phase = 'firework';
        this.tick = 0;
        this.spawned = false;
        this.spawningTime = opts.fireworkSpawnTime * Math.random() |0;
        this.reachTime = opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random() |0;
        this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
        this.prevPoints = [ [ 0, hh, 0 ] ];
        this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
        this.circleCompleteTime = opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random() |0;
        this.circleFadeTime = opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random() |0;
        this.tick2 = 0;
        this.circleCreating = true;
        this.circleFading = false;
        this.shards = [];
        this.balloonSpawned = false;
        this.inflating = false;
        this.inflateTime = opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random() |0;
        this.size = opts.balloonBaseSize + opts.balloonAddedSize * Math.random() |0;
        var rad = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random(),
            vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
        this.vx = Math.cos( rad ) * vel;
        this.vy = Math.sin( rad ) * vel;
        this.cx = this.x;
        this.cy = this.y;
        this._exploded = false; // Para controlar el sonido solo una vez
    }
    Letter.prototype.step = function(){
        // FASE 1: FUEGO ARTIFICIAL
        if( this.phase === 'firework' ){
            if( !this.spawned ){
                ++this.tick;
                if( this.tick >= this.spawningTime ){
                    this.tick = 0;
                    this.spawned = true;
                }
            } else {
                ++this.tick;
                var linearProportion = this.tick / this.reachTime,
                    armonicProportion = Math.sin( linearProportion * TauQuarter ),
                    x = linearProportion * this.x,
                    y = hh + armonicProportion * this.fireworkDy;
                if( this.prevPoints.length > opts.fireworkPrevPoints )
                    this.prevPoints.shift();
                this.prevPoints.push( [ x, y, linearProportion * this.lineWidth ] );
                var lineWidthProportion = 1 / ( this.prevPoints.length - 1 );
                for( var i = 1; i < this.prevPoints.length; ++i ){
                    var point = this.prevPoints[ i ],
                        point2 = this.prevPoints[ i - 1 ];
                    ctx2.strokeStyle = this.alphaColor(i / this.prevPoints.length);
                    ctx2.lineWidth = point[ 2 ] * lineWidthProportion * i;
                    ctx2.beginPath();
                    ctx2.moveTo( point[ 0 ], point[ 1 ] );
                    ctx2.lineTo( point2[ 0 ], point2[ 1 ] );
                    ctx2.stroke();
                }
                if( this.tick >= this.reachTime ){
                    this.phase = 'contemplate';
                    this.tick = 0;
                    this.tick2 = 0;
                    this.circleCreating = true;
                    this.circleFading = false;
                    this.shards = [];
                    // MÁS PARTICULAS
                    var shardCount = opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random() |0,
                        angle = Tau / shardCount,
                        cos = Math.cos( angle ),
                        sin = Math.sin( angle ),
                        x = 1,
                        y = 0;
                    for( var i = 0; i < shardCount; ++i ){
                        var x1 = x;
                        x = x * cos - y * sin;
                        y = y * cos + x1 * sin;
                        this.shards.push( new Shard( this.x, this.y, x, y, this.alphaColor(1) ) );
                    }
                    // SONIDOS
                    if (!this._exploded) {
                        playExplosionSound();
                        playParticulasSound();
                        setTimeout(playParticulasSound, 80);
                        setTimeout(playParticulasSound, 160);
                        this._exploded = true;
                    }
                }
            }
        }
        // FASE 2: CONTEMPLAR LETRA Y CÍRCULO
        else if( this.phase === 'contemplate' ){
            ++this.tick;
            if( this.circleCreating ){
                ++this.tick2;
                var proportion = this.tick2 / this.circleCompleteTime,
                    armonic = -Math.cos( proportion * Math.PI ) / 2 + .5;
                ctx2.beginPath();
                ctx2.fillStyle = this.lightAlphaColor(50 + 50 * proportion, proportion);
                ctx2.arc( this.x, this.y, armonic * this.circleFinalSize, 0, Tau );
                ctx2.fill();
                if( this.tick2 > this.circleCompleteTime ){
                    this.tick2 = 0;
                    this.circleCreating = false;
                    this.circleFading = true;
                }
            } else if( this.circleFading ){
                ctx2.fillStyle = this.lightColor(70);
                ctx2.fillText( this.char, this.x + this.dx, this.y + this.dy );
                ++this.tick2;
                var proportion = this.tick2 / this.circleFadeTime,
                    armonic = -Math.cos( proportion * Math.PI ) / 2 + .5;
                ctx2.beginPath();
                ctx2.fillStyle = this.lightAlphaColor(100, 1 - armonic);
                ctx2.arc( this.x, this.y, this.circleFinalSize, 0, Tau );
                ctx2.fill();
                if( this.tick2 >= this.circleFadeTime )
                    this.circleFading = false;
            } else {
                ctx2.fillStyle = this.lightColor(70);
                ctx2.fillText( this.char, this.x + this.dx, this.y + this.dy );
            }
            for( var i = 0; i < this.shards.length; ++i ){
                this.shards[ i ].step();
                if( !this.shards[ i ].alive ){
                    this.shards.splice( i, 1 );
                    --i;
                } else {
                    // Dibuja la estela del shard
                    var prev = this.shards[i].prev;
                    if(prev && prev.length > 1){
                        for(var k=1; k<prev.length; ++k){
                            ctx2.strokeStyle = this.shards[i].color;
                            ctx2.lineWidth = this.shards[i].size * (k/prev.length);
                            ctx2.beginPath();
                            ctx2.moveTo(prev[k-1][0], prev[k-1][1]);
                            ctx2.lineTo(prev[k][0], prev[k][1]);
                            ctx2.stroke();
                        }
                    }
                }
            }
            if( this.tick > opts.letterContemplatingWaitTime ){
                this.phase = 'balloon';
                this.tick = 0;
                this.spawning = true;
                this.spawnTime = opts.balloonSpawnTime * Math.random() |0;
                this.inflating = false;
                this.inflateTime = opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random() |0;
                this.size = opts.balloonBaseSize + opts.balloonAddedSize * Math.random() |0;
                var rad = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random(),
                    vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
                this.vx = Math.cos( rad ) * vel;
                this.vy = Math.sin( rad ) * vel;
                this.cx = this.x;
                this.cy = this.y;
            }
        }
        // FASE 3: GLOBO
        else if( this.phase === 'balloon' ){
            ctx2.strokeStyle = this.lightColor(80);
            if( this.spawning ){
                ++this.tick;
                ctx2.fillStyle = this.lightColor(70);
                ctx2.fillText( this.char, this.x + this.dx, this.y + this.dy );
                if( this.tick >= this.spawnTime ){
                    this.tick = 0;
                    this.spawning = false;
                    this.inflating = true;
                }
            } else if( this.inflating ){
                ++this.tick;
                var proportion = this.tick / this.inflateTime,
                    x = this.cx = this.x,
                    y = this.cy = this.y - this.size * proportion;
                ctx2.fillStyle = this.alphaColor(proportion);
                ctx2.beginPath();
                generateBalloonPath( x, y, this.size * proportion );
                ctx2.fill();
                ctx2.beginPath();
                ctx2.moveTo( x, y );
                ctx2.lineTo( x, this.y );
                ctx2.stroke();
                ctx2.fillStyle = this.lightColor(70);
                ctx2.fillText( this.char, this.x + this.dx, this.y + this.dy );
                if( this.tick >= this.inflateTime ){
                    this.tick = 0;
                    this.inflating = false;
                }
            } else {
                this.cx += this.vx;
                this.cy += this.vy += opts.upFlow;
                ctx2.fillStyle = this.color;
                ctx2.beginPath();
                generateBalloonPath( this.cx, this.cy, this.size );
                ctx2.fill();
                ctx2.beginPath();
                ctx2.moveTo( this.cx, this.cy );
                ctx2.lineTo( this.cx, this.cy + this.size );
                ctx2.stroke();
                ctx2.fillStyle = this.lightColor(70);
                ctx2.fillText( this.char, this.cx + this.dx, this.cy + this.dy + this.size );
                if( this.cy + this.size < -hh || this.cx < -hw || this.cy > hw  )
                    this.phase = 'done';
            }
        }
    }
    function Shard( x, y, vx, vy, color ){
        var vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
        this.vx = vx * vel;
        this.vy = vy * vel;
        this.x = x;
        this.y = y;
        this.prev = [ [ x, y ] ];
        this.color = color;
        this.alive = true;
        this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
    }
    Shard.prototype.step = function(){
        this.x += this.vx;
        this.y += this.vy += opts.gravity;
        if( this.prev.length > opts.fireworkShardPrevPoints )
            this.prev.shift();
        this.prev.push( [ this.x, this.y ] );
        if( this.prev[ 0 ][ 1 ] > hh )
            this.alive = false;
    }

    function generateBalloonPath( x, y, size ){
        ctx2.moveTo( x, y );
        ctx2.bezierCurveTo( x - size / 2, y - size / 2,
                            x - size / 4, y - size,
                            x,            y - size );
        ctx2.bezierCurveTo( x + size / 4, y - size,
                            x + size / 2, y - size / 2,
                            x,            y );
    }

    function anim(){
        if (!animRunning) return;
        window.requestAnimationFrame( anim );
        ctx2.fillStyle = '#111';
        ctx2.fillRect( 0, 0, w, h );
        ctx2.save();
        ctx2.translate( hw, hh );
        var done = true;
        for( var l = 0; l < letters.length; ++l ){
            letters[ l ].step();
            if( letters[ l ].phase !== 'done' )
                done = false;
        }
        ctx2.restore();
        if( done ) {
            animRunning = false;
            // Mostrar el botón al terminar
            if (startBtn) startBtn.style.display = 'flex';
        }
    }

    letters.length = 0;
    for( var i = 0; i < opts.strings.length; ++i ){
        for( var j = 0; j < opts.strings[ i ].length; ++j ){
            letters.push( new Letter( opts.strings[ i ][ j ],
                j * opts.charSpacing + opts.charSpacing / 2 - opts.strings[ i ].length * opts.charSize / 2,
                i * opts.lineHeight + opts.lineHeight / 2 - opts.strings.length * opts.lineHeight / 2 ) );
        }
    }
    anim();

    window.addEventListener( 'resize', function(){
        // Recalcular dimensiones y escala en resize
        let w = c.width = Math.floor(window.innerWidth * pixelRatio),
            h = c.height = Math.floor(window.innerHeight * pixelRatio);
        c.style.width = window.innerWidth + "px";
        c.style.height = window.innerHeight + "px";
        hw = w / 2;
        hh = h / 2;
        ctx2.setTransform(1, 0, 0, 1, 0, 0);
        ctx2.scale(pixelRatio, pixelRatio);
        ctx2.font = opts.charSize + 'px Verdana';
    });
}

// Inicialización y eventos
function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    startBtn = document.getElementById('startBtn');
    // Precarga sonidos
    explosionAudio = new Audio('explosion.mp3');
    particulasAudio = new Audio('particulas.mp3');
    // Intenta desbloquear audio en móviles
    Promise.all([
        explosionAudio.play().catch(()=>{}).then(()=>{explosionAudio.pause(); explosionAudio.currentTime=0;}),
        particulasAudio.play().catch(()=>{}).then(()=>{particulasAudio.pause(); particulasAudio.currentTime=0;})
    ]).finally(()=>{
        // Mostrar el botón al inicio
        if (startBtn) startBtn.style.display = 'flex';
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                startBtn.style.display = 'none';
                animRunning = true;
                runAltFireworks();
            });
        }
    });
}

// Esperar a que el DOM esté listo
window.addEventListener('DOMContentLoaded', setup);
