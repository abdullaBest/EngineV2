/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as UTILS      from './utils.js'
import * as RENDER     from './render.js'
import * as CHUNKS     from './chunks.js'
import * as VIEWPORT   from './viewport.js'
import * as ASSETS     from './assets.js'
import * as INFO       from './info.mjs'
import * as HEIGHTMAP  from './heightmap.js'
import * as PAINTLAYER from './paintlayer.js' 
import {
    WebGLRenderTarget,
    RGBAFormat,
    ShaderMaterial,
    MeshLambertMaterial,
    DoubleSide,
    Mesh,
    LinearFilter,
    LinearMipmapLinearFilter,
    ReplaceStencilOp,
    EqualStencilFunc,
    Vector3,
    Vector4,
} from '/lib/three.js'

let ground_mesh             = null
let ground_material         = null

let map_width               = 1                 // размер карты
export let half_map_width   = 0.5               // 
let chunk_width             = 1                 // ширина и высота чанка
let texture_size            = 64                // размер текстуры на чанк
let normal_factor           = 0.04              // сила изменения направления нормали для освещения
let heightmap_cx            = 1                 // сетка чанка карты высот


let minimap_material = null

export let minimap_mesh         = null
let minimap_grid_cx             = 128

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

export const loaded_paint_tiles = ()=> refresh_paintlayer() 
export const loaded_paint_layer = ()=> { PAINTLAYER.loaded(); refresh_paintlayer() }
export const loaded_heightmap   = ()=> HEIGHTMAP.loaded() 

export const setPaintParams = (grid_cx, t0scale, t1scale, textureSize)=>{
    // запускаем обновление отрисовки
    refresh_paintlayer()

    PAINTLAYER.setTextureScale(t0scale, t1scale)

    if (texture_size!==textureSize){
        
        VIEWPORT.free()
        texture_size = textureSize
        prepare_viewport()
    }

    PAINTLAYER.resize(grid_cx)

}

export const setNormalF = (normalf)=>normal_factor = normalf

const updateGroundMeshGeometry = ()=>{

    if (ground_mesh!==null){
        ground_mesh.geometry.dispose()
    }

    ground_mesh = new Mesh(UTILS.generate_grid(
        chunk_width, 
        chunk_width, 
        heightmap_cx,
        heightmap_cx,
        0,
        0
    ), ground_material)
    ground_mesh.castShadow    = false
    ground_mesh.receiveShadow = false //true
}

export const prepare_viewport = ()=>{
    for (let i = 0; i < VIEWPORT.viewport.length; i++) {
        const t = new WebGLRenderTarget(
            texture_size, texture_size,
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
        
        const v = VIEWPORT.viewport[i]
        v.ground = t
    }
}

export const getMapWidth       = ()=>map_width

export const getViewGPUUsage    = ()=>VIEWPORT.viewport.length*(texture_size*texture_size*4)
export const preparePaintTiles  = (tiles)=>PAINTLAYER.prepare_tiles(tiles)
export const getPaintGrid       = ()=> PAINTLAYER.getGrid()
export const getPaintWidth      = ()=> PAINTLAYER.getWidth()
export const setHeightmapHeight = (height)=>HEIGHTMAP.setMaxHeight(height)
export const getHeightmapGrid   = ()=> HEIGHTMAP.getGrid()
export const getHeightmapWidth  = ()=> HEIGHTMAP.getWidth()
export const heightmapLoadGray  = (t)=> HEIGHTMAP.loadGray(t)
export const heightmapLoad      = (id)=> HEIGHTMAP.load(id)
export const paintLoad          = (id)=> PAINTLAYER.load(id)
export const paintClearAll      = ()=> { PAINTLAYER.clearAll(); refresh_paintlayer() }

export const resize = (chunks,view,width)=>{
    VIEWPORT.free()

    chunk_width    = width
    map_width      = chunks*width
    half_map_width = map_width*0.5

    // создаем чанки
    CHUNKS.create(chunks)
    
    // создаем view
    VIEWPORT.create(view)
    prepare_viewport()

    // создаем слой покраски

    PAINTLAYER.resize(PAINTLAYER.get_cx())

    // создаем карту высот
    HEIGHTMAP.resize(chunks*heightmap_cx)

    // создаем геометрию
    updateGroundMeshGeometry()
    
    // запускаем обновление отрисовки
    refresh_paintlayer()
}

export const setHeightmapCx = (cx)=>{
    heightmap_cx = cx

    // создаем карту высот
    HEIGHTMAP.resize(CHUNKS.count_x*heightmap_cx)

    // создаем геометрию
    updateGroundMeshGeometry()
}
// красим слой 
export const setPaint = ( x, y, mask, tile, size )=>{
    
    const _x = x + half_map_width
    const _y = y + half_map_width

    // находим координаты в слое
    const w  = PAINTLAYER.getWidth()/map_width
    const lx = Math.round(_x*w)
    const ly = Math.round(_y*w)
    
    // находим координаты в чанке
    const cx = Math.trunc(_x/chunk_width)
    const cy = Math.trunc(_y/chunk_width)

    PAINTLAYER.set_point(lx, ly, cx, cy, mask, tile, size)
}

// редактируем карту высот
export const setHeightmap = ( x, y, mode, mask, size, power)=>{
    // переводим в пространство карты высот
    const _x = x/half_map_width
    const _y = y/half_map_width

    HEIGHTMAP.set_heightmap(_x,_y,mode,mask,size,power)
}
//--------------------------------------------------
//проверяет нужно ли обновить данные по карте высот, после редактирования
export const check_heightmap_data = ()=>{ if ( HEIGHTMAP.needs_update_data ) HEIGHTMAP.update_heightmap_data() }

// выставляем положение маски на карте
export const set_mask_position = (mode,position,size)=>{
    if (!ground_mesh.material.uniforms){
        return 
    }

    ground_mesh.material.uniforms.mx.value = position.x + half_map_width
    ground_mesh.material.uniforms.my.value = position.z + half_map_width

    let _size = 0
    switch(mode){
        case 0: _size = (chunk_width/PAINTLAYER.get_cx())*0.5
                break;
        case 1: _size = (chunk_width/heightmap_cx)*0.5
                break;
    }

    ground_mesh.material.uniforms.size.value = _size*size
}

// определяем положение указателя на карте высот
export const over_heightmap = (ray,result)=>{
    result.x = ray.origin.x
    result.y = ray.origin.y
    result.z = ray.origin.z

    // если луч смотрит вверх то смысла проверять нет
    if (ray.direction.y>=0){
        return
    }

    // переводим положени луча в пространство карты высот
    const scale = HEIGHTMAP.getWidth()/map_width

    let rx = (ray.origin.x + half_map_width)*scale
    let ry = ray.origin.y
    let rz = (ray.origin.z + half_map_width)*scale
    let dx = ray.direction.x*scale
    let dy = ray.direction.y
    let dz = ray.direction.z*scale

    // находим пересечение, если distance=0 то пересечения нет
    const distance = HEIGHTMAP.ray_vs_heightmap(rx,ry,rz,dx,dy,dz)

    // расчитываем положение точки
    result.x = result.x + ray.direction.x*distance
    result.y = result.y + ray.direction.y*distance
    result.z = result.z + ray.direction.z*distance
}

// ставим флаг на обновление всех видимых слоев
export const refresh_paintlayer = ()=>{
    const l = VIEWPORT.viewport_free_n
    for (let i = 0; i < l; i++) {
        const n = VIEWPORT.viewport_free[i]
        const t = VIEWPORT.viewport[n]
        t.ground_ready = false
    } 
}

// обновляем центр видимых чанков
export const update_view = (x,y)=>{
    const cx = Math.trunc( (x + half_map_width) / chunk_width)
    const cy = Math.trunc( (y + half_map_width) / chunk_width)
    VIEWPORT.update(cx,cy)
}

const render_block = (x,y,ground)=>{
    const m = ground_mesh
    const rx = x*chunk_width 
    const ry = y*chunk_width
    m.position.x = rx - half_map_width
    m.position.y = 0
    m.position.z = ry - half_map_width

    m.updateMatrix()
    m.matrixWorld.multiplyMatrices( RENDER.scene.matrixWorld, m.matrix )
    //m.matrixWorldNeedsUpdate = false
    m.material.map = ground.texture

    RENDER.setProgram(m)
    RENDER._setValue('hmap',    HEIGHTMAP.getTexture() )
    RENDER._setValue('map',     ground.texture )
    RENDER._setValue('ox',      rx )
    RENDER._setValue('oy',      ry )
    RENDER._setValue('mask',    ASSETS.getMask(2) )
    RENDER._setValue('mx',      ground_mesh.material.uniforms.mx.value )
    RENDER._setValue('my',      ground_mesh.material.uniforms.my.value )
    RENDER._setValue('size',    ground_mesh.material.uniforms.size.value )
    RENDER._setValue('normalf', normal_factor )
    RENDER._setValue('hstep',   HEIGHTMAP.getStep() )
    RENDER._setValue('maxw',    map_width )
    RENDER._renderObject(m)
}

// рисуем землю чанков
export const render = ()=>{
    const l = VIEWPORT.viewport_free_n
    for (let i = 0; i < l; i++) {
        const t = VIEWPORT.viewport[VIEWPORT.viewport_free[i]]
        if (!t.ground_ready){
            continue
        }
        render_block(t.x,t.y,t.ground)
    } 
}

// подготавливаем
export const render_after = ()=>{
    const l = VIEWPORT.viewport_free_n
    for (let i = 0; i < l; i++) {
        let t = VIEWPORT.viewport[VIEWPORT.viewport_free[i]]
        if (!t.ground_ready){
            PAINTLAYER.paint(t.x,t.y,t.ground)
            t.ground_ready = true
            break;
        }
    }
}

export const load = (id,params)=>{

    create(params)

    PAINTLAYER.prepare_tiles(params.tiles)

    PAINTLAYER.load(id)

    HEIGHTMAP.load(id)
}

export const create = (params)=>{
    
    chunk_width    = params.chunk_width
    texture_size   = params.texture_size
    map_width      = params.chunks*chunk_width
    half_map_width = map_width*0.5
    heightmap_cx   = params.hm_cx
    normal_factor  = params.normalf

    // создаем чанки
    CHUNKS.create(params.chunks)
    
    // создаем view
    VIEWPORT.create(params.view)
    prepare_viewport()

    // создаем слой покраски
    PAINTLAYER.create(params.layer_cx)
    PAINTLAYER.setTextureScale( params.layer_t0_scale, params.layer_t1_scale )

    // создаем карту высот
    HEIGHTMAP.prepare( params.chunks*heightmap_cx, params.hm_max )

    // создаем геометрию
    updateGroundMeshGeometry()
}


prepare_ground_material()

updateGroundMeshGeometry()



