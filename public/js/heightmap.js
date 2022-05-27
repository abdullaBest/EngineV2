/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as RENDER  from './render.js'
import * as UTILS   from './utils.js'
import * as ASSETS  from './assets.js'
import * as INFO    from './info.mjs'
import {
    ShaderMaterial,
    DoubleSide,
    Mesh,
} from '/lib/three.js'

let heightmap                   = null
let heightmap2                  = null
let maxHeight                   = 512               // максимальная высота
let heightmap_data              = null              //
let width                       = 0
let pixel_step                  = 0
export let needs_update_data    = false

const _origin    = [0,0,0]
const _direction = [0,0,0]
const _edge1     = [0,0,0]
const _edge2     = [0,0,0]
const _edge3     = [0,0,0]
const _normal$1  = [0,0,0]
const _diff      = [0,0,0]
const _a         = [0,0,0]
const _b         = [0,0,0]
const _c         = [0,0,0]
const _d         = [0,0,0]

const hm_mesh     = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        w    : { value: 0.0 },
        max  : { value: 0.0 },
        mask : { value: null },
        hm   : { value: null },
        scale: { value: 1.0 },
        rx   : { value: 0.0 },
        ry   : { value: 0.0 },
        power: { value: 0.1 },
    },
    vertexShader: [
        'varying vec2 lUv;',
        'uniform float scale;',
        'uniform float rx;',
        'uniform float ry;',
        'void main() {',
            'lUv = uv;',
        'gl_Position = vec4( rx+position.x*scale,ry+position.y*scale,0.0, 1.0 );',
        '}'].join(''),
    fragmentShader: [
        'uniform sampler2D mask;',
        'uniform sampler2D hm;',
        'uniform float w;',
        'uniform float max;',
        'uniform float power;',
        'varying vec2 lUv;',
        'void main(){',
            'vec2 lUv2 = vec2(gl_FragCoord.x/w,gl_FragCoord.y/w);',
            'float h = texture2D(hm, lUv2).r;',
            'vec4 cmask = texture2D(mask, lUv);',
            'float c = clamp(h + cmask.a*power,-max,max);',
            'gl_FragColor = vec4(c,c,c,1.0);',
        '}'].join(''),
    side        : DoubleSide,
    depthTest   : false,
    depthWrite  : false,
    transparent : false,
}))

const solid_mesh  = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        w    : { value: 0.0 },
        max  : { value: 0.0 },
        mask : { value: null },
        hm   : { value: null },
        scale: { value: 1.0 },
        rx   : { value: 0.0 },
        ry   : { value: 0.0 },
        power: { value: 0.1 },
    },
    vertexShader: [
        'varying vec2 lUv;',
        'uniform float scale;',
        'uniform float rx;',
        'uniform float ry;',
        'void main() {',
            'lUv = uv;',
        'gl_Position = vec4( rx+position.x*scale,ry+position.y*scale,0.0, 1.0 );',
        '}'].join(''),
    fragmentShader: [
        'uniform sampler2D mask;',
        'uniform sampler2D hm;',
        'uniform float w;',
        'uniform float max;',
        'uniform float power;',
        'varying vec2 lUv;',
        'void main(){',
            'vec2 lUv2 = vec2(gl_FragCoord.x/w,gl_FragCoord.y/w);',
            'float h = texture2D(hm, lUv2).r;',
            'vec4 cmask = texture2D(mask, lUv);',
            'float c = mix(h,power,cmask.a);',
            'c = clamp(c,-max,max);',
            'gl_FragColor = vec4(c,c,c,1.0);',
        '}'].join(''),
    side       : DoubleSide,
    depthTest  : false,
    depthWrite : false,
    transparent: false,
}))

const blur_mesh   = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        w    : { value: 0.0 },
        max  : { value: 0.0 },
        hm   : { value: null },
        mask : { value: null },
        scale: { value: 1.0 },
        rx   : { value: 0.0 },
        ry   : { value: 0.0 },
        power: { value: 0.5 },
    },
    vertexShader: [
        'varying vec2 lUv;',
        'uniform float scale;',
        'uniform float rx;',
        'uniform float ry;',
        'void main() {',
            'lUv = uv;',
            'gl_Position = vec4( rx+position.x*scale,ry+position.y*scale,0.0, 1.0 );',
        '}'].join(''),
    fragmentShader: [
        'uniform sampler2D mask;',
        'uniform sampler2D hm;',
        'uniform float solid;',
        'varying vec2 lUv;',
        'uniform float power;',
        'uniform float w;',
        'uniform float max;',
        'vec4 kawaseBloom( vec2 uv, float iteration ) {',
            'vec2 texelSize = vec2( 1.0 / w );',
            'vec2 texelSize05 = texelSize * 0.5;',
    
            'vec2 uvOffset = texelSize.xy * vec2( iteration, iteration ) + texelSize05;',
    
            'vec2 texCoordSample;',
            'vec4 color;',
    
            'texCoordSample.x = uv.x - uvOffset.x;',
            'texCoordSample.y = uv.y + uvOffset.y;',
            'color = texture2D( hm, texCoordSample );',

            'texCoordSample.x = uv.x + uvOffset.x;',
            'texCoordSample.y = uv.y + uvOffset.y;',
            'color += texture2D( hm, texCoordSample );',
    
            'texCoordSample.x = uv.x + uvOffset.x;',
            'texCoordSample.y = uv.y - uvOffset.y;',
            'color += texture2D( hm, texCoordSample );',
    
            'texCoordSample.x = uv.x - uvOffset.x;',
            'texCoordSample.y = uv.y - uvOffset.y;',
            'color += texture2D( hm, texCoordSample );',
    
            'return color * 0.25;',
        '}',
        
/*        'vec4 blur5(sampler2D image, vec2 uv, float resolution) {',
            'vec4 color = vec4(0.0);',
            'vec2 off1 = vec2(1.3333333333333333/resolution,0);',
            'color += texture2D(image, uv) * 0.29411764705882354;',
            'color += texture2D(image, uv + off1) * 0.35294117647058826;',
            'color += texture2D(image, uv - off1) * 0.35294117647058826;',
            'return color;',
        '}',
  */      
        'void main(){',
            'vec2 lUv2 = vec2(gl_FragCoord.x/w,gl_FragCoord.y/w);',
            'vec4 cmask = texture2D(mask, lUv);',
            'vec4 c = kawaseBloom(lUv2,power);',
            //'vec4 c = blur5(hm,lUv2,512.0);',
            'float r = clamp(c.r,-max,max);',
            'gl_FragColor = vec4(r,r,r,1.0);',
        '}'].join(''),
    side       : DoubleSide,
    depthTest  : false,
    depthWrite : false,
    transparent: false,
}))

// распаковывает RGB текстуру в float буффер
const unpack_mesh = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        t   : { value: null },
        max : { value: 0.0  },
    },
    vertexShader: [
        'precision highp float;',
        'varying vec2 lUv;',
        'void main() {',
            'lUv = uv;',
            'gl_Position = vec4( position.x,position.y,0.0, 1.0 );',
        '}'].join(''),
    fragmentShader: [
        'precision highp float;',
        'uniform sampler2D t;',
        'uniform float max;',
        'varying vec2 lUv;',
        'void main(){',
            //'vec2 lUv2 = vec2(gl_FragCoord.x/w,gl_FragCoord.y/w);',
            'vec4 a = texture2D(t, lUv);',
            'a.r = a.r*255.0;',
            'a.g = a.g*255.0;',
            'a.b = a.b*255.0;',
            'float c = (a.r*256.0*256.0+a.g*256.0+a.b+1.0)/(256.0*256.0*256.0);',
            'c = (c-0.5)*2.0*max;',
            'gl_FragColor = vec4(c,c,c,1.0);',
        '}'].join(''),
    side       : DoubleSide,
    depthTest  : false,
    depthWrite : false,
    transparent: false,
}))

// распаковывает R текстуру в float буффер
const unpack_gray_mesh = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        t   : { value: null },
        max : { value: 0.0  },
    },
    vertexShader: [
        'precision highp float;',
        'varying vec2 lUv;',
        'void main() {',
            'lUv = uv;',
            'gl_Position = vec4( position.x,position.y,0.0, 1.0 );',
        '}'].join(''),
    fragmentShader: [
        'precision highp float;',
        'uniform sampler2D t;',
        'uniform float max;',
        'varying vec2 lUv;',
        'void main(){',
            //'vec2 lUv2 = vec2(gl_FragCoord.x/w,gl_FragCoord.y/w);',
            'vec4 a = texture2D(t, lUv);',
            'float c = (a.r-0.5)*2.0*max;',
            'gl_FragColor = vec4(c,c,c,1.0);',
        '}'].join(''),
    side       : DoubleSide,
    depthTest  : false,
    depthWrite : false,
    transparent: false,
}))

const mull_mesh   = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        map   : { value: null },
        f     : { value: 0.0  },
        max   : { value: 0.0  },
    },
    vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
            'vUv = uv;',
            'gl_Position = vec4(position,1.0);',
        '}'].join(''),
    fragmentShader: [
        'uniform sampler2D map;',
        'uniform float f;',
        'uniform float max;',
        'varying vec2 vUv;',
        'void main(){',
            'float h = texture2D(map, vUv).r*f;',
            'h = clamp(h,-max,max);',
			'gl_FragColor = vec4(h,h,h,1.0);',          
    '}'].join(''),
    side        : DoubleSide,
    depthTest   : false,
    depthWrite  : false,
    transparent : false,
}))

export const getTexture   = ()=>heightmap.texture
export const getWidth     = ()=>width
export const getMaxHeight = ()=>maxHeight
export const getStep      = ()=>pixel_step

export const resize = (new_width)=>{
    if (heightmap2!==null){
        heightmap2.dispose()
    }

    heightmap2 = RENDER.targetFloatCreate(new_width, new_width)
    RENDER.target_copy(heightmap,heightmap2)
    
    if (heightmap!==null){
        heightmap.dispose()
    }

    heightmap = RENDER.targetFloatCreate(new_width, new_width)
    RENDER.target_copy(heightmap2,heightmap)

    width      = new_width
    pixel_step = 1/width 

    heightmap_data = new Float32Array(width*width)
    update_heightmap_data()
}

export const setMaxHeight = (new_max_height)=>{

    const f = new_max_height/maxHeight
    // render 
    RENDER._renderStart(heightmap2)
    RENDER._setProgram( mull_mesh )
    RENDER._setValue('map', heightmap.texture)
    RENDER._setValue('f', f)
    RENDER._setValue('max', new_max_height)
    RENDER._renderObject( mull_mesh )
    RENDER._renderEnd()
    
    //copy
    RENDER._renderStart(heightmap)
    RENDER._setProgram( mull_mesh )
    RENDER._setValue('map', heightmap2.texture)
    RENDER._setValue('f', 1.0)
    RENDER._setValue('max', new_max_height)
    RENDER._renderObject( mull_mesh )
    RENDER._renderEnd()
    //RENDER.target_copy(heightmap2,heightmap)

    maxHeight = new_max_height

    update_heightmap_data()
}

export const set_heightmap = (x, y, mode, mask, size, power) => {
   
    let _mask  = ASSETS.getMask(mask)
    let _size  = size/width
    let solid  = power*maxHeight
    let _power = power
    let mesh   = null

    // добавляет или убавляет высоту
    if (mode===0 || mode===1){
        mesh = hm_mesh
        if (mode===1){
            _power = -_power
        }
    }
    // определенной высоты
    if (mode===2){
        mesh = solid_mesh
        _power = solid
    }
    
    // сглаживает
    if (mode===3){
        mesh = blur_mesh
        _power = 0.5
    }

    // render 
    RENDER._renderStart(heightmap2)
    RENDER._setProgram( mesh )
    RENDER._setValue('w',     width)
    RENDER._setValue('max',   maxHeight)
    RENDER._setValue('hm',    heightmap.texture)
    RENDER._setValue('mask',  _mask)
    RENDER._setValue('scale', _size)
    RENDER._setValue('power', _power)
    RENDER._setValue('rx',    x)
    RENDER._setValue('ry',    y)
    RENDER._renderObject( mesh )
    RENDER._renderEnd()
    
    // copy
    RENDER._renderStart(heightmap)
    RENDER._setProgram( hm_mesh )
    RENDER._setValue('w', heightmap.width)
    RENDER._setValue('max', maxHeight)
    RENDER._setValue('hm', heightmap2.texture)
    RENDER._setValue('mask', _mask)
    RENDER._setValue('scale', _size)
    RENDER._setValue('rx', x)
    RENDER._setValue('ry', y)
    RENDER._setValue('power', 0.0)
    RENDER._renderObject( hm_mesh)
    RENDER._renderEnd()

    needs_update_data = true
}

export const update_heightmap_data = ()=>{
    RENDER.renderer.readRenderTargetPixels ( heightmap, 0, 0, width, width, heightmap_data)
    needs_update_data = false
}

// переносим загруженную карту на нашу карту
const update_heightmap = (texture)=>{

    RENDER._renderStart(heightmap)
    RENDER._setProgram( unpack_mesh )
    RENDER._setValue('t',texture)
    RENDER._setValue('max',maxHeight)
    RENDER._renderObject(unpack_mesh)
    RENDER._renderEnd()    

    texture.dispose()

    //copy
    RENDER._renderStart(heightmap2)
    RENDER._setProgram( mull_mesh )
    RENDER._setValue('map', heightmap.texture)
    RENDER._setValue('f', 1.0)
    RENDER._setValue('max', maxHeight)
    RENDER._renderObject( mull_mesh )
    RENDER._renderEnd()

    update_heightmap_data()
}

export const load = (id)=>ASSETS.load_texture_by_name('heightmap','/l/heightmap_'+id+'.png?'+Date.now(),INFO.ASSETS_LAND_HEIGHTMAP)

export const loaded = ()=>{
    update_heightmap( ASSETS.get_by_name('heightmap') )
    ASSETS.delete_by_name('heightmap')
}

export const loadGray = (texture)=>{

    RENDER._renderStart(heightmap)
    RENDER._setProgram( unpack_gray_mesh )
    RENDER._setValue('t',texture)
    RENDER._setValue('max',maxHeight)
    RENDER._renderObject(unpack_gray_mesh)
    RENDER._renderEnd()    

    //copy
    RENDER._renderStart(heightmap2)
    RENDER._setProgram( mull_mesh )
    RENDER._setValue('map', heightmap.texture)
    RENDER._setValue('f', 1.0)
    RENDER._setValue('max', maxHeight)
    RENDER._renderObject( mull_mesh )
    RENDER._renderEnd()

    update_heightmap_data() 
}

export const getGrid = ()=>{
    const f1 = 256*256*256
    const f2 = 256*256
    const f3 = 256
    const eps = 0.0000000001

    update_heightmap_data()

    const buff = new Uint8Array(width*width*3)

    let p = 0
    for (let y=0;y<width;y++){
        for (let x=0;x<width;x++){
            const f = (maxHeight+heightmap_data[p])/(maxHeight*2.0+eps)
            let b = Math.trunc(f*(f1))
            const r = Math.trunc(b/f2)
            b = b - r*f2
            const g = Math.trunc(b/f3)
            b = b - g*f3
            const pp = (y*width+x)*3
            buff[pp+0] = r
            buff[pp+1] = g
            buff[pp+2] = b
            p = p + 1
        }
    }
    return buff
}

//---------------------------------------------------------------

const dot = ( a,b )=> a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
const crossVectors = ( r, a, b )=>{
    r[0] = a[1]*b[2] - a[2]*b[1]
    r[1] = a[2]*b[0] - a[0]*b[2]
    r[2] = a[0]*b[1] - a[1]*b[0]
}


const intersectTriangle = ( a, b, c, backfaceCulling = false )=>{

    // Compute the offset origin, edges, and normal.

    // from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

    _edge1[0] = b[0] - a[0]
    _edge1[1] = b[1] - a[1]
    _edge1[2] = b[2] - a[2]

    _edge2[0] = c[0] - a[0]
    _edge2[1] = c[1] - a[1]
    _edge2[2] = c[2] - a[2]

    crossVectors( _normal$1, _edge1, _edge2 )

    // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
    // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
    //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
    //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
    //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
    let DdN = dot( _direction, _normal$1 )
    let sign;

    if ( DdN > 0 ) {

        if ( backfaceCulling ) return false
        sign = 1

    } else if ( DdN < 0 ) {
        sign = - 1
        DdN = - DdN
    } else {
        return false
    }

    _diff[0] = _origin[0] - a[0]
    _diff[1] = _origin[1] - a[1]
    _diff[2] = _origin[2] - a[2]
    crossVectors( _edge3, _diff, _edge2 ) 
    const DdQxE2 = sign * dot( _direction, _edge3)

    // b1 < 0, no intersection
    if ( DdQxE2 < 0 ) {
        return false
    }

    crossVectors( _edge3, _edge1, _diff ) 
    const DdE1xQ = sign * dot( _direction, _edge3)

    // b2 < 0, no intersection
    if ( DdE1xQ < 0 ) {
        return false
    }

    // b1+b2 > 1, no intersection
    if ( DdQxE2 + DdE1xQ > DdN ) {
        return false
    }

    // Line intersects triangle, check if ray does.
    const QdN = - sign * dot( _diff,_normal$1 )

    // t < 0, no intersection
    if ( QdN < 0 ) {
        return false
    }

    // Ray intersects triangle.
    //return target.copy( direction ).multiplyScalar(QdN / DdN).add( origin )
    const distance = QdN / DdN
    //_edge3[0] = _origin[0] + _direction[0]*distance
    //_edge3[1] = _origin[1] + _direction[1]*distance
    //_edge3[2] = _origin[2] + _direction[2]*distance
    _edge3[0] = distance
    return true
}

export const get_height = (x,y)=> _get_height(Math.floor(x*heightmap.width), Math.floor(y*heightmap.height)-1)


// простое сглаживание, чтобы карта высот совпадала с тем что ренедрит видеокарта
// LinearFilter
const _get_height = (tx,ty)=>{
    let h1 = 0.0
    let h2 = 0.0
    if (tx>=0 && ty>=0 && tx<width && ty<width){
        h1 = heightmap_data[ty*width + tx]
    }
    tx = tx - 1
    ty = ty - 1
    if (tx>=0 && ty>=0 && tx<width && ty<width){
        h2 = heightmap_data[ty*width + tx]
    }

    return (h1+h2)*0.5
}
//
// a   b  
// d   c
const get_tile = (tx,ty)=>{
    const eps = 0.01  // увеличиваем размер квада на небольшое значение чтобы не было такого момента что луч проходит аккурат между краями

    _a[0] = tx - eps
    _a[1] = _get_height(tx,ty)
    _a[2] = ty - eps
    //
    tx = tx + 1
    _b[0] = tx + eps
    _b[1] = _get_height(tx,ty)
    _b[2] = ty - eps
    //
    ty = ty + 1
    _c[0] = tx + eps
    _c[1] = _get_height(tx,ty)
    _c[2] = ty + eps
    //
    tx = tx - 1
    _d[0] = tx - eps
    _d[1] = _get_height(tx,ty)
    _d[2] = ty + eps
}

const ray_vs_tile = (tx,ty)=>{

    get_tile(tx,ty)

    /*
    if(window.mydebug===true){
        console.log(tx,ty)
        RENDER.scene.add( UTILS.draw_line(_a,_b) )
        RENDER.scene.add( UTILS.draw_line(_b,_c) )
        RENDER.scene.add( UTILS.draw_line(_c,_d) )
        RENDER.scene.add( UTILS.draw_line(_d,_a) )
    }
    */

    if ( ty%2===0 ){
        if (tx%2===0){
            // abc acd
            if (intersectTriangle(_a,_b,_c)) return true 
            if (intersectTriangle(_a,_c,_d)) return true 
        }else{
            // abd bcd
            if (intersectTriangle(_a,_b,_d)) return true 
            if (intersectTriangle(_b,_c,_d)) return true 
        }
    }else{
        if (tx%2===0){
            // abd bcd
            if (intersectTriangle(_a,_b,_d)) return true 
            if (intersectTriangle(_b,_c,_d)) return true 
        }else{
            // abc acd
            if (intersectTriangle(_a,_b,_c)) return true 
            if (intersectTriangle(_a,_c,_d)) return true 
        }
    }

    return false
}

// карта высот
export const ray_vs_heightmap = (ox,oy,oz, dx,dy,dz)=>{
    _origin[0] = ox
    _origin[1] = oy
    _origin[2] = oz
    _direction[0] = dx
    _direction[1] = dy
    _direction[2] = dz


    const x = ox
    const y = oz
    
    let tx = Math.floor(x)
    let ty = Math.floor(y)    

    if ( ray_vs_tile(tx,ty) ){
        return _edge3[0]
    }

    if (dx===0 && dz===0){
        return 0 
    }

	let yLonger=false

    let incrementVal = Math.sign(dx)
	if (Math.abs(dz)>Math.abs(dx)) {
		yLonger=true
        incrementVal = Math.sign(dz)
	}

    let xx = tx
    let yy = ty
    for (let i=0;i<200;i++){
        if (yLonger) {
            ty = ty + incrementVal
            const delta = (ty - y)/dz
            const nx = Math.floor(x + dx*delta)
            if (xx!==nx){
                if ( ray_vs_tile(nx,yy) ){
                    return _edge3[0]
                }
                yy = ty
                if ( ray_vs_tile(xx,yy) ){
                    return _edge3[0]
                }
                xx = nx
            }else{
                yy = ty
            }
        }else{
            tx = tx + incrementVal
            const delta = (tx - x)/dx
            const ny = Math.floor(y + dz*delta)
            if (yy!==ny){
                if ( ray_vs_tile(xx,ny) ){
                    return _edge3[0]
                }
                xx = tx
                if ( ray_vs_tile(xx,yy) ){
                    return _edge3[0]
                }
                yy = ny
            }else{
                xx = tx
            }
        }
        if ( ray_vs_tile(xx,yy) ){
            return _edge3[0]
        }
    }
    return 0
}

export const point_in_heightmap = (x,y)=>{
   
    const tx = Math.floor(x)
    const ty = Math.floor(y)    

    get_tile(tx,ty)
    //a b
    //d c
    const dx = Math.abs(x - tx)
    const dy = Math.abs(y - ty)
    if ( ty%2===0 ){
        if (tx%2===0){
            // abc acd
            if (dx>=dy){
                return _a[1] + (_b[1]-_a[1])*dx + (_c[1]-_b[1])*dy
            }else{
                return _a[1] + (_d[1]-_a[1])*dy + (_c[1]-_d[1])*dx
            }
        }else{
            // abd bcd
            if ((1.0-dx)>=dy){
                return _a[1] + (_b[1]-_a[1])*dx + (_d[1]-_a[1])*dy
            }else{
                return _d[1] + (_c[1]-_d[1])*dx + (_b[1]-_c[1])*(1.0-dy)
            }
        }
    }else{
        if (tx%2===0){
            // abd bcd
            if ((1.0-dx)>=dy){
                return _a[1] + (_b[1]-_a[1])*dx + (_d[1]-_a[1])*dy
            }else{
                return _d[1] + (_c[1]-_d[1])*dx + (_b[1]-_c[1])*(1.0-dy)
            }
        }else{
            // abc acd
            if (dx>=dy){
                return _a[1] + (_b[1]-_a[1])*dx + (_c[1]-_b[1])*dy
            }else{
                return _a[1] + (_d[1]-_a[1])*dy + (_c[1]-_d[1])*dx
            }
        }
    }
}

// подготавливает карту высот нужного размера, 
// заливает поверхность ровной землей
export const prepare = ( _width, _max) => {
    if (heightmap!==null){
        heightmap.dispose()
        heightmap2.dispose()
    }

    maxHeight  = _max    
    width      = _width
    pixel_step = 1/width 

    heightmap  = RENDER.targetFloatCreate(width, width)
    heightmap2 = RENDER.targetFloatCreate(width, width)

    heightmap_data = new Float32Array(width*width)
    update_heightmap_data()
}

