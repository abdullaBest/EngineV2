/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as RENDER    from './render.js'
import * as CHUNKS    from './chunks.js'
import * as UTILS     from './utils.js'
import * as ASSETS    from './assets.js'
import * as INFO      from './info.mjs'
import {
    ShaderMaterial,
    DoubleSide,
    Mesh,
} from '/lib/three.js'

const _path                     = '/l/'

export const tiles              = new Array(64).fill(null)    // тайловые текстуры
tiles[0] = ASSETS.getEmptyTexture()                 // подготавливаем нулевую текстуру затычку

let layer_grid                  = null              // данные по покраске карты (3 значения - mask, texture, size )
let layer_list                  = null              // 
let layer_grid_cx               = 16                // количество точек в одном чанке
let t0_scale                    = 8                 // размер текстуры заливки
let t1_scale                    = 8                 // размер текстуры в сетке
let width                       = 0                 // ширина 
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
            'lUv2 = vec2(ox + gl_Position.x*gsize,1.0 - (oy + gl_Position.y*gsize));',
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

export const getGrid  = ()=>layer_grid
export const getWidth = ()=>width
export const get_cx   = ()=>layer_grid_cx

export const prepare_tiles = (list)=>{
    for (let i=0;i<list.length;i++){
        tiles[i] = ASSETS.get_texture(list[i])
    }

    ASSETS.set_assets_flag(INFO.ASSETS_LAND_TILES)
}

export const setTextureScale = (scale0,scale1)=>{
    t0_scale = scale0
    t1_scale = scale1
}

export const resize = (new_layer_grid_cx)=>{

    const old_width = width

    layer_grid_cx = new_layer_grid_cx
    width = CHUNKS.count_x*layer_grid_cx

    // если размеры не совпадают то переносим старые данные на новую сетку
    if (old_width!==width){
        const old_grid = layer_grid
        const scale = old_width/width
        prepare_layer()
        for (let y=0;y<width;y++){
            for (let x=0;x<width;x++){
                const ox = Math.trunc(x*scale)
                const oy = Math.trunc(y*scale)
                const p1 = (y*width + x)*3
                const p2 = (oy*old_width + ox)*3
                layer_grid[ p1 + 0] = old_grid[ p2 + 0 ]
                layer_grid[ p1 + 1] = old_grid[ p2 + 1 ]
                layer_grid[ p1 + 2] = old_grid[ p2 + 2 ]
            }
        }
    }

    // обновляем списки на отрисовку
    for (let y=0; y<CHUNKS.count_y; y++) {
        for (let x=0; x<CHUNKS.count_x; x++) {
            make_layer_list(x,y)
        }
    }
}

export const clearAll = ()=>{
    layer_grid.fill(0)
    // обновляем списки на отрисовку
    for (let y=0; y<CHUNKS.count_y; y++) {
        for (let x=0; x<CHUNKS.count_x; x++) {
            make_layer_list(x,y)
        }
    }
}

export const prepare_layer = ()=>{
    // заливаем слои
    layer_grid = new Uint8Array( width*width*3 )
    layer_grid.fill(0)

    layer_list = new Array(CHUNKS.count_x * CHUNKS.count_y)
    for (let i=0;i<layer_list.length;i++){
        layer_list[i] = new Uint32Array( (layer_grid_cx+2) * (layer_grid_cx+2)  )
    }
}

export const create = ( _layer_grid_cx )=>{
    layer_grid_cx = _layer_grid_cx
    width         = CHUNKS.count_x*layer_grid_cx

    prepare_layer()
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
    ex = Math.min( ex, width )
    ey = Math.min( ey, width )

    const row_size = width*3
    const list = layer_list[cy*CHUNKS.count_x+cx]
    let pp = 0 

    for (let y=sy;y<ey;y++){
        let p = (y*row_size + sx*3) + 1
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
        const m1 = layer_grid[a+1]
        const m2 = layer_grid[b+1]
        return m2-m1
    })
}

// отрисовывает чанк
const paint_no_sort = (cx, cy, target) => {
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
    if (ex>=CHUNKS.count_x*layer_grid_cx){ ex=CHUNKS.count_x*layer_grid_cx }
    if (ey>=CHUNKS.count_y*layer_grid_cx){ ey=CHUNKS.count_y*layer_grid_cx }

    const row_size   = (CHUNKS.count_x*layer_grid_cx)*3
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

export const paint = (cx, cy, target) => {
    RENDER._renderStart(target)

    // заливаем основой
    RENDER._setProgram( sprite_mesh )

    let gsize = t0_scale*0.5

    RENDER._setValue('ox',    cx*t0_scale)
    RENDER._setValue('oy',    -cy*t0_scale)
    RENDER._setValue('gsize', gsize)

    RENDER._setValue('mask',  ASSETS.getMask(1))
    RENDER._setValue('map',   tiles[0])
    RENDER._setValue('scale', 1.0)
    RENDER._setValue('rx',    0)
    RENDER._setValue('ry',    0)

    RENDER._renderObject( sprite_mesh)

    // -----
    gsize = t1_scale*0.5
    const row_size   = (CHUNKS.count_x*layer_grid_cx)*3
    const grid_step  = 2/layer_grid_cx
    const scale_step = (grid_step*0.5)*6.0

    const list = layer_list[cy*CHUNKS.count_x+cx]

    let _ox = cx * layer_grid_cx
    let _oy = cy * layer_grid_cx

    for (let i=0;i<list.length;i++){
        let p = list[i]
        if (p===0){
            break
        }

        p = p - 1
        let y = Math.trunc(p/row_size)
        let x = Math.trunc((p - y*row_size)/3)

        let ox = -1 + (x - _ox)*grid_step
        let oy = -1 + (y - _oy)*grid_step

        const m = layer_grid[p+0]
        const t = layer_grid[p+1]
        const s = scale_step*(layer_grid[p+2]/255)

        RENDER._setProgram( sprite_mesh )
        RENDER._setValue('ox',    cx*t1_scale)
        RENDER._setValue('oy',    -cy*t1_scale)
        RENDER._setValue('gsize', gsize)

        RENDER._setValue('mask',  ASSETS.getMask(m))
        RENDER._setValue('map',   tiles[t])
        RENDER._setValue('scale', s)
        RENDER._setValue('rx',    ox)
        RENDER._setValue('ry',    oy)
    
        RENDER._renderObject( sprite_mesh)

    }

    RENDER._renderEnd()
}

// перерисовывает слой и вокруг 
export const repaint_layer = (cx,cy)=>{
    for (let y = cy - 1; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
            if (x >= 0 && y >= 0 && x < CHUNKS.count_x && y < CHUNKS.count_y) {
                let g = CHUNKS.get(x,y)
                if (g.viewport !== null) {
                    paint(x, y, g.viewport.ground)
                }
            }
        }
    }
}

//  
// устанавливает новую покраску на слое
export const _set_point = (lx, ly, mask, txt, size) => {
    if ( mask===0 ){
        const w = Math.max( 0, Math.trunc(size-1 ))

        for (let y = ly-w; y<=ly+w; y++) {
            for (let x = lx-w; x<=lx+w; x++) {
                if (x>=0 && y>=0 && x<width && y<width) {
                    const p = (y*width + x)*3
                    layer_grid[p + 0] = 0
                    layer_grid[p + 1] = 0
                    layer_grid[p + 2] = 0
                }
            }
        }
    }else{
        if (lx>=0 && ly>=0 && lx<width && ly<width) {
            const p = (ly*width + lx)*3
            layer_grid[p + 0] = mask
            layer_grid[p + 1] = txt
            layer_grid[p + 2] = Math.round(size * 255 / 6)
        }
    }
}

// устанавливает новую покраску и перерисовывает чанк
export const set_point = (lx, ly, cx, cy, mask, txt, size) => {
    
    _set_point(lx, ly, mask, txt, size)
    
    for (let y = cy - 1; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
            if (x >= 0 && y >= 0 && x < CHUNKS.count_x && y < CHUNKS.count_y) {
                const g = CHUNKS.get(x,y)
                make_layer_list(x,y)
                if (g.viewport !== null) {
                    paint(x, y, g.viewport.ground)
                }
            }
        }
    }
}

//--------------------------------------------------
// переносим загруженные слои на наши слои
const update_layer = (image)=>{
    let canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = width
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, 0, 0, width, width)
    let d = ctx.getImageData(0, 0, width, width)
    let ii = 0
    for (let i=0;i<d.data.length;i=i+4){
        layer_grid[ii+0] = d.data[i+0]
        layer_grid[ii+1] = d.data[i+1]
        layer_grid[ii+2] = d.data[i+2]
        ii=ii+3
    }
    d = null
    image = null
    canvas = null

    for (let y=0; y<CHUNKS.count_y; y++) {
        for (let x=0; x<CHUNKS.count_x; x++) {
            make_layer_list(x,y)
        }
    }
}

// загружаем раскраску - слои
export const load = (id)=>{
    ASSETS.load_image_by_name('paintlayer',_path+'layer_'+id+'.png?'+Date.now(),INFO.ASSETS_LAND_LAYER)
}

export const loaded = ()=>{
    const image = ASSETS.get_by_name('paintlayer')
    update_layer(image)
    ASSETS.delete_by_name('paintlayer')
}

// 