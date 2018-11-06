

var canvas;
var gl;
var program;
var NumVertices  = 36;

var pointsArray = [];
var colorsArray = [];

var vertices = [
    vec4(-0.5, -0.5,  1.5, 1.0),
    vec4(-0.5,  0.5,  1.5, 1.0),
    vec4(0.5,  0.5,  1.5, 1.0),
    vec4(0.5, -0.5,  1.5, 1.0),
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5,  0.5, 0.5, 1.0),
    vec4(0.5,  0.5, 0.5, 1.0),
    vec4( 0.5, -0.5, 0.5, 1.0) 
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
];


var near = -1.0;
var far = 1.0;
var left = -1.0;
var right = 1.0;
var bottom = -1.0;
var _top = 1.0;
var radius = 4.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio
var eye = vec3(0.0, 0.0, -3.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var mvMatrix, pMatrix;
var modelView, projection;

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[b]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[c]); 
     colorsArray.push(vertexColors[a]);     
     pointsArray.push(vertices[a]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[c]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[d]); 
     colorsArray.push(vertexColors[a]);  
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

//	gl.viewport( 0, 0, canvas.width/2, canvas.height/2 );
	gl.viewport( canvas.width/2, canvas.height/2, canvas.width/2, canvas.height/2 );
    
    aspect =  canvas.width/canvas.height;
    
//	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    loadVertices(false);

	modelView = gl.getUniformLocation( program, "modelView" );
    projection = gl.getUniformLocation( program, "projection" );
								// initialize view
					
	// Sliders for eye
	document.getElementById("eye_x").oninput = function(event){
		eye[0] = parseFloat(document.getElementById("eye_x").value);
	};
	document.getElementById("eye_y").oninput = function(event){
		eye[1] = parseFloat(document.getElementById("eye_y").value);
	};
	document.getElementById("eye_z").oninput = function(event){
		eye[2] = parseFloat(document.getElementById("eye_z").value);
	};
	// Slider for Near 
	document.getElementById("near").oninput = function(event){
		near = parseFloat(document.getElementById("near").value);
	};
	// Slider for Far 
	document.getElementById("far").oninput = function(event){
		far = parseFloat(document.getElementById("far").value);
	};
	
	// Sliders for at variable
	document.getElementById("at_x").oninput = function(event){
		at[0] = parseFloat(document.getElementById("at_x").value);
	};
	document.getElementById("at_y").oninput = function(event){
		at[1] = parseFloat(document.getElementById("at_y").value);
	};
	document.getElementById("at_z").oninput = function(event){
		at[2] = parseFloat(document.getElementById("at_z").value);
	};
	
	//Sliders for up variable.
	document.getElementById("up_x").oninput = function(event){
		up[0] = parseFloat(document.getElementById("up_x").value);
	};
	document.getElementById("up_y").oninput = function(event){
		up[1] = parseFloat(document.getElementById("up_y").value);
	};
	document.getElementById("up_z").oninput = function(event){
		up[2] = parseFloat(document.getElementById("up_z").value);
	};

	gl.enable(gl.SCISSOR_TEST);
    render(); 
}

function getIdentityMat(){
	var identityMat = mat4();
	identityMat[0][0] = 1.0;
	identityMat[1][1] = 1.0;
	identityMat[2][2] = 1.0;
	identityMat[3][3] = 1.0;
	return identityMat;
}
function getRotation( eye, at, up ){
	var v = normalize( subtract(at, eye) );  // view direction vector
    var n = normalize( cross(v, up) );       // perpendicular vector
    var u = normalize( cross(v, n) );        // "new" up vector
	
	v = negate( v );
	
	var m_rot = mat4(
        vec4( n, 0),
        vec4( u, 0),
        vec4( v, 0),
        vec4(0, 0, 0, 0)
    );
	return m_rot;
}

function getTranslation(eye){
	var trans = getIdentityMat();
	trans[0][3] = -eye[0];
	trans[1][3] = -eye[1];
	trans[2][3] = -eye[2];
	return trans;
}

function getCamera( eye, at, up ){
	var m_rot = getRotation( eye, at, up );
	var m_trans = getTranslation(eye);
	return mult(m_rot, m_trans);
}

function get_N1(){
	var N1 = getIdentityMat();
	N1[2][2] = -1*(far + near)/(far - near);
	N1[2][3] = -2*near*far/(far - near);
	N1[3][2] = -1;
	N1[3][3] = 0;
	return N1;
}

function get_N2(){
	var N2 = getIdentityMat();
	N2[0][0] = 2*near/(right-left);
	N2[1][1] = 2*near/(_top-bottom);
	return N2;
}

function getProjection(){
	var N1 = get_N1();
	var N2 = get_N2();
	return mult(N1, N2);
}
function loadVertices(withNearFarPlane){
	pointsArray = [];
	colorsArray = [];
	colorCube();
	if(withNearFarPlane){
		addNearFarPlaneVertices();
	}
	var cBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
	
	var vColor = gl.getAttribLocation( program, "vColor" );
	gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vColor);

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
	
	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );
	
}

function getFarPlaneCorordinate(point1, point2){
	var t = (far - point1[2])/(point1[2] - point2[2]);
	t = 2.0;
	var far_x = point1[0] + ((point1[0] - point2[0])*t);
	var far_y = point1[1] + ((point1[1] - point2[1])*t);
	return vec4(far_x, far_y, far, 1.0);
}

function addNearFarPlaneVertices(){
	// near plane
	pointsArray.push(vec4(left, bottom, near, 1.0));   
	colorsArray.push(vec4( 1.0, 1.0, 0.0, 1.0 )); 	// yellow
	pointsArray.push(vec4(left, _top, near, 1.0)); 
	colorsArray.push(vec4( 1.0, 1.0, 0.0, 1.0 )); 	// yellow
	pointsArray.push(vec4(right, _top, near, 1.0)); 
	colorsArray.push(vec4( 1.0, 1.0, 0.0, 1.0 )); 	// yellow
	
	pointsArray.push(vec4(right, _top, near, 1.0)); 
	colorsArray.push(vec4( 1.0, 1.0, 0.0, 1.0 )); 	// yellow
	pointsArray.push(vec4(right, bottom, near, 1.0)); 
	colorsArray.push(vec4( 1.0, 1.0, 0.0, 1.0 )); 	// yellow
	pointsArray.push(vec4(left, bottom, near, 1.0)); 
	colorsArray.push(vec4( 1.0, 1.0, 0.0, 1.0 )); 	// yellow
	
	// far plane
	var far_left_bottom = getFarPlaneCorordinate(vec4(left, bottom, near, 1.0), eye);
	var far_left_top = getFarPlaneCorordinate(vec4(left, _top, near, 1.0), eye);
	var far_riht_top = getFarPlaneCorordinate(vec4(right, _top, near, 1.0), eye);
	var far_right_bottom = getFarPlaneCorordinate(vec4(right, bottom, near, 1.0), eye);
	pointsArray.push(far_left_bottom);  
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	pointsArray.push(far_left_top); 
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	pointsArray.push(far_riht_top); 
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	
	pointsArray.push(far_riht_top); 
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	pointsArray.push(far_right_bottom); 
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	pointsArray.push(far_left_bottom); 
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	
	// near-far bottom connection
	//pointsArray.push(vec4(left, bottom, near, 1.0)); 
	pointsArray.push(far_left_bottom); 
	colorsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));	// Blue
	pointsArray.push(vec4(eye, 1.0)); 
	colorsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));	// Blue
	
	pointsArray.push(vec4(eye, 1.0)); 
	colorsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));	// Blue
	pointsArray.push(far_right_bottom); 
	colorsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));	// Blue
	
	// near-far top connection
	
	//pointsArray.push(vec4(left, _top, near, 1.0)); 
	pointsArray.push(vec4(eye, 1.0)); 
	colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));	// Red
	pointsArray.push(far_left_top); 
	colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));	// Red
	
	//pointsArray.push(vec4(right, _top, near, 1.0)); 
	pointsArray.push(vec4(eye, 1.0)); 
	colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));	// Red
	pointsArray.push(far_riht_top); 
	colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));	// Red
	
	
	/// X axis
	pointsArray.push(vec4(0, 0, 0, 1.0)); 
	colorsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));	// Blue
	pointsArray.push(vec4(3.0, 0, 0, 1.0)); 
	colorsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));	// Blue
	
	pointsArray.push(vec4(0, 0, 0, 1.0));
	colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));	// White
	pointsArray.push(vec4(-3.0, 0, 0, 1.0));
	colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));	// White
	
	// Y axis
	pointsArray.push(vec4(0, 0, 0, 1.0)); 
	colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));	// Red
	pointsArray.push(vec4(0, 3, 0, 1.0));
	colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));	// Red
	 
	pointsArray.push(vec4(0, 0, 0, 1.0));
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	pointsArray.push(vec4(0, -3, 0, 1.0)); 
	colorsArray.push(vec4( 1.0, 0.0, 1.0, 1.0 )); 	// magenta
	
	// Z axis
	pointsArray.push(vec4(0, 0, 0, 1.0)); 
	colorsArray.push(vec4( 0.0, 0.0, 0.0, 1.0 ));	// Black
	pointsArray.push(vec4(0, 0, 3, 1.0));
	colorsArray.push(vec4( 0.0, 0.0, 0.0, 1.0 ));	// Black
	 
	pointsArray.push(vec4(0, 0, 0, 1.0));
	colorsArray.push(vec4( 0.0, 1.0, 0.0, 1.0 )); 	// Green
	pointsArray.push(vec4(0, 0, -3, 1.0)); 
	colorsArray.push(vec4( 0.0, 1.0, 0.0, 1.0 )); 	// Green
	
	
}

//Takes a matrix and returns an html table
function matToTable(mat, label){
    var out = "<table>"; //Start the table
    out += "<tr> <th colspan = '" + mat[0].length +"'>" + label + "</th></tr>";
    for (var i = 0; i < mat.length; i++) {
        out += "<tr>"; //Start a row
        for (var j = 0; j < mat[i].length; j++){
            out += "<td>" + mat[i][j].toFixed(2) + "</td>"; //Add an entry
        }
        out += "</tr>"; //End the row
    }
   
    out += "</table>"; //Close the table
    return out;
}
 
function updateMatrices(M_camera, M_p, M_tot){
    var matDiv = document.getElementById("matrices");
    matDiv.innerHTML = matToTable(M_camera, "M_camera") + matToTable(M_p, "M_p") + matToTable(M_tot, "M_tot");
}

var render = function(){
	//var m_Camera = getCamera( eye, at, subtract(up, eye) );
	var m_Camera = getCamera( eye, at, up );
	var m_P = getProjection();
	var m_Tot = mult(m_P, m_Camera);
	updateMatrices(m_Camera, m_P, m_Tot);
					// specify fraction of viewport
	gl.viewport (0, 0, canvas.width/2, canvas.height);
	gl.scissor (0, 0, canvas.width/2, canvas.height);

					// set background
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv( modelView, false, flatten(m_Camera) );
    gl.uniformMatrix4fv( projection, false, flatten(m_P) );
	
	loadVertices(true);
            
    //gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
	/// Draw near and far plane
    gl.drawArrays( gl.TRIANGLES, NumVertices, 12 );
    gl.drawArrays( gl.LINES, NumVertices+20, 12 );


					// set view 2 -- look at back of cube (UR view) - sitting on +Z
	gl.viewport (canvas.width/2, 0, canvas.width/2, canvas.height);
	gl.scissor (canvas.width/2, 0, canvas.width/2, canvas.height);
					// set background
	gl.clearColor( 0.6, 0.6, 0.6, 1.0 );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var lookat = lookAt(eye, at, subtract(up, eye));
	var pMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelView, false, flatten(m_Camera) );
    gl.uniformMatrix4fv( projection, false, flatten(m_P) );

	loadVertices(false);
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    requestAnimFrame(render);
}

