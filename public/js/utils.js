import {
    BufferGeometry,
    BufferAttribute,
    //Geometry,
    LineBasicMaterial,
    Vector3,
    LineSegments,
    Line,
    CanvasTexture,
    UVMapping,
    RepeatWrapping, 
    ClampToEdgeWrapping,
    LinearFilter,
    NearestFilter,
    RGBFormat,
    RedFormat,
    UnsignedByteType,
} from '../lib/three.js'

export const pass_geometry = new BufferGeometry()
pass_geometry.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3))
pass_geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0]), 2))

let a0, a1, a2, a3, b1, b2, left_corner, right_corner;

// генерирует сетку
// w,h   - ширина
// cx,cy - сетка
// ox,oy - смещение
export const generate_grid = (w, h, cx, cy, ox, oy)=>{
    let a1x = 0, a2x = 0, a3x = 0, a4x = 0,
        a1y = 0, a2y = 0, a3y = 0, a4y = 0,
        u1x = 0, u2x = 0, u3x = 0, u4x = 0,
        u1y = 0, u2y = 0, u3y = 0, u4y = 0;
    let buff_p = new Float32Array(cx * cy * 18)
    let buff_u = new Float32Array(cx * cy * 12)
    let p1 = 0
    let p2 = 0
    let dx = w / cx
    let dy = h / cy
    let ux = 1 / cx
    let vx = 1 / cy
    let sw = true
    for (let y = 0; y < cy; y++) {
        for (let x = 0; x < cx; x++) {
            //
            // a1  a2
            // a4  a3
            //
            a1x = x * dx + 0 + ox;  a1y = y * dy + 0 + oy;
            a2x = x * dx + dx + ox; a2y = y * dy + 0 + oy;
            a3x = x * dx + dx + ox; a3y = y * dy + dy + oy;
            a4x = x * dx + 0 + ox;  a4y = y * dy + dy + oy;

            u1x = x * ux + 0;  u1y = (y * vx + 0);
            u2x = x * ux + ux; u2y = (y * vx + 0);
            u3x = x * ux + ux; u3y = (y * vx + vx);
            u4x = x * ux + 0;  u4y = (y * vx + vx);

            buff_p[p1 + 0]  = a1x;  buff_p[p1 + 2]  = a1y;
            buff_p[p1 + 6]  = a2x;  buff_p[p1 + 8]  = a2y;
            buff_p[p1 + 12] = a4x;  buff_p[p1 + 14] = a4y;
            buff_p[p1 + 15] = a3x;  buff_p[p1 + 17] = a3y;
            buff_u[p2 + 0]  = u1x;  buff_u[p2 + 1]  = u1y;
            buff_u[p2 + 4]  = u2x;  buff_u[p2 + 5]  = u2y;
            buff_u[p2 + 8]  = u4x;  buff_u[p2 + 9]  = u4y;
            buff_u[p2 + 10] = u3x;  buff_u[p2 + 11] = u3y;
            if (sw) {
                buff_p[p1 + 3] = a3x;  buff_p[p1 + 5] = a3y;
                buff_p[p1 + 9] = a1x;  buff_p[p1 + 11] = a1y;

                buff_u[p2 + 2] = u3x;  buff_u[p2 + 3] = u3y;
                buff_u[p2 + 6] = u1x;  buff_u[p2 + 7] = u1y;
            } else {
                buff_p[p1 + 3] = a4x;  buff_p[p1 + 5] = a4y;
                buff_p[p1 + 9] = a2x;  buff_p[p1 + 11] = a2y;

                buff_u[p2 + 2] = u4x;  buff_u[p2 + 3] = u4y;
                buff_u[p2 + 6] = u2x;  buff_u[p2 + 7] = u2y;
            }
            sw = !sw

            p1 = p1 + 18;
            p2 = p2 + 12;
        }
        sw = !sw
    }
    let geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(buff_p, 3))
    geometry.setAttribute('uv', new BufferAttribute(buff_u, 2))
    return geometry;
}

// гекс
export const generate_hex = ()=>{
    const scale = 1.0
    let a1x =  0.0 * scale, a1y = -0.50 * scale;
    let a2x =  0.5 * scale, a2y = -0.25 * scale; //0.433 - идеальный гекс
    let a3x =  0.5 * scale, a3y =  0.25 * scale;
    let a4x =  0.0 * scale, a4y =  0.50 * scale;
    let a5x = -0.5 * scale, a5y =  0.25 * scale;
    let a6x = -0.5 * scale, a6y = -0.25 * scale;
    //
    //    a1 
    // a6    a2
    // a5    a3 
    //    a4   
    //     
    const buff_p = new Float32Array(6*3*3)

    let p1 = 0
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a1x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a1y;
    buff_p[p1+6]  = a2x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a2y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a2x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a2y;
    buff_p[p1+6]  = a3x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a3y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a3x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a3y;
    buff_p[p1+6]  = a4x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a4y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a4x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a4y;
    buff_p[p1+6]  = a5x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a5y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a5x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a5y;
    buff_p[p1+6]  = a6x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a6y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a6x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a6y;
    buff_p[p1+6]  = a1x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a1y;
    p1 = p1 + 9

    const geometry = new BufferGeometry()
    geometry.setAttribute( 'position', new BufferAttribute( buff_p, 3 ) )
    return geometry
}
/*

export const hex_selector = (color, scale)=> {
    let material = new LineBasicMaterial({
        color: color //0x555555
    })
    let geometry = new Geometry()
    //
    let h1 = 0.01
    let h2 = 0.02

    let a1x =  0.0 * scale, a1y = -0.5  * scale;
    let a2x =  0.5 * scale, a2y = -0.25 * scale; //0.433 - идеальный гекс
    let a3x =  0.5 * scale, a3y =  0.25 * scale;
    let a4x =  0.0 * scale, a4y =  0.5  * scale;
    let a5x = -0.5 * scale, a5y =  0.25 * scale;
    let a6x = -0.5 * scale, a6y = -0.25 * scale;
    //
    //    a1 
    // a6    a2
    // a5    a3 
    //    a4   
    //     

    geometry.vertices.push(
        new Vector3(a1x, h1, a1y),
        new Vector3(a2x, h1, a2y),

        new Vector3(a2x, h1, a2y),
        new Vector3(a3x, h1, a3y),

        new Vector3(a3x, h1, a3y),
        new Vector3(a4x, h1, a4y),

        new Vector3(a4x, h1, a4y),
        new Vector3(a5x, h1, a5y),

        new Vector3(a5x, h1, a5y),
        new Vector3(a6x, h1, a6y),

        new Vector3(a6x, h1, a6y),
        new Vector3(a1x, h1, a1y),
        //
        new Vector3(a1x, h2, a1y),
        new Vector3(a2x, h2, a2y),

        new Vector3(a2x, h2, a2y),
        new Vector3(a3x, h2, a3y),

        new Vector3(a3x, h2, a3y),
        new Vector3(a4x, h2, a4y),

        new Vector3(a4x, h2, a4y),
        new Vector3(a5x, h2, a5y),

        new Vector3(a5x, h2, a5y),
        new Vector3(a6x, h2, a6y),

        new Vector3(a6x, h2, a6y),
        new Vector3(a1x, h2, a1y),

    )
    return new LineSegments(geometry, material)
}
*/

export const draw_line = (o1,o2)=>{
    const material = new LineBasicMaterial({
        color: 0xff0000,
    })

    let oo1 = [0,0,0]
    let oo2 = [0,0,0]
    
    let scale = 36/128
    oo1[0] = (o1[0]*scale - 18)
    oo1[1] = o1[1]
    oo1[2] = (o1[2]*scale - 18)

    oo2[0] = (o2[0]*scale - 18)
    oo2[1] =  o2[1]
    oo2[2] = (o2[2]*scale - 18)
    

    const geometry = new BufferGeometry().setFromPoints(     
        [
            new Vector3( oo1[0], oo1[1], oo1[2] ),
            new Vector3( oo2[0], oo2[1], oo2[2] ) 
        ]
   )
    
    return new Line( geometry, material )
}


export const bytesToSize = (bytes)=>{
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes == 0) return '0 Byte'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
 }


const parallelTraverse = ( a, b, callback )=>{
	callback( a, b )
	for ( let i = 0; i < a.children.length; i ++ ) {
		parallelTraverse( a.children[ i ], b.children[ i ], callback )
	}
}

const sourceLookup = new Map()
const cloneLookup  = new Map()

export const fullClone = ( source )=> {
    sourceLookup.clear()
    cloneLookup.clear()

	const clone = source.clone()

	parallelTraverse( source, clone, ( sourceNode, clonedNode )=> {
		sourceLookup.set( clonedNode, sourceNode )
		cloneLookup.set( sourceNode, clonedNode )
	} )

	clone.traverse( ( node )=>{

		if ( ! node.isSkinnedMesh ) return

		const clonedMesh = node
		const sourceMesh = sourceLookup.get( node )
		const sourceBones = sourceMesh.skeleton.bones

		clonedMesh.skeleton = sourceMesh.skeleton.clone()
		clonedMesh.bindMatrix.copy( sourceMesh.bindMatrix )

		clonedMesh.skeleton.bones = sourceBones.map( b=>cloneLookup.get(b) )

		clonedMesh.bind( clonedMesh.skeleton, clonedMesh.bindMatrix )
	} )

    if (source.animations){
        clone.animations = source.animations
    }

	return clone
}

// Calculate Gaussian blur of an image using IIR filter
// The method is taken from Intel's white paper and code example attached to it:
// https://software.intel.com/en-us/articles/iir-gaussian-blur-filter
// -implementation-using-intel-advanced-vector-extensions


function gaussCoef(sigma) {
  if (sigma < 0.5) {
    sigma = 0.5;
  }

  var a = Math.exp(0.726 * 0.726) / sigma,
      g1 = Math.exp(-a),
      g2 = Math.exp(-2 * a),
      k = (1 - g1) * (1 - g1) / (1 + 2 * a * g1 - g2);

  a0 = k;
  a1 = k * (a - 1) * g1;
  a2 = k * (a + 1) * g1;
  a3 = -k * g2;
  b1 = 2 * g1;
  b2 = -g2;
  left_corner = (a0 + a1) / (1 - b1 - b2);
  right_corner = (a2 + a3) / (1 - b1 - b2);

  // Attempt to force type to FP32.
  return new Float32Array([ a0, a1, a2, a3, b1, b2, left_corner, right_corner ]);
}

function convolveRGBA(src, out, line, coeff, width, height) {
  // takes src image and writes the blurred and transposed result into out

  var rgba;
  var prev_src_r, prev_src_g, prev_src_b, prev_src_a;
  var curr_src_r, curr_src_g, curr_src_b, curr_src_a;
  var curr_out_r, curr_out_g, curr_out_b, curr_out_a;
  var prev_out_r, prev_out_g, prev_out_b, prev_out_a;
  var prev_prev_out_r, prev_prev_out_g, prev_prev_out_b, prev_prev_out_a;

  var src_index, out_index, line_index;
  var i, j;
  var coeff_a0, coeff_a1, coeff_b1, coeff_b2;

  for (i = 0; i < height; i++) {
    src_index = i * width;
    out_index = i;
    line_index = 0;

    // left to right
    rgba = src[src_index];

    prev_src_r = rgba & 0xff;
    prev_src_g = (rgba >> 8) & 0xff;
    prev_src_b = (rgba >> 16) & 0xff;
    prev_src_a = (rgba >> 24) & 0xff;

    prev_prev_out_r = prev_src_r * coeff[6];
    prev_prev_out_g = prev_src_g * coeff[6];
    prev_prev_out_b = prev_src_b * coeff[6];
    prev_prev_out_a = prev_src_a * coeff[6];

    prev_out_r = prev_prev_out_r;
    prev_out_g = prev_prev_out_g;
    prev_out_b = prev_prev_out_b;
    prev_out_a = prev_prev_out_a;

    coeff_a0 = coeff[0];
    coeff_a1 = coeff[1];
    coeff_b1 = coeff[4];
    coeff_b2 = coeff[5];

    for (j = 0; j < width; j++) {
      rgba = src[src_index];
      curr_src_r = rgba & 0xff;
      curr_src_g = (rgba >> 8) & 0xff;
      curr_src_b = (rgba >> 16) & 0xff;
      curr_src_a = (rgba >> 24) & 0xff;

      curr_out_r = curr_src_r * coeff_a0 + prev_src_r * coeff_a1 + prev_out_r * coeff_b1 + prev_prev_out_r * coeff_b2;
      curr_out_g = curr_src_g * coeff_a0 + prev_src_g * coeff_a1 + prev_out_g * coeff_b1 + prev_prev_out_g * coeff_b2;
      curr_out_b = curr_src_b * coeff_a0 + prev_src_b * coeff_a1 + prev_out_b * coeff_b1 + prev_prev_out_b * coeff_b2;
      curr_out_a = curr_src_a * coeff_a0 + prev_src_a * coeff_a1 + prev_out_a * coeff_b1 + prev_prev_out_a * coeff_b2;

      prev_prev_out_r = prev_out_r;
      prev_prev_out_g = prev_out_g;
      prev_prev_out_b = prev_out_b;
      prev_prev_out_a = prev_out_a;

      prev_out_r = curr_out_r;
      prev_out_g = curr_out_g;
      prev_out_b = curr_out_b;
      prev_out_a = curr_out_a;

      prev_src_r = curr_src_r;
      prev_src_g = curr_src_g;
      prev_src_b = curr_src_b;
      prev_src_a = curr_src_a;

      line[line_index] = prev_out_r;
      line[line_index + 1] = prev_out_g;
      line[line_index + 2] = prev_out_b;
      line[line_index + 3] = prev_out_a;
      line_index += 4;
      src_index++;
    }

    src_index--;
    line_index -= 4;
    out_index += height * (width - 1);

    // right to left
    rgba = src[src_index];

    prev_src_r = rgba & 0xff;
    prev_src_g = (rgba >> 8) & 0xff;
    prev_src_b = (rgba >> 16) & 0xff;
    prev_src_a = (rgba >> 24) & 0xff;

    prev_prev_out_r = prev_src_r * coeff[7];
    prev_prev_out_g = prev_src_g * coeff[7];
    prev_prev_out_b = prev_src_b * coeff[7];
    prev_prev_out_a = prev_src_a * coeff[7];

    prev_out_r = prev_prev_out_r;
    prev_out_g = prev_prev_out_g;
    prev_out_b = prev_prev_out_b;
    prev_out_a = prev_prev_out_a;

    curr_src_r = prev_src_r;
    curr_src_g = prev_src_g;
    curr_src_b = prev_src_b;
    curr_src_a = prev_src_a;

    coeff_a0 = coeff[2];
    coeff_a1 = coeff[3];

    for (j = width - 1; j >= 0; j--) {
      curr_out_r = curr_src_r * coeff_a0 + prev_src_r * coeff_a1 + prev_out_r * coeff_b1 + prev_prev_out_r * coeff_b2;
      curr_out_g = curr_src_g * coeff_a0 + prev_src_g * coeff_a1 + prev_out_g * coeff_b1 + prev_prev_out_g * coeff_b2;
      curr_out_b = curr_src_b * coeff_a0 + prev_src_b * coeff_a1 + prev_out_b * coeff_b1 + prev_prev_out_b * coeff_b2;
      curr_out_a = curr_src_a * coeff_a0 + prev_src_a * coeff_a1 + prev_out_a * coeff_b1 + prev_prev_out_a * coeff_b2;

      prev_prev_out_r = prev_out_r;
      prev_prev_out_g = prev_out_g;
      prev_prev_out_b = prev_out_b;
      prev_prev_out_a = prev_out_a;

      prev_out_r = curr_out_r;
      prev_out_g = curr_out_g;
      prev_out_b = curr_out_b;
      prev_out_a = curr_out_a;

      prev_src_r = curr_src_r;
      prev_src_g = curr_src_g;
      prev_src_b = curr_src_b;
      prev_src_a = curr_src_a;

      rgba = src[src_index];
      curr_src_r = rgba & 0xff;
      curr_src_g = (rgba >> 8) & 0xff;
      curr_src_b = (rgba >> 16) & 0xff;
      curr_src_a = (rgba >> 24) & 0xff;

      rgba = ((line[line_index] + prev_out_r) << 0) +
        ((line[line_index + 1] + prev_out_g) << 8) +
        ((line[line_index + 2] + prev_out_b) << 16) +
        ((line[line_index + 3] + prev_out_a) << 24);

      out[out_index] = rgba;

      src_index--;
      line_index -= 4;
      out_index -= height;
    }
  }
}


function blurRGBA(src, width, height, radius) {
  // Quick exit on zero radius
  if (!radius) { return; }

  // Unify input data type, to keep convolver calls isomorphic
  var src32 = new Uint32Array(src.buffer);

  var out      = new Uint32Array(src32.length),
      tmp_line = new Float32Array(Math.max(width, height) * 4);

  var coeff = gaussCoef(radius);

  convolveRGBA(src32, out, tmp_line, coeff, width, height, radius);
  convolveRGBA(out, src32, tmp_line, coeff, height, width, radius);
}


export const create_hexgrid_texture = (texture_size, line_width, _scale, blur_radius)=>{
    const scale = 0.5*texture_size/3

    //       a1
    //   a6      a2
    //   a5      a3
    //       a4
    //
    let a1x =  0.0 * scale, a1y = -1.0 * scale
    let a2x =  1.0 * scale, a2y = -0.5 * scale //0.433 - идеальный гекс
    let a3x =  1.0 * scale, a3y =  0.5 * scale
    let a4x =  0.0 * scale, a4y =  1.0 * scale
    let a5x = -1.0 * scale, a5y =  0.5 * scale
    let a6x = -1.0 * scale, a6y = -0.5 * scale

    a1x = a1x * _scale
    a2x = a2x * _scale
    a3x = a3x * _scale
    a4x = a4x * _scale
    a5x = a5x * _scale
    a6x = a6x * _scale

    a1y = a1y * _scale
    a2y = a2y * _scale
    a3y = a3y * _scale
    a4y = a4y * _scale
    a5y = a5y * _scale
    a6y = a6y * _scale

    const c   = document.createElement('canvas')
    c.style.position = 'absolute'
    //c.style.left = 0
    //c.style.top = 0
    c.width   = texture_size
    c.height  = texture_size
    const ctx = c.getContext('2d')

    //window.document.body.appendChild(c)

    //ctx.filter = 'blur(1px)'
    
    ctx.strokeStyle = "rgba(255,255,255,1.0)"
    //ctx.fillStyle = "rgba(255,255,255,1.0)"
    ctx.lineWidth = line_width
    ctx.lineCap   = 'round'  // butt round square
    ctx.lineJoin  = 'round' // round bevel miter 

    ctx.beginPath()

    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 4; x++) {

            let dx = x*2*scale
            let dy = y*3*scale

            ctx.moveTo(a1x+dx, (a1y+dy))
            ctx.lineTo(a2x+dx, (a2y+dy))
            ctx.lineTo(a3x+dx, (a3y+dy))
            ctx.lineTo(a4x+dx, (a4y+dy))
            ctx.lineTo(a5x+dx, (a5y+dy))
            ctx.lineTo(a6x+dx, (a6y+dy))
            ctx.lineTo(a1x+dx, (a1y+dy))
            ctx.stroke()

            dx = x*2*scale + 1*scale
            dy = y*3*scale + 1.5*scale

            ctx.moveTo(a1x+dx, (a1y+dy))
            ctx.lineTo(a2x+dx, (a2y+dy))
            ctx.lineTo(a3x+dx, (a3y+dy))
            ctx.lineTo(a4x+dx, (a4y+dy))
            ctx.lineTo(a5x+dx, (a5y+dy))
            ctx.lineTo(a6x+dx, (a6y+dy))
            ctx.lineTo(a1x+dx, (a1y+dy))
            ctx.stroke()

        }
    }
    
    if (blur_radius!==0){
        const imageData = ctx.getImageData(0, 0, texture_size, texture_size)
        blurRGBA(imageData.data, texture_size, texture_size, blur_radius)
        ctx.putImageData(imageData, 0, 0)
    }

    const t = new CanvasTexture(
        c,
        UVMapping,
        RepeatWrapping, //ClampToEdgeWrapping,
        RepeatWrapping, //ClampToEdgeWrapping,
        LinearFilter,
        NearestFilter,
        RedFormat,
        UnsignedByteType,
        1
    )

    t.generateMipmaps = false
    return t
}

export const create_selector_mesh = (scale)=>{

    let a1x =  0.0 * scale, a1y = -1.0 * scale
    let a2x =  1.0 * scale, a2y = -0.5 * scale //0.433 - идеальный гекс
    let a3x =  1.0 * scale, a3y =  0.5 * scale
    let a4x =  0.0 * scale, a4y =  1.0 * scale
    let a5x = -1.0 * scale, a5y =  0.5 * scale
    let a6x = -1.0 * scale, a6y = -0.5 * scale
    //    a1 
    // a6    a2
    // a5    a3 
    //    a4   

    const points = [
        new Vector3(a1x, 0, a1y), new Vector3(a2x, 0, a2y),
        new Vector3(a2x, 0, a2y), new Vector3(a3x, 0, a3y),
        new Vector3(a3x, 0, a3y), new Vector3(a4x, 0, a4y),
        new Vector3(a4x, 0, a4y), new Vector3(a5x, 0, a5y),
        new Vector3(a5x, 0, a5y), new Vector3(a6x, 0, a6y),
        new Vector3(a6x, 0, a6y), new Vector3(a1x, 0, a1y),
    ]
   
    const geometry = new BufferGeometry().setFromPoints( points )
    
    const a = new LineSegments(
        geometry, 
        new LineBasicMaterial({ 
            color: 0xffffff,
            //opacity: 0.4,
            //transparent: true,
        }),
    )

    return a
}