
var canvas;
var gl;
// Track draw or pick option enable
var draw = true;
var pick = false;
// Track selected object
var object_selected = false;
var selected_obj = 0;
// Track object index
var selected_obj_index = 0;

var cBuffer;
var vBuffer;

// Track mouse dragging
var clicked = false;

// Mouse dragging start position
var start_pos;
// Mouse dragging end position
var end_pos;

var line_vertext_count = 0;
var triangle_vertext_count = 0;
var line_vertext_list = [];
var triangle_vertext_list = [];

// Save world coordinate values
var w_X_min = 0;
var w_X_max = 0;
var w_Y_min = 0;
var w_Y_max = 0;
var w_width = 0;
var w_height = 0;

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
var primitive_type = 1;

var vertices_list = [];

var found =false;

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
    
	initializeWorldCoordinate();
	
	vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);
	
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
	
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW);
    
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
	
	// Track mouse down
	canvas.addEventListener("mousedown", function(event){
		clicked = true;
		if(!draw){
			// Calculate World Coordinates
			var w = deviceToWorld(event.clientX, event.clientY);
			// Calculate NDC Coordinates
			var t = worldToNDC(w[0], w[1]);
			found =false;
			for ( var i = 0; i < vertices_list.length; ++i ) {
				for ( var j = 0; j < vertices_list[i].length; ++j ) {
					if(Math.round(vertices_list[i][j][0][0])+15 >= Math.round(w[0]) && Math.round(vertices_list[i][j][0][0])-15 <= Math.round(w[0]) &&  Math.round(vertices_list[i][j][0][1])+15 >= Math.round(w[1]) &&  Math.round(vertices_list[i][j][0][1])-15 <= Math.round(w[1])){
						// Assign the original color of previously selected object
						gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
						for(var k=0; k<selected_obj.length; ++k){
							gl.bufferSubData(gl.ARRAY_BUFFER, 16*selected_obj[k][2], flatten(vec4(selected_obj[k][3])));
						}
						// Empty the previous selected object info
						selected_obj = [];
						// Object picked
						object_selected = true;
						found = true;
						break;
					}
				}
				if(found){
					// Add the selected object info in to the selected_obj variable
					selected_obj = vertices_list[i];
					// Assign new color that is why people can understand which object is selected
					gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
					for(var j=0; j<selected_obj.length; ++j){
						gl.bufferSubData(gl.ARRAY_BUFFER, 16*selected_obj[j][2], flatten(vec4(1.0, (j+1)/2, (j/2), 0.9)));
					}
					// Track the mouse's current and start position for handaling dragging
					start_pos = deviceToWorld(event.clientX, event.clientY);
					break;
				}
			}
		}
    });
	
	// Track mouse move event
	canvas.addEventListener("mousemove", function(event){
		
		// Check mouse down or up
		if(clicked == false) return;
		if(!draw && found){
			// Track the mouse's current position
			var end_pos = deviceToWorld(event.clientX, event.clientY);
			// Calculate the distance of the mouse dragging
			var trans_x = end_pos[0] - start_pos[0];
			var trans_y = end_pos[1] - start_pos[1];
			for(var i=0; i<selected_obj.length; ++i){
				// Translate the object
				selected_obj[i][0][0] += trans_x;	
				selected_obj[i][0][1] += trans_y;	
				var result = worldToNDC(selected_obj[i][0][0], selected_obj[i][0][1]);
				gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 8*selected_obj[i][2], flatten(result));
			}
			// Make the end position as the start position
			start_pos = end_pos;
		}
	});
	
	canvas.addEventListener("mouseup", function(event){
		clicked = false;
	});
	
    //canvas.addEventListener("click", function(){
    canvas.addEventListener("click", function(event){
		if(draw){
			gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
			
			// Calculate World Coordinates
			var w = deviceToWorld(event.clientX, event.clientY);
			// Calculate NDC Coordinates
			var t = worldToNDC(w[0], w[1]);
			
			switch(primitive_type){
				// Line type primitives
				case 0:
					// Add vertex to the buffer sub data
					gl.bufferSubData(gl.ARRAY_BUFFER, 8*line_index, flatten(t));
					// Assign corresponding color of the vertex
					gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
					cl = vec4(colors[color_index]);
					gl.bufferSubData(gl.ARRAY_BUFFER, 16*line_index, flatten(cl));
					// Track the information of the vertex for future process
					line_vertext_list.push([w, primitive_type, line_index, colors[color_index]]);
					line_vertext_count++;
					// Two vertex are required to draw a line that is why track the drawable lines
					if(line_vertext_count == 2){
						line_vertext_count = 0;
						vertices_list.push(line_vertext_list);
						line_vertext_list = [];
					}
					line_index++;
					break;
				// Trinangle type primitives
				case 1:
					// Add vertex to the buffer sub data
					gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangle_index + triangle_start_pos), flatten(t));
					// Assign corresponding color of the vertex
					gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
					cl = vec4(colors[color_index]);
					gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangle_index + triangle_start_pos), flatten(cl));
					// Track the information of the vertex for future process
					triangle_vertext_list.push([w, primitive_type, (triangle_index + triangle_start_pos), colors[color_index]]);
					triangle_vertext_count++;
					// Three vertex are required to draw a triangle that is why track the drawable triangles
					if(triangle_vertext_count == 3){
						triangle_vertext_count = 0;
						vertices_list.push(triangle_vertext_list);
						triangle_vertext_list = [];
					}
					triangle_index++;
					break;
			}
		
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
	// Draw primitives
	document.getElementById("draw_primitives" ).onclick = function(event) {
		draw = true;
		pick = false;
		object_selected = false;
	};
	// Pick the primitives
	document.getElementById("pick_primitives" ).onclick = function(event) {
		draw = false;
		pick = true;
	};
	// Rotate to the left
	document.getElementById("rotate_left" ).onclick = function(event) {
		rotate(-0.1);
	};
	
	// Rotate to the right
	document.getElementById("rotate_right" ).onclick = function(event) {
		rotate(0.1);
	};
	// Scaling the selecting object
	document.getElementById("btn_scale").onclick = function() {
		// Get distance from origin that we need to translate
		var translate_by = get_distance_from_origin();
		
		var scale = document.getElementById("in_scale" ).value;
		for(var i=0; i<selected_obj.length; ++i){
			// Translate to the origin
			var w = translate(selected_obj[i][0], -translate_by[0], -translate_by[1]);
			// Apply Scaling
			selected_obj[i][0][0] = w[0] * scale;	
			selected_obj[i][0][1] = w[1] * scale;	
			// Return to the actual location
			selected_obj[i][0] = translate(selected_obj[i][0], translate_by[0], translate_by[1]);

			// convert coordinate from world to NDC
			var result = worldToNDC(selected_obj[i][0][0], selected_obj[i][0][1]);
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 8*selected_obj[i][2], flatten(result));
		}
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

function rotate(theta){
	// Get distance from origin that we need to translate
	var translate_by = get_distance_from_origin();
	var s = Math.sin( theta );
	var c = Math.cos( theta);
	for(var i=0; i<selected_obj.length; ++i){
		// Translate to the origin
		var w = translate(selected_obj[i][0], -translate_by[0], -translate_by[1]);
		// Apply rotation
		var r_x = s * w[1] + c * w[0];	
		var r_y = -s * w[0] + c * w[1];
		// Return to the actual location
		selected_obj[i][0] = translate(vec2(r_x, r_y), translate_by[0], translate_by[1]);
		// convert coordinate from world to NDC
		var result = worldToNDC(selected_obj[i][0][0], selected_obj[i][0][1]);
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 8*selected_obj[i][2], flatten(result));
	}
}
function get_distance_from_origin(){
	var max_x = selected_obj[0][0][0], min_x = selected_obj[0][0][0], max_y = selected_obj[0][0][1], min_y = selected_obj[0][0][1];
	// Need to translate the selected object to the origin
	for(var i=1; i<selected_obj.length; ++i){
		if(selected_obj[i][0][0]> max_x){
			max_x = selected_obj[i][0][0];
		}
		if(selected_obj[i][0][0]< min_x){
			min_x = selected_obj[i][0][0];
		}
		if(selected_obj[i][0][1]> max_y){
			max_y = selected_obj[i][0][1];
		}
		if(selected_obj[i][0][1] < min_y){
			min_y = selected_obj[i][0][1];
		}
	}	
	return vec2((max_x + min_x)/2, (max_y + min_y)/2);
}
function translate(w, translate_by_x, translate_by_y){
	return vec2((w[0] + translate_by_x), (w[1] + translate_by_y));
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

// Calculate World Coordinates from Device Coordinates
function deviceToWorld(d_x, d_y){
	var w_x = (w_width*d_x/canvas.width) + w_X_min;
	var w_y = (w_height*(canvas.height-d_y)/canvas.height) + w_Y_min;
	
	return vec2(w_x, w_y);
}

// Calculate Device Coordinates from World Coordinates
function worldToDevice(w_x, w_y){
	var d_x = (w_x-w_X_min)*canvas.width/w_width;
	var d_y = canvas.height - ((w_y-w_Y_min)*canvas.height/w_height);
	
	return vec2(d_x, d_y);
}

// Calculate NDC Coordinates from World Coordinates
function worldToNDC(w_x, w_y){
	var ndc_x = (2*(w_x-w_X_min)/w_width)-1;
	var ndc_y = (2*(w_y-w_Y_min)/w_height)-1;
	
	return vec2(ndc_x, ndc_y);
}

// Calculate World Coordinates from NDC Coordinates
function NDCToWorld(ndc_x, ndc_y){
	var w_x = ((ndc_x + 1)*w_width/2) + w_X_min;
	var w_y = ((ndc_x + 1)*w_height/2) + w_Y_min;;
	
	return vec2(w_x, w_y);
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
