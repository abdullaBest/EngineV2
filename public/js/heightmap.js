import * as CHUNK   from './chunk.js'
import * as RENDER  from './render.js'
import * as UTILS   from './utils.js'
import * as ASSETS  from './assets.js'
import {
    Scene,
    WebGLRenderTarget,
    NearestFilter,
    RGBAFormat,
    RGBFormat,
    OrthographicCamera,
    Color,
    ShaderMaterial,
    MeshLambertMaterial,
    DoubleSide,
    Mesh,
    LinearFilter,
    LinearMipmapLinearFilter,
    LinearMipmapNearestFilter,
    NearestMipmapNearestFilter,
    RepeatWrapping,
    ReplaceStencilOp,
    LessStencilFunc,
    EqualStencilFunc,
    Vector3,
    Vector4,

    AdditiveBlending,
    SubtractiveBlending,
    RawShaderMaterial,


} from '/lib/three.js'

let heightmap                   = null
let heightmap2                  = null
let grid_cx                     = 16                // количество точек в чанке
let maxHeight                   = 512               // максимальная высота
let tile_size                   = 0                 // размер тайла карта высот
let heightmap_data              = null              //
let width                       = 0
let pixel_step                  = 0
export let needs_update_data    = false

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
    side: DoubleSide,
    depthTest: false,
    depthWrite: false,
    transparent: false,
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
    side: DoubleSide,
    depthTest: false,
    depthWrite: false,
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
    side: DoubleSide,
    depthTest: false,
    depthWrite: false,
    transparent: false,
}))

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
    side: DoubleSide,
    depthTest: false,
    depthWrite: false,
    transparent: false,
}))

const mull_mesh   = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        map   : { value: null },
        f     : { value: 0.0 },
        max   : { value: 0.0 },
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
export const get_grid_cx  = ()=>grid_cx
export const getWidth     = ()=>width
export const getMaxHeight = ()=>maxHeight
export const getStep      = ()=>pixel_step

export const change_grid_cx = (new_grid_cx)=>{
    if (heightmap2!==null){
        heightmap2.dispose()
    }

    const new_width = CHUNK.count_x * new_grid_cx

    heightmap2 = RENDER.targetFloatCreate(new_width, new_width)
    RENDER.target_copy(heightmap,heightmap2)
    
    if (heightmap!==null){
        heightmap.dispose()
    }

    heightmap = RENDER.targetFloatCreate(new_width, new_width)
    RENDER.target_copy(heightmap2,heightmap)

    width      = new_width
    grid_cx    = new_grid_cx
    tile_size  = CHUNK.r_width/grid_cx
    pixel_step = 1/width 
}

export const change_max_height = (new_max_height)=>{

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
}

export const set_heightmap = (rx, ry, mode, mask, size, power) => {
    let x = (-0.5 + rx/CHUNK.max_width) * 2
    let y = (-0.5 + ry/CHUNK.max_width) * 2

    let _mask  = ASSETS.getMask(mask)
    let _size  = 3.0*(size/(grid_cx*CHUNK.count_x))
    let solid  = power*maxHeight
    let _power = power
    let mesh   = null

    // добавляет или убавляет высоту
    if (mode===0 || mode===1){
        //brush_mesh.material.blending = AdditiveBlending
        //if (mode === 1) {
        //    brush_mesh.material.blending = SubtractiveBlending
        //}
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
    RENDER._setValue('w', heightmap.width)
    RENDER._setValue('max', maxHeight)
    RENDER._setValue('hm', heightmap.texture)
    RENDER._setValue('mask', _mask)
    RENDER._setValue('scale', _size)
    RENDER._setValue('power', _power)
    RENDER._setValue('rx', x)
    RENDER._setValue('ry', y)
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
    heightmap_data = RENDER.get_target_floats(heightmap)
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

    update_heightmap_data()
}

export const load = (map_id)=>{
    RENDER.textureloader.load('/l/heightmap_'+map_id+'.png?'+Date.now(), (texture)=>{
        update_heightmap(texture)

        //minimap_mesh.material.uniforms.hmap.value = heightmap.texture
    })
}

export const getGrid = ()=>{
	const buff = RENDER.get_target_floats( heightmap )
    const buff2 = new Uint8Array(width*width*3)
    const factor1 = 256*256*256
    const factor2 = 256*256
    const factor3 = 256
    let p = 0
    const eps = 0.0000000001
    for (let y=0;y<width;y++){
        for (let x=0;x<width;x++){
            let f = (maxHeight+buff[p])/(maxHeight*2.0+eps)
            let a = Math.trunc(f*(factor1))
            let r = Math.trunc(a/factor2)
            a = a - r*factor2
            let g = Math.trunc(a/factor3)
            a = a - g*factor3
            let b = a
            let pp = (y*width+x)*3
            buff2[pp+0] = r
            buff2[pp+1] = g
            buff2[pp+2] = b
            //
            //let ff = (r*factor2+g*factor3+b)/factor1
            //ff = (ff-0.5)*2.0*maxHeight
            //console.log(buff[p]-ff)
            //
            p = p + 1
        }
    }
    //console.log(buff2)
    return buff2
}

//---------------------------------------------------------------
export const get_height = (rx,ry)=>{
    let x = rx/CHUNK.max_width
    let y = ry/CHUNK.max_width
    //
    //x = Math.min(Math.max(x,0),1)
    //y = Math.min(Math.max(y,0),1)
    x = Math.floor(x*heightmap.width)
    y = Math.floor(y*heightmap.height)-1

    return _get_heightmap_h_linear(x,y)
/*
    let p = (y*heightmap.width+x)*1
    if (p>=0 && p<heightmap_pixels.length){
        return heightmap_pixels[p]
    }else{
        return 0.5*heightmap_max
    }
    //RENDER.renderer.readRenderTargetPixels ( heightmap, x, y, 1, 1, _data_pixels )
    //return (_data_pixels[0]/255-0.5)*heightmap_max
*/
}


// простое сглаживание, чтобы карта высот совпадала с тем что ренедрит видеокарта
// LinearFilter
const _get_heightmap_h_linear = (tx,ty)=>{
    if (tx>=1 && ty>=1 && tx<=heightmap.width && ty<=heightmap.height){
        let h1 = heightmap_data[(ty)*width+tx]
        let h2 = heightmap_data[(ty-1)*width+tx-1]
        return (h1+h2)*0.5
    }else{
        return 0.0
    }
}
//
// a   b  
// d   c
const get_heightmap_quad = (tx,ty,a,b,c,d)=>{
    const eps = 0.01  // увеличиваем размер квада на небольшое значение чтобы не было такого момента что луч проходит аккурат между краями

    a[0] = tx*tile_size - CHUNK.half_max_width - eps
    a[2] = ty*tile_size - CHUNK.half_max_width - eps
    a[1] = _get_heightmap_h_linear(tx,ty)
    //
    tx = tx + 1
    b[0] = tx*tile_size - CHUNK.half_max_width + eps
    b[2] = ty*tile_size - CHUNK.half_max_width - eps
    b[1] = _get_heightmap_h_linear(tx,ty)
    //
    ty = ty + 1
    c[0] = tx*tile_size - CHUNK.half_max_width + eps
    c[2] = ty*tile_size - CHUNK.half_max_width + eps
    c[1] = _get_heightmap_h_linear(tx,ty)
    //
    tx = tx - 1
    d[0] = tx*tile_size - CHUNK.half_max_width - eps
    d[2] = ty*tile_size - CHUNK.half_max_width + eps
    d[1] = _get_heightmap_h_linear(tx,ty)
}

const ray_vs_heightmap_tile = (tx,ty/*,debug*/)=>{
    const a = [0,0,0]
    const b = [0,0,0]
    const c = [0,0,0]
    const d = [0,0,0]

    get_heightmap_quad(tx,ty,a,b,c,d)

    /*
    if (debug){
        console.log(tx,ty)
        RENDER.scene.add( UTILS.draw_line(a,b) )
        RENDER.scene.add( UTILS.draw_line(b,c) )
        RENDER.scene.add( UTILS.draw_line(c,d) )
        RENDER.scene.add( UTILS.draw_line(d,a) )
    }
    */
    

    if ( ty%2===0 ){
        if (tx%2===0){
            // abc acd
            if (RENDER.ray_vs_triangle(a,b,c)!==null){ return true }
            if (RENDER.ray_vs_triangle(a,c,d)!==null){ return true }
        }else{
            // abd bcd
            if (RENDER.ray_vs_triangle(a,b,d)!==null){ return true }
            if (RENDER.ray_vs_triangle(b,c,d)!==null){ return true }
        }
    }else{
        if (tx%2===0){
            // abd bcd
            if (RENDER.ray_vs_triangle(a,b,d)!==null){ return true }
            if (RENDER.ray_vs_triangle(b,c,d)!==null){ return true }
        }else{
            // abc acd
            if (RENDER.ray_vs_triangle(a,b,c)!==null){ return true }
            if (RENDER.ray_vs_triangle(a,c,d)!==null){ return true }
        }
    }

    return false

}

export const ray_vs_heightmap = (o_x,o_y,o_z, d_x,d_y,d_z/*,debug*/)=>{
    RENDER.raycaster.ray.origin.x = o_x
    RENDER.raycaster.ray.origin.y = o_y
    RENDER.raycaster.ray.origin.z = o_z
    RENDER.raycaster.ray.direction.x = d_x
    RENDER.raycaster.ray.direction.y = d_y
    RENDER.raycaster.ray.direction.z = d_z


    const x = (o_x + CHUNK.half_max_width)/tile_size
    const y = (o_z + CHUNK.half_max_width)/tile_size
    
    let tx = Math.floor(x)
    let ty = Math.floor(y)    

    if ( ray_vs_heightmap_tile(tx,ty/*,debug*/) ){
        return true
    }

    if (d_x===0 && d_z===0){
        return false 
    }

	let yLonger=false

    let incrementVal = Math.sign(d_x)
	if (Math.abs(d_z)>Math.abs(d_x)) {
		yLonger=true
        incrementVal = Math.sign(d_z)
	}

    let xx = tx
    let yy = ty
    for (let i=0;i<200;i++){
        if (yLonger) {
            ty = ty + incrementVal
            const delta = (ty - y)/d_z
            const nx = Math.floor(x + d_x*delta)
            if (xx!==nx){
                if ( ray_vs_heightmap_tile(nx,yy/*,debug*/) ){
                    return true
                }
                yy = ty
                if ( ray_vs_heightmap_tile(xx,yy/*,debug*/) ){
                    return true
                }
                xx = nx
            }else{
                yy = ty
            }
        }else{
            tx = tx + incrementVal
            const delta = (tx - x)/d_x
            const ny = Math.floor(y + d_z*delta)
            if (yy!==ny){
                if ( ray_vs_heightmap_tile(xx,ny/*,debug*/) ){
                    return true
                }
                xx = tx
                if ( ray_vs_heightmap_tile(xx,yy/*,debug*/) ){
                    return true
                }
                yy = ny
            }else{
                xx = tx
            }
        }
        if ( ray_vs_heightmap_tile(xx,yy/*,debug*/) ){
            return true
        }
    }
    return false
}

export const poin_in_heightmap = (_x,_z)=>{
    const x = (_x + CHUNK.half_max_width)/tile_size
    const y = (_z + CHUNK.half_max_width)/tile_size 
    
    const tx = Math.floor(x)
    const ty = Math.floor(y)    

    const a = [0,0,0]
    const b = [0,0,0]
    const c = [0,0,0]
    const d = [0,0,0]

    get_heightmap_quad(tx,ty,a,b,c,d)
    //a b
    //d c
    const dx = Math.abs(x - tx)
    const dy = Math.abs(y - ty)
    if ( ty%2===0 ){
        if (tx%2===0){
            // abc acd
            if (dx>=dy){
                return a[1] + (b[1]-a[1])*dx + (c[1]-b[1])*dy
            }else{
                return a[1] + (d[1]-a[1])*dy + (c[1]-d[1])*dx
            }
        }else{
            // abd bcd
            if ((1.0-dx)>=dy){
                return a[1] + (b[1]-a[1])*dx + (d[1]-a[1])*dy
            }else{
                return d[1] + (c[1]-d[1])*dx + (b[1]-c[1])*(1.0-dy)
            }
        }
    }else{
        if (tx%2===0){
            // abd bcd
            if ((1.0-dx)>=dy){
                return a[1] + (b[1]-a[1])*dx + (d[1]-a[1])*dy
            }else{
                return d[1] + (c[1]-d[1])*dx + (b[1]-c[1])*(1.0-dy)
            }
        }else{
            // abc acd
            if (dx>=dy){
                return a[1] + (b[1]-a[1])*dx + (c[1]-b[1])*dy
            }else{
                return a[1] + (d[1]-a[1])*dy + (c[1]-d[1])*dx
            }
        }
    }
}

/*
export const poin_in_heightmap_debug = (_x,_y,_z)=>{
    const x = (_x + CHUNK.half_max_width)/tile_size 
    const y = (_z + CHUNK.half_max_width)/tile_size
    
    const tx = Math.floor(x)
    const ty = Math.floor(y)    

    const a = [0,0,0]
    const b = [0,0,0]
    const c = [0,0,0]
    const d = [0,0,0]

    get_heightmap_quad(tx,ty,a,b,c,d)

    //a b
    //d c
    const dx = Math.abs(x - tx)
    const dy = Math.abs(y - ty)
    if ( ty%2===0 ){
        if (tx%2===0){
            // abc acd

            RENDER.scene.add( UTILS.draw_line(a,b) )
            RENDER.scene.add( UTILS.draw_line(b,c) )
            RENDER.scene.add( UTILS.draw_line(c,a) )
            RENDER.scene.add( UTILS.draw_line(a,c) )
            RENDER.scene.add( UTILS.draw_line(c,d) )
            RENDER.scene.add( UTILS.draw_line(d,a) )

            if (dx>=dy){
                return a[1] + (b[1]-a[1])*dx + (c[1]-b[1])*dy
            }else{
                return a[1] + (d[1]-a[1])*dy + (c[1]-d[1])*dx
            }
        }else{
            // abd bcd
            RENDER.scene.add( UTILS.draw_line(a,b) )
            RENDER.scene.add( UTILS.draw_line(b,d) )
            RENDER.scene.add( UTILS.draw_line(d,a) )
            RENDER.scene.add( UTILS.draw_line(b,c) )
            RENDER.scene.add( UTILS.draw_line(c,d) )
            RENDER.scene.add( UTILS.draw_line(d,b) )


            if ((1.0-dx)>=dy){
                return a[1] + (b[1]-a[1])*dx + (d[1]-a[1])*dy
            }else{
                return d[1] + (c[1]-d[1])*dx + (b[1]-c[1])*(1.0-dy)
            }
        }
    }else{
        if (tx%2===0){
            // abd bcd
            RENDER.scene.add( UTILS.draw_line(a,b) )
            RENDER.scene.add( UTILS.draw_line(b,d) )
            RENDER.scene.add( UTILS.draw_line(d,a) )
            RENDER.scene.add( UTILS.draw_line(b,c) )
            RENDER.scene.add( UTILS.draw_line(c,d) )
            RENDER.scene.add( UTILS.draw_line(d,b) )

            if ((1.0-dx)>=dy){
                return a[1] + (b[1]-a[1])*dx + (d[1]-a[1])*dy
            }else{
                return d[1] + (c[1]-d[1])*dx + (b[1]-c[1])*(1.0-dy)
            }
        }else{
            // abc acd
            RENDER.scene.add( UTILS.draw_line(a,b) )
            RENDER.scene.add( UTILS.draw_line(b,c) )
            RENDER.scene.add( UTILS.draw_line(c,a) )
            RENDER.scene.add( UTILS.draw_line(a,c) )
            RENDER.scene.add( UTILS.draw_line(c,d) )
            RENDER.scene.add( UTILS.draw_line(d,a) )


            if (dx>=dy){
                return a[1] + (b[1]-a[1])*dx + (c[1]-b[1])*dy
            }else{
                return a[1] + (d[1]-a[1])*dy + (c[1]-d[1])*dx
            }
        }
    }
}
*/


// подготавливает карту высот нужного размера, 
// заливает поверхность ровной землей
export const prepare = ( _grid_cx, _max) => {
    if (heightmap!==null){
        heightmap.dispose()
        heightmap2.dispose()
    }

    grid_cx    = _grid_cx    
    maxHeight  = _max    
    tile_size  = CHUNK.r_width/grid_cx
    width      = CHUNK.count_x * grid_cx
    pixel_step = 1/width 

    heightmap  = RENDER.targetFloatCreate(width, width)
    heightmap2 = RENDER.targetFloatCreate(width, width)

}
