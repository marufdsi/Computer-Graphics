
var gl;
var program;

var theta = 0.0;
var thetaLoc;

// vertex color list
var square_color = [];
// vertex list
var square = [];

var delay = 100;
var direction = true;

// To toggle between the stop and start rotation.
var rotate = true;

// There will be four different primitives.
// '0': GL_TRIANGLE_STRIP
// '1': GL_TRIANGLE_FAN
// '2': GL_LINES
// '3': GL_LINE_LOOP
var primitive_type = '0';
var old_primitive_type;

// we are going to create square, so four vertices enough to represent a square. So, for different primitives we are going to use different combination of vertices. 
var vertices = [
		vec2(  0,  1 ),
		vec2(  0,  -1 ),
		vec2(  1,  0 ),
		vec2(  -1,  0 )
	];
// Color list: we are going to assign different color to different vertex.
var colors = [
        vec4( 1.0, 0.0, 0.0, 1.0 ),  
        vec4(1.0, 1.0, 0.0, 1.0 ),  
        vec4( 0.0, 1.0, 0.0, 1.0 ),  
        vec4(0.0, 0.0, 1.0, 1.0 ),  
		vec4(0.0, 1.0, 1.0, 1.0 )  
];

var indices = [
    3, 0, 1, 2, 			// GL_TRIANGLE_STRIP   
	1, 3, 0, 2,  			// GL_TRIANGLE_FAN
	1, 3, 3, 0, 0, 2, 2, 1, // GL_LINES
	1, 3, 0, 2  			// GL_LINE_LOOP
];


window.onload = function init() {

	var canvas = document.getElementById( "gl-canvas" );
    
	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { 
		alert( "WebGL isn't available" ); 
	}

	//
	//  Configure WebGL
	//
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	
	// vertex loading move to new function called 'load_vertices'

	
    //  Load shaders and initialize attribute buffers
    
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );
	
		
	var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
	
	// Load the data into the GPU  
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    thetaLoc = gl.getUniformLocation( program, "theta" );
	
	redLoc = gl.getUniformLocation( program, "red" );
	greenLoc = gl.getUniformLocation( program, "green" );
	blueLoc = gl.getUniformLocation( program, "blue" );
    
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
	
    
						// Illustrating Controls from the choice menu
    document.getElementById("Controls" ).onclick = function(event) {
						// need to get the selection from the choice menu
						// returns a character
		var choice = event.target.value;
		switch(choice) {
			case '0':
				direction = !direction;
				break;
			case '1':
				delay /= 2.0;
				break;
			case '2':
				delay *= 2.0;
				break;
			// New event added to switch between the primitive type.
			case '6':
				primitive_type = '0';
				break;
			case '7':
				primitive_type = '1';
				break;
			case '8':
				primitive_type = '2';
				break;
			case '9':
				primitive_type = '3';
				break;
			
		}
	};

						// Illustrating controls from the keyboard
    window.onkeydown = function(event) {
						// returned ascii keycode is mapped to the key that was pressed.
						// 49, 50, 51 -->> '1', '2', '3'
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
			// New event added to switch between the primitive type.
			case '6':
				primitive_type = '0';
				break;
			case '7':
				primitive_type = '1';
				break;
			case '8':
				primitive_type = '2';
				break;
			case '9':
				primitive_type = '3';
				break;
			
		}
	};
	render();
};


// New function to handle different color loading.
function assignColor(colorList){
	
	square_color = [];
	// Fill the 'square' list by vertices according to the primmitive type. Here 'sqaure_color' list used for the vertex color.
	for ( var i = 0; i < colorList.length; ++i ) {
        square_color.push( colors[colorList[i]] );
    }
	
	// Load the color data into the GPU    
	var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(square_color), gl.STATIC_DRAW);

    // Associate out shader variables with our color data buffer
    
    var sColor = gl.getAttribLocation( program, "sColor");
    gl.vertexAttribPointer(sColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(sColor);

}
function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

				// update the rotation angle
	if(rotate){
		theta += (direction ? 0.1 : -0.1);
	}
				// send to shader
    gl.uniform1f(thetaLoc, theta);

	// draw the square
				
	switch(primitive_type){
		case '0':
			// GL_TRIANGLE_STRIP
			// Do not need to load vertices every time, unless primitive type changes
			if(old_primitive_type != primitive_type){
				assignColor([0, 0, 1, 1]);
				old_primitive_type = primitive_type;
			}
			gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
			break;
		case '1':
			// GL_TRIANGLE_FAN
			if(old_primitive_type != primitive_type){
				assignColor([2, 2, 3, 3]);
				old_primitive_type = primitive_type;
			}
			gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_BYTE, 4);
			break;
		case '2':
			// GL_LINES
			if(old_primitive_type != primitive_type){
				assignColor([3, 3, 4, 4, 3, 3, 4, 4]);
				old_primitive_type = primitive_type;
			}
			gl.drawElements(gl.LINES, 8, gl.UNSIGNED_BYTE, 8);
			break;
		case '3':
			// GL_LINE_LOOP
			if(old_primitive_type != primitive_type){
				assignColor([2, 2, 0, 0]);
				old_primitive_type = primitive_type;
			}
			gl.drawElements(gl.LINE_LOOP, 4, gl.UNSIGNED_BYTE, 16);
			break;
	}

				// animate
    setTimeout(
        function (){requestAnimFrame(render);}, delay
    );
}
