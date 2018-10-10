
var canvas;
var gl;

var draw = true;
var pick = false;
var object_selected = false;
var selected_obj = 0;
var selected_obj_index = 0;
var cBuffer;

// Track mouse dragging
var clicked = false;

// Rotation
var theta = 0.0;
var thetaLoc;

// Scalling factor
var scale = 1.0;
var scaleloc;

// Translate to the X axis
var trans_x = 0;
var transloc_x;
// Translate to the Y axis
var trans_y = 0;
var transloc_y;

var start_pos;
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
var primitive_type = 0;

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
	
	var vBuffer = gl.createBuffer();
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
    
	thetaLoc = gl.getUniformLocation( program, "theta" );
    scaleloc = gl.getUniformLocation( program, "scale" );
    transloc_x = gl.getUniformLocation( program, "trans_x" );
    transloc_y = gl.getUniformLocation( program, "trans_y" );
	
	// Track mouse down
	canvas.addEventListener("mousedown", function(event){
		clicked = true;
		if(!draw){
			// Calculate World Coordinates
			var w = deviceToWorld(event.clientX, event.clientY);
			// Calculate NDC Coordinates
			var t = worldToNDC(w[0], w[1]);
			
			// Assign different coordinates value in the text box
			document.getElementById("device_x" ).value = event.clientX;
			document.getElementById("device_y" ).value = event.clientY;
			document.getElementById("ndc_x" ).value = t[0];
			document.getElementById("ndc_y" ).value = t[1];
			document.getElementById("world_x" ).value = w[0];
			document.getElementById("world_y" ).value = w[1];
			found =false;
			for ( var i = 0; i < vertices_list.length; ++i ) {
				for ( var j = 0; j < vertices_list[i].length; ++j ) {
					if(Math.round(vertices_list[i][j][0][0])+15 >= Math.round(w[0]) && Math.round(vertices_list[i][j][0][0])-15 <= Math.round(w[0]) &&  Math.round(vertices_list[i][j][0][1])+15 >= Math.round(w[1]) &&  Math.round(vertices_list[i][j][0][1])-15 <= Math.round(w[1])){
						selected_obj = [];
						object_selected = true;
						found = true;
						break;
					}
				}
				if(found){
					selected_obj = vertices_list[i];
					gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
					for(var j=0; j<selected_obj.length; ++j){
						gl.bufferSubData(gl.ARRAY_BUFFER, 16*selected_obj[j][2], flatten(vec4(1.0, (j+1)/3, (j/2), 1.0)));
					}
					
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
			// Calculate NDC Coordinates
			var end_pos = deviceToWorld(event.clientX, event.clientY);
			trans_x = end_pos[0] - start_pos[0];
			trans_y = end_pos[1] - start_pos[1];
			for(var i=0; i<selected_obj.length; ++i){
				selected_obj[i][0][0] += trans_x;	
				selected_obj[i][0][1] += trans_y;	
				var result = worldToNDC(selected_obj[i][0][0], selected_obj[i][0][1]);
				gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 8*selected_obj[i][2], flatten(result));
			}
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
					cl = vec4(colors[color_index]);
					gl.bufferSubData(gl.ARRAY_BUFFER, 16*line_index, flatten(cl));
					line_vertext_list.push([w, primitive_type, line_index]);
					line_vertext_count++;
					if(line_vertext_count == 2){
						line_vertext_count = 0;
						vertices_list.push(line_vertext_list);
						line_vertext_list = [];
					}
					line_index++;
					break;
				case 1:
					gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangle_index + triangle_start_pos), flatten(t));

					gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
					cl = vec4(colors[color_index]);
					gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangle_index + triangle_start_pos), flatten(cl));
					
					triangle_vertext_list.push([w, primitive_type, (triangle_index + triangle_start_pos)]);
					triangle_vertext_count++;
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
	document.getElementById("draw_primitives" ).onclick = function(event) {
		draw = true;
		pick = false;
		object_selected = false;
	};
	document.getElementById("pick_primitives" ).onclick = function(event) {
		draw = false;
		pick = true;
	};
	document.getElementById("rotate_left" ).onclick = function(event) {

		var max_x = selected_obj[0][0][0], min_x = selected_obj[0][0][0], max_y = selected_obj[0][0][1], min_y = selected_obj[0][0][1];
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
		var translate_x_by = (max_x + min_x)/2;	
		var translate_y_by = (max_y + min_y)/2;

		var s = Math.sin( -0.01 );
		var c = Math.cos( -0.01 );

		for(var i=0; i<selected_obj.length; ++i){
			selected_obj[i][0][0] = selected_obj[i][0][0] - translate_x_by;
			selected_obj[i][0][1] = selected_obj[i][0][1] - translate_y_by;
			var r_x = -s * selected_obj[i][0][0] + c * selected_obj[i][0][1];	
			var r_y = s * selected_obj[i][0][1] + c * selected_obj[i][0][0];
			selected_obj[i][0][0] = r_x + translate_x_by;
			selected_obj[i][0][1] = r_y + translate_y_by;
			var result = worldToNDC(selected_obj[i][0][0], selected_obj[i][0][1]);
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 8*selected_obj[i][2], flatten(result));
		}
	};
	document.getElementById("rotate_right" ).onclick = function(event) {
		
		var max_x = selected_obj[0][0][0], min_x = selected_obj[0][0][0], max_y = selected_obj[0][0][1], min_y = selected_obj[0][0][1];
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
		var translate_x_by = (max_x + min_x)/2;	
		var translate_y_by = (max_y + min_y)/2;
		var s = Math.sin( 0.01 );
		var c = Math.cos( 0.01 );

		for(var i=0; i<selected_obj.length; ++i){
			selected_obj[i][0][0] = selected_obj[i][0][0] - translate_x_by;
			selected_obj[i][0][1] = selected_obj[i][0][1] - translate_y_by;
			var r_x = -s * selected_obj[i][0][0] + c * selected_obj[i][0][1];	
			var r_y = s * selected_obj[i][0][1] + c * selected_obj[i][0][0];
			selected_obj[i][0][0] = r_x + translate_x_by;
			selected_obj[i][0][1] = r_y + translate_y_by;
			var result = worldToNDC(selected_obj[i][0][0], selected_obj[i][0][1]);
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 8*selected_obj[i][2], flatten(result));
		}
	};
	document.getElementById("btn_scale").onclick = function() {
		var max_x = selected_obj[0][0][0], min_x = selected_obj[0][0][0], max_y = selected_obj[0][0][1], min_y = selected_obj[0][0][1];
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
		var translate_x_by = (max_x + min_x)/2;	
		var translate_y_by = (max_y + min_y)/2;

        	var scale = document.getElementById("in_scale" ).value;
		for(var i=0; i<selected_obj.length; ++i){
			selected_obj[i][0][0] = selected_obj[i][0][0] - translate_x_by;
			selected_obj[i][0][1] = selected_obj[i][0][1] - translate_y_by;

			selected_obj[i][0][0] *= scale;	
			selected_obj[i][0][1] *= scale;	
			
			selected_obj[i][0][0] = selected_obj[i][0][0] + translate_x_by;
			selected_obj[i][0][1] = selected_obj[i][0][1] + translate_y_by;

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
