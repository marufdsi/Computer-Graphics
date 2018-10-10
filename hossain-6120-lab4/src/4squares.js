
var gl;

var theta = 0.0;
var thetaLoc;

// Save world coordinate values
var w_X_min = 0;
var w_X_max = 0;
var w_Y_min = 0;
var w_Y_max = 0;
var w_width = 0;
var w_height = 0;

// shear variable for X axis
var shear_x = 1.0;
var shearloc_x;
// shear variable for Y axis
var shear_y = 1.0;
var shearloc_y;

// Scalling factor
var scale = 1.0;
var scaleloc;

// Translate to the X axis
var trans_x = 0;
var transloc_x;
// Translate to the Y axis
var trans_y = 0;
var transloc_y;

// Handle rotation
var rotate = false;

var delay = 100;
var direction = true;
var points = [];

// Generate World Coordinates
var _min = 150;
var _max =300;
// Translation amount
var translate_by = 0;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.3, 0.6, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	// World coordinate vertices
    var vertices = [
        vec2(  -_min,  _max ),
        vec2(  -_min,  _min ),
        vec2(  -_max,  _min ),
		vec2(  -_min,  _max ),
        vec2(  -_max,  _min ),
        vec2(  -_max, _max ),
		
        vec2(  _min,  _max ),
        vec2(  _min,  _min ),
        vec2(  _max,  _min ),
		vec2(  _min,  _max ),
        vec2(  _max,  _min ),
        vec2(  _max,  _max ),
		
        vec2(  -_min,  -_max ),
        vec2(  -_min,  -_min ),
        vec2(  -_max,  -_min ),
        vec2(  -_min,  -_max ),
        vec2(  -_max,  -_min ),
        vec2(  -_max,  -_max ),
		
        vec2(  _min,  -_max ),
        vec2(  _min,  -_min ),
        vec2(  _max,  -_min ),
        vec2(  _min,  -_max ),
        vec2(  _max,  -_min ),
        vec2(  _max,  -_max)
    ];
	
	var square_color = [
		[ 1.0, 0.0, 0.0, 1.0 ],  // red
		[ 1.0, 0.0, 0.0, 1.0 ],  // red
		[ 1.0, 0.0, 0.0, 1.0 ],  // red
		[ 1.0, 0.0, 0.0, 1.0 ],  // red
		[ 1.0, 0.0, 0.0, 1.0 ],  // red
		[ 1.0, 0.0, 0.0, 1.0 ],  // red
		
		[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
		[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
		[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
		[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
		[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
		[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
		
		[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
		[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
		[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
		[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
		[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
		[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
		
		[ 0.0, 0.0, 1.0, 1.0 ],  // blue
		[ 0.0, 0.0, 1.0, 1.0 ],  // blue
		[ 0.0, 0.0, 1.0, 1.0 ],  // blue
		[ 0.0, 0.0, 1.0, 1.0 ],  // blue
		[ 0.0, 0.0, 1.0, 1.0 ],  // blue
		[ 0.0, 0.0, 1.0, 1.0 ]  // blue
	];
	
	// initialize world coordinates
	initializeWorldCoordinate();
	calculateTranslation();
    // Load the data into the GPU    
	
	// Load the color data into the GPU    
	var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(square_color), gl.STATIC_DRAW);

    // Associate out shader variables with our color data buffer
    
    var sColor = gl.getAttribLocation( program, "sColor");
    gl.vertexAttribPointer(sColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(sColor);
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(getPoints(vertices)), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    thetaLoc = gl.getUniformLocation( program, "theta" );
    shearloc_x = gl.getUniformLocation( program, "shear_x" );
    shearloc_y = gl.getUniformLocation( program, "shear_y" );
    scaleloc = gl.getUniformLocation( program, "scale" );
    transloc_x = gl.getUniformLocation( program, "trans_x" );
    transloc_y = gl.getUniformLocation( program, "trans_y" );
    
    // Initialize event handlers
    document.getElementById("Direction").onclick = function () {
        direction = !direction;
    };
	
	// Added new event listener to handle rotation.
	document.getElementById("Rotattion").onclick = function () {
		if(rotate){
			rotate = false;
			// switch the text
			document.getElementById("Rotattion").innerText = "Start Rotattion";
		} else{
			rotate = true;
			// switch the text
			document.getElementById("Rotattion").innerText = "Stop Rotattion";
		}
    };
    
    document.getElementById("Controls" ).onclick = function(event) {
        switch( event.srcElement.index ) {
          case 0:
            direction = !direction;
            break;
         case 1:
            delay /= 2.0;
            break;
         case 2:
            delay *= 2.0;
            break;
       }
    };

    window.onkeydown = function(event) {
        var key = String.fromCharCode(event.keyCode);
        switch(key) {
          case '1':
            direction = !direction;
            break;

          case '2':
            delay /= 2.0;
            break;

          case '3':
            delay *= 2.0;
            break;
        }
    };
    render();
};

// NDC vertices
function getPoints(world_vectors){
	for ( var i = 0; i < world_vectors.length; ++i ) {
        points.push( worldToNDC(world_vectors[i][0], world_vectors[i][1]));
    }
	return points;
}

function calculateTranslation(){
	translate_by = (2*(((_max + _min)/2) - w_X_min)/w_width) -1;
}

// Initialize world coordinates
function initializeWorldCoordinate(){
	w_X_min = -500;
	w_X_max = 500;
	w_Y_min = -500;
	w_Y_max = 500;
	w_width = w_X_max - w_X_min;
	w_height = w_Y_max - w_Y_min;
}

// Calculate NDC Coordinates from World Coordinates
function worldToNDC(w_x, w_y){
	var ndc_x = (2*(w_x-w_X_min)/w_width)-1;
	var ndc_y = (2*(w_y-w_Y_min)/w_height)-1;
	
	return vec2(ndc_x, ndc_y);
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    if(rotate){
		theta += (direction ? 0.1 : -0.1);
	}
    gl.uniform1f(thetaLoc, theta);
	
	// top left square, without transformation.
	shear_x = 0;
	shear_y = 0;
	scale = 1;
	trans_x = translate_by;
	trans_y = -translate_by;
    gl.uniform1f(transloc_x, trans_x);
    gl.uniform1f(transloc_y, trans_y);
    gl.uniform1f(scaleloc, scale);
    gl.uniform1f(shearloc_x, shear_x);
    gl.uniform1f(shearloc_y, shear_y);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	// top right square, with scaling 1.8 and no shear
	shear_x = 0;
	shear_y = 0;
	scale = 1.8;
	trans_x = -translate_by;
	trans_y = -translate_by;
    gl.uniform1f(transloc_x, trans_x);
    gl.uniform1f(transloc_y, trans_y);
    gl.uniform1f(scaleloc, scale);
    gl.uniform1f(shearloc_x, shear_x);
    gl.uniform1f(shearloc_y, shear_y);
	gl.drawArrays(gl.TRIANGLES, 6, 6);
	
	// bottom left square, shear corresponding X axis.
	shear_y = 0;
	shear_x = 0.4;
	scale = 1;
	trans_x = translate_by;
	trans_y = translate_by;
    gl.uniform1f(transloc_x, trans_x);
    gl.uniform1f(transloc_y, trans_y);
    gl.uniform1f(scaleloc, scale);
    gl.uniform1f(shearloc_x, shear_x);
    gl.uniform1f(shearloc_y, shear_y);
	gl.drawArrays(gl.TRIANGLES, 12, 6);
	
	//bottom right square, shear corresponding Y axis.
	shear_x = 0;
	shear_y = 0.4;
	scale = 1;
	trans_x = -translate_by;
	trans_y = translate_by;
    gl.uniform1f(transloc_x, trans_x);
    gl.uniform1f(transloc_y, trans_y);
    gl.uniform1f(scaleloc, scale);
    gl.uniform1f(shearloc_x, shear_x);
    gl.uniform1f(shearloc_y, shear_y);
	gl.drawArrays(gl.TRIANGLES, 18, 6);

    setTimeout(
        function (){requestAnimFrame(render);}, delay
    );
}
