
/**
 *  @param {object} options
 * *label*: used for menu
 * *samplers*: array of rasters {id:, type: } color, normals, etc.
 * *uniforms*:
 * *body*: code actually performing the rendering, needs to return a vec4
 * *name*: name of the body function
 */

class Shader {
	constructor(options) {
		Object.assign(this, {
			version: 100,   //check for webglversion.
			samplers: [],
			uniforms: {},
			name: "",
			body: "",
			program: null,      //webgl program
			needsUpdate: true
		});

		Object.assign(this, options);
	}

	setUniform(name, value) {
		let u = this.uniforms[name];
		u.value = value;
		u.needsUpdate = true;
	}

	createProgram(gl) {

		let vert = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vert, this.vertShaderSrc(100));

		gl.compileShader(vert);
		let compiled = gl.getShaderParameter(vert, gl.COMPILE_STATUS);
		if(!compiled) {
			console.log(gl.getShaderInfoLog(vert));
			throw Error("Failed vertex shader compilation: see console log and ask for support.");
		}

		let frag = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(frag, this.fragShaderSrc());
		gl.compileShader(frag);

		if(this.program)
			gl.deleteProgram(this.program);

		let program = gl.createProgram();

		gl.getShaderParameter(frag, gl.COMPILE_STATUS);
		compiled = gl.getShaderParameter(frag, gl.COMPILE_STATUS);
		if(!compiled) {
			console.log(this.fragShaderSrc())
			console.log(gl.getShaderInfoLog(frag));
			throw Error("Failed fragment shader compilation: see console log and ask for support.");
		}

		gl.attachShader(program, vert);
		gl.attachShader(program, frag);
		gl.linkProgram(program);

		if ( !gl.getProgramParameter( program, gl.LINK_STATUS) ) {
			var info = gl.getProgramInfoLog(program);
			throw new Error('Could not compile WebGL program. \n\n' + info);
		}

		//sampler units;
		for(let sampler of this.samplers)
			sampler.location = gl.getUniformLocation(program, sampler.name);

		this.coordattrib = gl.getAttribLocation(program, "a_position");
		gl.vertexAttribPointer(this.coordattrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.coordattrib);

		this.texattrib = gl.getAttribLocation(program, "a_texcoord");
		gl.vertexAttribPointer(this.texattrib, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texattrib);

		this.matrixlocation = gl.getUniformLocation(program, "u_matrix");

		this.program = program;
		this.needsUpdate = false;
	}

	updateUniforms(gl, program) {
		for(const [name, uniform] of Object.entries(this.uniforms)) {
			if(!uniform.location)
				uniform.location = gl.getUniformLocation(program, name);

			if(!uniform.location)  //uniform not used in program
				continue; 

			if(uniform.needsUpdate) {
				console.log('');
				switch(uniform.type) {
					case 'vec4': gl.uniform4fv(uniform.location, uniform.value); break;
					case 'vec3': gl.uniform3fv(uniform.location, uniform.value); break;
					case 'vec2': gl.uniform2fv(uniform.location, uniform.value); break;
					case 'float': gl.uniform1fv(uniform.location, uniform.value); break;
					case 'int': gl.uniform1i(uniform.location, uniform.value); break;
				throw Error('Unknown uniform type: ' + u.type);
				}
				uniform.needsUpdate = false;
			}
		} 
	}

	vertShaderSrc() {
		return `#version 300 es

precision highp float; 
precision highp int; 

uniform mat4 u_matrix;
in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
	gl_Position = u_matrix * a_position;
	v_texcoord = a_texcoord;
}`;
	}

	fragShaderSrc() {
		return this.body;
	}
}


export { Shader }