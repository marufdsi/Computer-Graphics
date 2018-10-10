
var canvas;
var gl;


// Maximum 100 lines and 100 triangle can draw. 
// So, 2*100(for lines) + 3*100(for triangle) = 500 vertices rare required.
var maxNumVertices  = 500;
// Triangle vertices start from index 200.
var triangle_start_pos = 200;
// Track line vertices
var line_index = 0;
// Track triangle vertices
var triangle_index = 0;
var color_index = 0;
var primitive_type = 0;

var colors = [
	
	[ 1.0, 0.0, 0.0, 1.0 ],  // red
	[ 1.0, 1.0, 0.0, 1.0 ],  // yellow
	[ 0.0, 1.0, 0.0, 1.0 ],  // green
	[ 0.0, 0.0, 1.0, 1.0 ],  // blue
	[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
	[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
	[ 1.0, 0.5, 0.0, 1.0 ],  // orange
	[ 0.0, 0.0, 0.0, 1.0 ],  // black

];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	
	var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);
	
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
	
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW);
    
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    //canvas.addEventListener("click", function(){
    canvas.addEventListener("click", function(event){
		gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
		// Calculate NDC Coordinates
		var t = vec2((2*event.clientX/canvas.width)-1, 
             (2*(canvas.height-event.clientY)/canvas.height)-1);
		// Calculate World Coordinates
		var w = vec2((200*event.clientX/canvas.width)-100, 
             (200*(canvas.height-event.clientY)/canvas.height)-100);
		// Assign different coordinates value in the text box
		document.getElementById("device_x" ).value = event.clientX;
		document.getElementById("device_y" ).value = event.clientY;
		document.getElementById("ndc_x" ).value = t[0];
		document.getElementById("ndc_y" ).value = t[1];
		document.getElementById("world_x" ).value = w[0];
		document.getElementById("world_y" ).value = w[1];
		
		switch(primitive_type){
			case 0:
				gl.bufferSubData(gl.ARRAY_BUFFER, 8*line_index, flatten(t));

				gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
				t = vec4(colors[color_index]);
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*line_index, flatten(t));
				line_index++;
				break;
			case 1:
				gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangle_index+200), flatten(t));

				gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
				t = vec4(colors[color_index]);
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangle_index+200), flatten(t));
				triangle_index++;
				break;
		}
        
    } );

	document.getElementById("Controls" ).onclick = function(event) {
						// need to get the selection from the choice menu
						// returns a character
		var choice = event.target.value;
		switch(choice) {
			case '0':
				primitive_type = 0;
				break;
			case '1':
				primitive_type = 1;
				break;
		}
	};
	document.getElementById("Colors" ).onclick = function(event) {
						// need to get the selection from the choice menu
						// returns a character
		var choice = event.target.value;
		color_index = choice;
	};
	window.onkeydown = function(event) {
						// returned ascii keycode is mapped to the key that was pressed.
						// 49, 50, 51 -->> '1', '2', '3'
		var key = String.fromCharCode(event.keyCode);
		switch(key) {
			case '0':
				color_index = 0;  // Red Color
				break;
			case '1':
				color_index = 1;  // Yellow Color
				break;
			case '2':
				color_index = 2;  // Green Color
				break;
			case '3':
				color_index = 3;  // Blue Color
				break;
			case '4':
				color_index = 4;  // Magenta Color
				break;
			case '5':
				color_index = 5;  // Cyan Color
				break;
			case '6':
				color_index = 6;  // Orange Color
				break;
			case '7':
				color_index = 7;  // Black Color
				break;
			case '8':
				primitive_type = 0;  // Line Primitives
				break;
			case '9':
				primitive_type = 1;  // Triangle Primitive
				break;
			
		}
	};
    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
	
	if(line_index>=0){
		gl.drawArrays( gl.LINES, 0, line_index );
	}
	if(triangle_index>=0){
		gl.drawArrays( gl.TRIANGLES, triangle_start_pos, triangle_index );
	}
	window.requestAnimFrame(render);
}