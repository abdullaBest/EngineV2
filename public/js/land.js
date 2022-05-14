import * as RENDER    from './render.js'
import * as CHUNK     from './chunk.js'
import * as UTILS     from './utils.js'
import * as ASSETS    from './assets.js'
import * as INFO      from './info.mjs'
import * as HEIGHTMAP from './heightmap.js'
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


} from '/lib/three.js'
import { Vector2 } from '../lib/three.js'

const _path                     = '/l/'

export const tiles              = new Array(64).fill(null)    // тайловые текстуры

let main_layer_width            = 1024             // размер текстуры на блок
let ground_material  = null
let minimap_material = null


export let minimap_mesh         = null
let minimap_grid_cx             = 128

let layer_grid                  = null              // данные по покраске карты (3 значения - mask, texture, size )
let layer_list                  = null              // 
let layer_grid_cx               = 16                // количество точек в одном чанке
let layer0_texture_scale        = 8                 // размер текстуры заливки
let layer_texture_scale         = 8                 // размер текстуры в сетке
let layer_normal_factor         = 0.04              // сила изменения направления нормали для освещения

let ground_mesh                 = null


// -------------------------------------
// SHADER
// -------------------------------------

const sprite_mesh = new Mesh(UTILS.pass_geometry, new ShaderMaterial({
    uniforms: {
        mask : { value: null },
        map  : { value: null },
        scale: { value: 1.0  },
        gsize: { value: 1.0  },
        rx   : { value: 1.0  },
        ry   : { value: 1.0  },
        ox   : { value: 1.0  },
        oy   : { value: 1.0  },
    },
    vertexShader: [
        'varying vec2 lUv;',
        'varying vec2 lUv2;',
        'uniform float scale;',
        'uniform float gsize;',
        'uniform float rx;',
        'uniform float ry;',
        'uniform float ox;',
        'uniform float oy;',
        'void main() {',
            'lUv = uv;',
            'gl_Position = vec4( rx+position.x*scale,ry+position.y*scale, 0.0, 1.0 );',
            'lUv2 = vec2(ox + gl_Position.x*gsize,oy + gl_Position.y*gsize);',
        '}'].join(''),
    fragmentShader: [
        'uniform sampler2D mask;',
        'uniform sampler2D map;',
        'varying vec2 lUv;',
        'varying vec2 lUv2;',
        'void main(){',
            'gl_FragColor = vec4( texture2D(map, lUv2).rgb, texture2D(mask, lUv).a);',
        '}'].join(''),
    side        : DoubleSide,
    depthTest   : false,
    depthWrite  : false,
    transparent : true,
}))

export const getGrid = ()=>layer_grid
export const getWidth = ()=>layer_grid_cx*CHUNK.count_x

const prepare_ground_material = ()=>{

    if (ground_material!==null){
        ground_material.dispose()
    }

    ground_material = new MeshLambertMaterial({ 
        map          : null, //tiles[0],
        //side       : DoubleSide,
        //colorWrite : false,
        depthWrite   : true,
        depthTest    : true,
        //wireframe  : true,
        stencilWrite : true,
        stencilRef   : 1,
        stencilZPass : ReplaceStencilOp, 
    })

    ground_material.onBeforeCompile=(shader,renderer)=>{
        let u = shader.uniforms
        ground_material.uniforms = u
        u.hmap      = { value: null },
        //u.nmap      = { value: noise_texture },
        u.ox        = { value: 0.0 },
        u.oy        = { value: 0.0 },
        //
        u.mask      = { value: ASSETS.getMask(2) },
        u.mx        = { value: 0.0 },
        u.my        = { value: 0.0 },
        u.size      = { value: 1.0 },
        u.level     = { value: 0.0 },
        u.normalf   = { value: 0.0 },
        u.hstep     = { value: 0.0 },
        u.maxw      = { value: 0.0 },

        //console.log(shader.vertexShader)
        //console.log(shader.fragmentShader)

        shader.vertexShader = shader.vertexShader.replace(
            '#define LAMBERT',
            [
                '#define LAMBERT',
                'uniform sampler2D hmap;',
                'uniform float hmax;',
                'uniform float ox;',
                'uniform float oy;',
                'uniform float normalf;',
                'varying vec4 rp;',
                'uniform float maxw;',
                'uniform float hstep;',
            ].join('\n')
        )
    
        shader.vertexShader = shader.vertexShader.replace(
            '#include <beginnormal_vertex>',
            [
                'rp = vec4(ox+position.x,0.0,oy+position.z,0.0);',
                'vec2 _v = vec2( rp.x/maxw, rp.z/maxw );', //+'+step+'
                'float _h1 = texture2D(hmap, vec2( _v.x, _v.y-hstep) ).r;',
                'float _h2 = texture2D(hmap, vec2( _v.x-hstep, _v.y) ).r;',
                'float _h3 = texture2D(hmap, vec2( _v.x+hstep, _v.y) ).r;',
                'float _h4 = texture2D(hmap, vec2( _v.x, _v.y+hstep) ).r;',
                'vec3 _n = vec3(_h2-_h3, normalf, _h1-_h4);',
                'vec3 objectNormal = _n;', //normalize(_n);',
            ].join('\n')
        )
    
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            [
                'rp.y = texture2D(hmap, vec2( _v.x, _v.y )).r;',
                'vec3 transformed = vec3(position.x,rp.y,position.z);',
             ].join('\n')
        )
    
    
        //------------------------------------------------------------------------------
        shader.fragmentShader = shader.fragmentShader.replace(
            'uniform vec3 diffuse;',
            [
                'uniform sampler2D mask;',
                //'uniform sampler2D nmap;',
                'uniform vec3 diffuse;',
                'varying vec4 rp;',
                'uniform float mx;',
                'uniform float my;',
                'uniform float size;',
            ].join('\n')
        )
    
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            [
                //
                '#ifdef USE_MAP',
                'vec2 _uv1 = vec2(vUv.x,vUv.y);',
                'vec4 _tcolor1 = texture2D(map, _uv1);',
                // проекция маски
                '_uv1.x = rp.x - mx;',
                '_uv1.y = rp.z - my;',
                'if (abs(_uv1.x)<size && abs(_uv1.y)<size){',
                    '_uv1.x = _uv1.x/(2.0*size) + 0.5;',
                    '_uv1.y = _uv1.y/(2.0*size) + 0.5;',
                    'vec4 _tcolor2 = texture2D(mask, _uv1);',
                    '_tcolor1 = mix(_tcolor1, _tcolor2, 0.2);',
                '}',
                // шум
                //'_tcolor1 = mix(_tcolor1, texture2D(nmap, _uv1), 0.1);',
                //
                'diffuseColor = _tcolor1;',
                '#endif',
            ].join('\n')
        )
        //console.log(shader.fragmentShader)
    }
}

const prepare_minimap_material = ()=>{

    const step = (1/HEIGHTMAP.getWidth()).toFixed(6)

    if (minimap_material!==null){
        minimap_material.dispose()
    }

    const maxHeight = HEIGHTMAP.getMaxHeight()

    minimap_material = new ShaderMaterial({
        uniforms: {
            map        : { value: null },
            hmap       : { value: null },
            d          : { value: new Vector4() },
            fogColor   : { value: new Vector3() },
            fogDensity : { value: 0.0 },
        },
        vertexShader: [
            'varying vec2 lUv;',
            'uniform sampler2D hmap;',
            'uniform vec4 d;',
            'varying float fogDepth;',
            //'varying float alpha;',
            'void main() {',
                'lUv = vec2(uv.x,1.0-uv.y);', //+'+step+'
                'float y = 0.0;',
                'if (position.x>d[0] && position.x<d[1] && position.z>d[2] && position.z<d[3]){',
                    //'y = 0.0;',
                    'y = -0.5*'+maxHeight.toFixed(1)+';',
                    //'alpha = 0.0;',
                '}else{',
                    'vec4 hd = texture2D(hmap, uv);',
                    'y = (hd.r - 0.5)*'+maxHeight.toFixed(1)+';',
                    //'alpha = 1.0-smoothstep( 16000000.0, 17000000.0, position.x*position.x+position.z*position.z);',
                    '}',
                'gl_Position = projectionMatrix*modelViewMatrix*vec4(position.x,y,position.z,1.0);',
                'fogDepth = -gl_Position.z;',
            '}'].join(''),
        fragmentShader: [
            'uniform vec3 fogColor;',
            'uniform float fogDensity;',
            'uniform sampler2D map;',
            'varying vec2 lUv;',
            'varying float fogDepth;',
            //'varying float alpha;',
            'void main(){',
                //'float fogFactor = smoothstep( -1000.0, -6000.0, fogDepth );',
                'float fogFactor = 1.0 - exp( -fogDensity * fogDensity * fogDepth * fogDepth );',
                'vec4 cmap;',
                //'if (alpha!=0.0) {',
                    'cmap = texture2D(map, lUv);',
                //'}',
                'gl_FragColor = vec4(mix( cmap.rgb, fogColor, fogFactor ), 0.0);', 
                //'gl_FragColor = vec4(cmap.rgb,alpha);', 
                '}'].join(''),
        //side       : DoubleSide,
        depthTest    : true,
        depthWrite   : true,
        transparent  : false,
        //wireframe  : true,
        stencilWrite : true,
        stencilFunc  : EqualStencilFunc,
        stencilRef   : 0,
    })
}

export const prepare_tiles = (list)=>{
    for (let i=0;i<list.length;i++){
        tiles[i] = ASSETS.get_texture(list[i], INFO.MCFLAG_LAND )
    }

    if (RENDER.check_callback_flag(INFO.MCFLAG_LAND)===0){
        refresh_layers()
    }

}

export const setConf = (t0_scale,t_scale,size)=>{
    layer0_texture_scale = t0_scale
    layer_texture_scale = t_scale
    if (main_layer_width!==size){
        free()
        main_layer_width = size
        prepare_viewport()
    }
        
    refresh_layers()
}

export const setNormalF = (normalf)=>{
    layer_normal_factor = normalf
}

export const updateGroundMeshGeometry = ()=>{

    const geometry = UTILS.generate_grid(
        CHUNK.r_width, 
        CHUNK.r_width, 
        HEIGHTMAP.get_grid_cx(),
        HEIGHTMAP.get_grid_cx(),
        0,
        0
    )

    if (ground_mesh!==null ){
        if (ground_mesh.geometry!==null){
            ground_mesh.geometry.dispose()
        }
        ground_mesh.geometry = geometry
    }

    return geometry

}

const prepare_map = ( _main_layer_width, _layer_grid_cx, _minimap_cx)=>{

    main_layer_width = _main_layer_width
    layer_grid_cx    = _layer_grid_cx
    minimap_grid_cx  = _minimap_cx

    prepare_ground_material()
    prepare_minimap_material()
    
    // заливаем слои
    layer_grid = new Uint8Array( CHUNK.count_x * CHUNK.count_y * (layer_grid_cx * layer_grid_cx * 3))
    layer_grid.fill(0)

    layer_list = new Array(CHUNK.count_x * CHUNK.count_y)
    for (let i=0;i<layer_list.length;i++){
        layer_list[i] = new Uint32Array( (layer_grid_cx+2) * (layer_grid_cx+2)  )
    }
    // 

    // подготавливаем проекции
    //projection_grid = new Uint8Array( CHUNK.count_x * CHUNK.count_y * (projection_cx * projection_cy *3*2))
    //projection_grid.fill(0)
    //

    let geometry = updateGroundMeshGeometry()

    ground_mesh = new Mesh(geometry,ground_material)
    ground_mesh.castShadow = false
    ground_mesh.receiveShadow = false //true

    //
    if (minimap_mesh!==null){
        minimap_mesh.geometry.dispose()
    }
    geometry = UTILS.generate_grid(
        CHUNK.max_width, 
        CHUNK.max_width, 
        minimap_grid_cx, 
        minimap_grid_cx,
        -CHUNK.half_max_width,
        -CHUNK.half_max_width
    )

    minimap_mesh = new Mesh(geometry, minimap_material)
    minimap_mesh.castShadow = false
    minimap_mesh.receiveShadow = false
    //
}

export const free = ()=>{
    for (let i = 0; i < CHUNK.viewport.length; i++) {
        let a = CHUNK.viewport[i]
        if (a.ground!==null){
            a.ground.dispose()
        }
    }
}

const prepare_viewport = ()=>{
    for (let i = 0; i < CHUNK.viewport.length; i++) {
        const t = new WebGLRenderTarget(
            main_layer_width, main_layer_width,
            {
                minFilter     : LinearMipmapLinearFilter, //NearestMipmapNearestFilter,//LinearMipmapLinearFilter, //LinearMipmapNearestFilter 
                magFilter     : LinearFilter, //NearestMipmapNearestFilter,//LinearFilter, //NearestFilter, //LinearFilter
                format        : RGBAFormat,
                depthBuffer   : false,
                stencilBuffer : false
            }
        )
        // включаем мипы для более гладких текстур
        t.texture.generateMipmaps = true
        t.texture.anisotropy = 4
        
        const v = CHUNK.viewport[i]
        if (v.ground!==null){
            v.ground.dispose()
        }
        v.ground = t
        // добавляем меш травы
        //if (v.grass_mesh!==null){
        //    v.grass_mesh.geometry.dispose()
        //}
        //v.grass_mesh = new Mesh(
        //    GEN.gen_grass_buffer(layer_grid_cx,layer_grid_cx,grass_count),
        //    ASSET.grass_shader
        //)
    }
}


export const create_map = (_heightmap_grid_cx, _heightmap_max, _main_layer_width, _layer_grid_cx, _minimap_cx)=>{
    //
    HEIGHTMAP.prepare(_heightmap_grid_cx, _heightmap_max)
    //
    prepare_map(_main_layer_width, _layer_grid_cx, _minimap_cx)
    //
    prepare_viewport()
}

export const render_block = (x,y,ground)=>{
    const m = ground_mesh
    const rx = x*CHUNK.r_width 
    const ry = y*CHUNK.r_width
    m.position.x = rx - CHUNK.half_max_width
    m.position.y = 0
    m.position.z = ry - CHUNK.half_max_width

    m.updateMatrix()
    m.matrixWorld.multiplyMatrices( RENDER.scene.matrixWorld, m.matrix )
    //m.matrixWorldNeedsUpdate = false
    m.material.map = ground.texture

    RENDER.setProgram(m)
    RENDER._setValue('hmap', HEIGHTMAP.getTexture())
    RENDER._setValue('map', ground.texture)
    RENDER._setValue('ox', rx)
    RENDER._setValue('oy', ry)
    RENDER._setValue('mask', ASSETS.getMask(2))
    RENDER._setValue('mx', ground_mesh.material.uniforms.mx.value)
    RENDER._setValue('my', ground_mesh.material.uniforms.my.value)
    RENDER._setValue('size', ground_mesh.material.uniforms.size.value)
    RENDER._setValue('normalf',layer_normal_factor)
    RENDER._setValue('hstep',HEIGHTMAP.getStep())
    RENDER._setValue('maxw',CHUNK.max_width)
    RENDER._renderObject(m)
}
//--------------------------------------------------
// подготавливает список для отрисовки и сортирует по слоям
const make_layer_list = (cx,cy)=>{
    let rx = cx*layer_grid_cx
    let ry = cy*layer_grid_cx
    let sx = rx - 2
    let sy = ry - 2
    let ex = rx + layer_grid_cx + 2
    let ey = ry + layer_grid_cx + 2

    sx = Math.max( sx,0 )
    sy = Math.max( sy,0 )
    ex = Math.min( ex, CHUNK.count_x*layer_grid_cx )
    ey = Math.min( ey, CHUNK.count_y*layer_grid_cx )

    const row_size = (CHUNK.count_x*layer_grid_cx)*3
    const list = layer_list[cy*CHUNK.count_x+cx]
    let pp = 0

    for (let y=sy;y<ey;y++){
        let p = y*row_size + sx*3
        for (let x=sx;x<ex;x++){
            const m = layer_grid[p+0]
            if (m!==0){
                list[pp] = p
                pp = pp + 1
            }
            p = p + 3
        }
    }
    if (pp<list.length){
        list[pp] = 0
    }

    list.sort((a, b) => { 
        if (a===0 || b===0){
            return -1
        }
        const m1 = layer_grid[a+2]
        const m2 = layer_grid[b+2]
        return m2-m1
    })
}

// отрисовывает чанк
const _layer_paint_no_sort = (cx, cy, target) => {
    RENDER._renderStart(target)

    // заливаем основой
    RENDER._setProgram( sprite_mesh )

    let gsize = layer0_texture_scale*0.5

    let scale = 1.0
    let rx = 0.0
    let ry = 0.0

    RENDER._setValue('ox',  cx*layer0_texture_scale)
    RENDER._setValue('oy', -cy*layer0_texture_scale)
    RENDER._setValue('gsize', gsize)

    RENDER._setValue('mask',  ASSETS.getMask(1))
    RENDER._setValue('map',   tiles[0])
    RENDER._setValue('scale', scale)
    RENDER._setValue('rx', rx)
    RENDER._setValue('ry', ry)

    RENDER._renderObject( sprite_mesh)

    // -----
    gsize = layer_texture_scale*0.5
    rx = cx*layer_grid_cx
    ry = cy*layer_grid_cx
    let sx = rx - 2
    let sy = ry - 2
    let ex = rx + layer_grid_cx + 2
    let ey = ry + layer_grid_cx + 2
    if (sx<0){ sx = 0 }
    if (sy<0){ sy = 0 }
    if (ex>=CHUNK.count_x*layer_grid_cx){ ex=CHUNK.count_x*layer_grid_cx }
    if (ey>=CHUNK.count_y*layer_grid_cx){ ey=CHUNK.count_y*layer_grid_cx }

    const row_size   = (CHUNK.count_x*layer_grid_cx)*3
    const grid_step  = 2/layer_grid_cx
    const scale_step = (grid_step*0.5)*6.0

    let oy = -1 + (-2*grid_step)
    for (let y=sy;y<ey;y++){
        let p = y*row_size + sx*3
        let ox = -1 + (-2*grid_step)
        for (let x=sx;x<ex;x++){
            const m = layer_grid[p+0]
            if (m!==0){
                const t = layer_grid[p+1]
                const s = scale_step*(layer_grid[p+2]/255)
                
                RENDER._setProgram( sprite_mesh )
                RENDER._setValue('ox',  cx*layer_texture_scale)
                RENDER._setValue('oy', -cy*layer_texture_scale)
                RENDER._setValue('gsize', gsize)

                RENDER._setValue('mask',  ASSETS.getMask(m))
                RENDER._setValue('map', tiles[t])
                RENDER._setValue('scale', s)
                RENDER._setValue('rx', ox)
                RENDER._setValue('ry', oy)
            
                RENDER._renderObject( sprite_mesh)
            }
            p = p + 3
            ox = ox + grid_step
        }
        oy = oy + grid_step
    }

    RENDER._renderEnd()
}

const _layer_paint = (cx, cy, target) => {
    RENDER._renderStart(target)

    // заливаем основой
    RENDER._setProgram( sprite_mesh )

    let gsize = layer0_texture_scale*0.5

    RENDER._setValue('ox',  cx*layer0_texture_scale)
    RENDER._setValue('oy', -cy*layer0_texture_scale)
    RENDER._setValue('gsize', gsize)

    RENDER._setValue('mask',  ASSETS.getMask(1))
    RENDER._setValue('map',   tiles[0])
    RENDER._setValue('scale', 1.0)
    RENDER._setValue('rx', 0)
    RENDER._setValue('ry', 0)

    RENDER._renderObject( sprite_mesh)

    // -----
    gsize = layer_texture_scale*0.5
    const row_size   = (CHUNK.count_x*layer_grid_cx)*3
    const grid_step  = 2/layer_grid_cx
    const scale_step = (grid_step*0.5)*6.0

    const list = layer_list[cy*CHUNK.count_x+cx]

    let _ox = cx * layer_grid_cx
    let _oy = cy * layer_grid_cx

    for (let i=0;i<list.length;i++){
        let p = list[i]
        if (p===0){
            break
        }

        let y = Math.trunc(p/row_size)
        let x = Math.trunc((p - y*row_size)/3)

        let ox = -1 + (x - _ox)*grid_step
        let oy = -1 + (y - _oy)*grid_step

        const m = layer_grid[p+0]
        const t = layer_grid[p+1]
        const s = scale_step*(layer_grid[p+2]/255)

        RENDER._setProgram( sprite_mesh )
        RENDER._setValue('ox',  cx*layer_texture_scale)
        RENDER._setValue('oy', -cy*layer_texture_scale)
        RENDER._setValue('gsize', gsize)

        RENDER._setValue('mask',  ASSETS.getMask(m))
        RENDER._setValue('map', tiles[t])
        RENDER._setValue('scale', s)
        RENDER._setValue('rx', ox)
        RENDER._setValue('ry', oy)
    
        RENDER._renderObject( sprite_mesh)

    }

    RENDER._renderEnd()
}

// перерисовывает слой и вокруг 
export const repaint_layer = (cx,cy)=>{
    for (let y = cy - 1; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
            if (x >= 0 && y >= 0 && x < CHUNK.count_x && y < CHUNK.count_y) {
                let g = CHUNK.get(x,y)
                if (g.viewport !== null) {
                    _layer_paint(x, y, g.viewport.ground)
                    //g.viewport.grass_ready = false
                }
            }
        }
    }
}

//  
export const refresh_layers = ()=>{
    for (let i = 0; i < CHUNK.viewport_free_n; i++) {
        let t = CHUNK.viewport[CHUNK.viewport_free[i]]
        t.ground_ready = false
    }
}

export const layer_render = (x,y,ground)=>{
    _layer_paint(x, y, ground)
    return true
}

// устанавливает новую покраску на слое
export const _set_point = (rx, ry, mask, txt, size) => {
    let lx = Math.round((rx*layer_grid_cx)/CHUNK.r_width)
    let ly = Math.round((ry*layer_grid_cx)/CHUNK.r_width)
    const mx = CHUNK.count_x*layer_grid_cx
    const my = CHUNK.count_y*layer_grid_cx
    if ( mask===0 ){
        let w = 0
        if (size==1){
            w=0
        }
        if (size==2){
            w=1
        }
        if (size==3){
            w=2
        }
        if (size>=4){
            w=3
        }
        for (let y = ly-w; y<=ly+w; y++) {
            for (let x = lx-w; x<=lx+w; x++) {
                if (x>=0 && y>=0 && x<mx && y<my) {
                    let p = (y*mx + x)*3
                    layer_grid[p + 0] = 0
                    layer_grid[p + 1] = 0
                    layer_grid[p + 2] = 0
                }
            }
        }
    }else{
        if (lx>=0 && ly>=0 && lx<mx && ly<my) {
            let p = (ly*mx + lx)*3
            layer_grid[p + 0] = mask
            layer_grid[p + 1] = txt
            layer_grid[p + 2] = Math.round(size * 255 / 6)
        }
    }
}

// устанавливает новую покраску и перерисовывает чанк
export const set_point = (rx, ry, mask, txt, size) => {
    
    _set_point(rx, ry, mask, txt, size)
    
    const cx = Math.trunc(rx/CHUNK.r_width)
    const cy = Math.trunc(ry/CHUNK.r_width)

    for (let y = cy - 1; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
            if (x >= 0 && y >= 0 && x < CHUNK.count_x && y < CHUNK.count_y) {
                let g = CHUNK.get(x,y)
                if (g.viewport !== null) {
                    make_layer_list(x,y)
                    _layer_paint(x, y, g.viewport.ground)
                }
            }
        }
    }
}

//--------------------------------------------------
export const set_mask_position = (x,y,size)=>{
    if (ground_mesh.material.uniforms){
        ground_mesh.material.uniforms.mx.value = x
        ground_mesh.material.uniforms.my.value = y
        ground_mesh.material.uniforms.size.value = (CHUNK.r_width/(2*layer_grid_cx))*size
    }
}

//--------------------------------------------------
// переносим загруженные слои на наши слои
const update_layer = (e)=>{
    let layer_image = e.target
    let canvas = document.createElement('canvas')
    canvas.width = layer_image.width
    canvas.height = layer_image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(layer_image, 0, 0)
    let d = ctx.getImageData(0, 0, layer_image.width, layer_image.height)
    let ii = 0
    for (let i=0;i<d.data.length;i=i+4){
        layer_grid[ii+0] = d.data[i+0]
        layer_grid[ii+1] = d.data[i+1]
        layer_grid[ii+2] = d.data[i+2]
        ii=ii+3
    }
    d = null
    layer_image = null
    canvas = null

    for (let y=0; y<CHUNK.count_y; y++) {
        for (let x=0; x<CHUNK.count_x; x++) {
            make_layer_list(x,y)
         }
    }

    refresh_layers()
}

export const load = (map_id)=>{
    // загружаем раскраску - слои
    const layer_image = new Image()
    layer_image.onload = (e)=>{
        update_layer(e)
        //count = count - 1
        //if (count===0){
        //    resolve()
        //}
    }
    layer_image.src = _path+'layer_'+map_id+'.png?'+Date.now()

    //create_map()
/*
    return new Promise((resolve,reject)=>{
        //
        let count = 3

        const loader = new TextureLoader()
        loader.setPath(_path)
        
        // загружаем миникарту
        loader.load('map_'+map_id+'.png?'+Date.now(), (texture)=>{
            minimap_mesh.material.uniforms.map.value = texture
            count = count - 1
            if (count===0){
                resolve()
            }
        })
    })
*/
}

export const prepare = ()=>{

}
