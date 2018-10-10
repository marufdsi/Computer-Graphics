
var canvas;
var gl;

// Save world coordinate values
var w_X_min = 0;
var w_X_max = 0;
var w_Y_min = 0;
var w_Y_max = 0;
var w_width = 0;
var w_height = 0;
// Track mouse dragging
var clicked = false;


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 1.0, 1.0, 1.0 );

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	// Track mouse down
	canvas.addEventListener("mousedown", function(event){
		clicked = true;
    });
	
	// Track mouse move event
	canvas.addEventListener("mousemove", function(event){
		// Check mouse down or up
		if(clicked == false) return;
		
		// Mouse positions
		document.getElementById("mouse_x").value = event.clientX;
		document.getElementById("mouse_y").value = event.clientY;
		
		// Convert canvas coordinates to world coordinates
		world = deviceToWorld(event.clientX, event.clientY);
		// Convert world coordinates to device coordinates
		worldToDevice(world[0], world[1]);
		// Convert world coordinates to ndc coordinates
		worldToNDC(world[0], world[1]);
	});
	
	canvas.addEventListener("mouseup", function(event){
		clicked = false;
	});
	
	document.getElementById("btn_add_world_coordinate").addEventListener("click", function(event){
		initializeWorldCoordinate();
		document.getElementById("btn_add_world_coordinate").innerText = "Update World Coordinates";
	});
    render();
}

// Initialize world coordinates
function initializeWorldCoordinate(){
	w_X_min = parseInt(document.getElementById("x_min" ).value);
	w_X_max = parseInt(document.getElementById("x_max" ).value);
	w_Y_min = parseInt(document.getElementById("y_min" ).value);
	w_Y_max = parseInt(document.getElementById("y_max" ).value);
	w_width = w_X_max - w_X_min;
	w_height = w_Y_max - w_Y_min;
}

// Calculate World Coordinates from Device Coordinates
function deviceToWorld(d_x, d_y){
	var w_x = (w_width*d_x/canvas.width) + w_X_min;
	var w_y = (w_height*(canvas.height-d_y)/canvas.height) + w_Y_min;
	// Assign calculated value into text field.
	document.getElementById("world_x" ).value = w_x;
	document.getElementById("world_y" ).value = w_y;
	
	return vec2(w_x, w_y);
}

// Calculate Device Coordinates from World Coordinates
function worldToDevice(w_x, w_y){
	var d_x = (w_x-w_X_min)*canvas.width/w_width;
	var d_y = canvas.height - ((w_y-w_Y_min)*canvas.height/w_height);
	// Assign calculated value into text field.
	document.getElementById("device_x" ).value = d_x;
	document.getElementById("device_y" ).value = d_y;
	
	return vec2(d_x, d_y);
}

// Calculate NDC Coordinates from World Coordinates
function worldToNDC(w_x, w_y){
	var ndc_x = (2*(w_x-w_X_min)/w_width)-1;
	var ndc_y = (2*(w_y-w_Y_min)/w_height)-1;
	// Assign calculated value into text field.
	document.getElementById("ndc_x").value = ndc_x;
	document.getElementById("ndc_y").value = ndc_y;
	
	return vec2(ndc_x, ndc_y);
}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
	window.requestAnimFrame(render);
}