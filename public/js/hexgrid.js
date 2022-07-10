/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as LAND      from '/js/land.js'
import * as INFO      from '/js/info.mjs'
import * as NET       from '/js/net.js'
import * as ASSETS    from '/js/assets.js'
import * as HEIGHTMAP from '/js/heightmap.js' 
import * as CAMERA    from '/js/camera_orbit.js'
import * as UTILS     from '/js/utils.js'
import * as LIBRARY   from '/js/library.js'
import * as RENDER    from '/js/render.js'
import * as CHUNKS    from '/js/chunks.js'
import * as VIEWPORT  from '/js/viewport.js'

import {
    Object3D,
    UVMapping,
    ClampToEdgeWrapping,
    RepeatWrapping,
    LinearFilter,
    NearestFilter,
    RGBFormat,
    UnsignedByteType,
    CanvasTexture,
    Color,
} from '/lib/three.js'

const _hexb = new Float32Array(8).fill(0)

let count_x            = 1
let count_y            = 1
let _ids               = 0
let grid               = null
let scale              = 1.0

let texture_size       = 256
let texture_blur       = 1
let texture_line_width = 1 
let texture_hex_scale  = 1
let texture_grid_f     = 0.5
let grid_texture       = null
let texture_grid_color = new Color(1.0,1.0,1.0)

export const cursor    = [0,0]

export let selector    = null

export const getWidth          = ()=>count_x
export const getHeight         = ()=>count_y
export const get_grid_texture  = ()=>grid_texture
export const get_grid_t_scale  = ()=>texture_hex_scale
export const get_grid_t_width  = ()=>texture_size
export const get_grid_t_blur   = ()=>texture_blur
export const get_grid_t_lwidth = ()=>texture_line_width

export const get_grid_scale    = ()=>1/(scale*3)
export const get_grid_f        = ()=>texture_grid_f
export const get_grid_color    = ()=>texture_grid_color

export const set_grid_color   = (color)=> texture_grid_color.set(color)
export const set_grid_f       = (f)=> texture_grid_f = f

export const set_grid_param   = ( size, line_width, hex_scale, blur)=> {
    texture_line_width = line_width
    texture_hex_scale  = hex_scale
    texture_size       = size
    texture_blur       = blur
    update_texture()
}

export const getScale         = ()=>scale
export const setScale         = (_scale)=>scale = _scale
export const getGrid          = ()=>grid

// считывает ячейку
export const get              = (x,y)=>grid[Math.min(Math.max(y,0),count_y-1)*count_x + Math.min(Math.max(x,0),count_x-1)]
export const get_rx           = (hex_x,hex_y)=>(hex_x + (hex_y % 2) * 0.5)*scale
export const get_ry           = (hex_y)=>(hex_y * 0.75)*scale

// создаем новый объект
const new_obj = (lib,prop)=>{
    return Object.seal({
        name          : lib.name,
        lib           : lib,
        prop          : prop,
        mesh          : lib.mesh,
        rot_y         : 0,
        // координаты гекса на карте
        x             : 0,                           
        y             : 0,
        // чанк
        cx            : 0,      
        cy            : 0,
        chunk_prev    : null,
        chunk_next    : null,
    })
}

export const get_hex_coordinates = (world_x,world_z)=>{
    const rx = world_x/scale
    const rz = world_z/scale
    const ix = Math.trunc(rx)
    const iy = Math.trunc(rz)

    switch (iy%3){
        case 0:
            _hexb[0] = ix
            _hexb[1] = iy 
            _hexb[2] = ix+1.0
            _hexb[3] = iy
            _hexb[4] = ix+0.5
            _hexb[5] = iy+0.75
            _hexb[6] = 0
            _hexb[7] = 0
            break;
        case 1:
            _hexb[0] = ix+0.5
            _hexb[1] = iy-0.25
            _hexb[2] = ix
            _hexb[3] = iy+0.50
            _hexb[4] = ix+1.0
            _hexb[5] = iy+0.50
            _hexb[6] = ix+0.5
            _hexb[7] = iy+1.25
            break;
        case 2:
            _hexb[0] = ix+0.5
            _hexb[1] = iy+0.25
            _hexb[2] = ix
            _hexb[3] = iy+1.0
            _hexb[4] = ix+1.0
            _hexb[5] = iy+1.0
            _hexb[6] = 0
            _hexb[7] = 0
            break;
    }

    const d1 = (_hexb[0]-rx)*(_hexb[0]-rx)+(_hexb[1]-rz)*(_hexb[1]-rz)
    const d2 = (_hexb[2]-rx)*(_hexb[2]-rx)+(_hexb[3]-rz)*(_hexb[3]-rz)
    const d3 = (_hexb[4]-rx)*(_hexb[4]-rx)+(_hexb[5]-rz)*(_hexb[5]-rz)
    const d4 = (_hexb[6]-rx)*(_hexb[6]-rx)+(_hexb[7]-rz)*(_hexb[7]-rz)

    let n = 0 
    if (d2<d1){
        n = 2 
        if (d3<d4){
            if (d3<d2){
                n = 4
            }
        }else{
            if (d4<d2){
                n = 6
            }
        }
    }else{
       if (d3<d4){
            if (d3<d1){
                n=4
            }
        }else{
            if (d4<d1){
                n=6
            }
        }
    }
    //
    cursor[0] = Math.trunc(_hexb[n])
    cursor[1] = Math.trunc(_hexb[n+1]/0.75)
}

// определяет координаты гекса по мировым координатам
export const set_cursor_postion = (_rx,_rz)=>{

    get_hex_coordinates(_rx,_rz)
    
    // ограничиваем размером карты
    cursor[0] = Math.min(Math.max(cursor[0],0),count_x-1)
    cursor[1] = Math.min(Math.max(cursor[1],0),count_y-1)

}

export const setTextureParams = (size,scale,line_width,blur)=>{
    texture_size       = size
    texture_line_width = line_width
    texture_hex_scale  = scale
    texture_blur       = blur
    update_texture()
}

const update_texture = ()=>{
    if (grid_texture!==null){
        grid_texture.dispose()
    }
    grid_texture = UTILS.create_hexgrid_texture(texture_size, texture_line_width, texture_hex_scale, texture_blur)
}

export const update_selector = ()=>{
    if (selector!==null){
        selector.geometry.dispose()
    }
    selector = UTILS.create_selector_mesh(scale*0.5)
}

export const prepareParam = (param)=>{

    scale = parseFloat(param.scale)

    texture_line_width = parseFloat(param.texture_line_width)
    texture_hex_scale  = parseFloat(param.texture_hex_scale)
    texture_size       = parseInt(param.texture_size)
    texture_blur       = parseFloat(param.texture_blur)
    texture_grid_f     = parseFloat(param.texture_grid_f)

    texture_grid_color.r = (parseInt(param.texture_grid_color[0])/255)
    texture_grid_color.g = (parseInt(param.texture_grid_color[1])/255)
    texture_grid_color.b = (parseInt(param.texture_grid_color[2])/255)
    
    update_texture()
    update_selector()

    const width  = parseInt(param.width)
    const height = parseInt(param.height)
    
    create(width,height)

}

export const add_to_chunk = (o)=>{

    let rx = get_rx(o.x,o.y)
    let ry = get_ry(o.y)
    let cx = Math.trunc(rx/LAND.chunk_width)
    let cy = Math.trunc(ry/LAND.chunk_width)

    CHUNKS.add_sorted(o,cx,cy)
}

export const add = (name,x,y)=>{
    const cell = get(x,y)
    for (let i=0;i<cell.length;i++){
        if (cell[i].name===name){
            return
        }
    }

    const lib = LIBRARY.get(name)
    if (!lib){
        return
    }
    const o = new_obj(lib,Object.assign({name:lib.name},lib.prop))
    o.x  = x
    o.y  = y
    if (lib.prop.rot!==undefined){
        o.prop.rot = Math.trunc(Math.random()*360)
        o.rot_y = RENDER.deg_to_rad(obj.prop.rot)
    }
    cell.push(o)
    //
    add_to_chunk(o)
    //
}

export const remove = (x,y,n)=>{
    const cell = get(x,y)

    const o = cell[n]
    cell.splice(n,1)
    CHUNKS.remove(o)
}

export const removeAll = (x,y)=>{
    const cell = get(x,y)
    for (let i=0;i<cell.length;i++){
        const o = cell[i]
        CHUNKS.remove(o)
    }
    cell.length = 0
}

export const remove_by_name = (x,y,name)=>{
    const cell = get(x,y)

    for (let i=0;i<cell.length;i++){
        const o = cell[i]
        if (o.name===name){
            cell.splice(i,1)
            CHUNKS.remove(o)
            break;
        }
    }
}

export const prepareGrid = (_grid)=>{
    let l = 0
    for (let y=0;y<count_y;y++){
        for (let x=0;x<count_x;x++){
            const a = _grid[l]
            const cell = grid[l]
            l = l + 1
            if(!Array.isArray(a) || !Array.isArray(cell) ){
                continue
            }
            //console.log(a)
            for (let j=0;j<a.length;j++){
                const o = a[j]
                const lib = LIBRARY.get(o.name)
                if (!lib){
                    continue
                }
                const obj = new_obj(lib,o)
                obj.x  = x
                obj.y  = y
                
    
                if (o.rot!==undefined){
                    obj.rot_y = RENDER.deg_to_rad(o.rot)
                }
                cell.push(obj)
                //
                add_to_chunk(obj)
            }
        }
    }
}


export const set_selector_position = (mouse)=>{
    let x = mouse.x + LAND.half_map_width
    let y = mouse.z + LAND.half_map_width
    set_cursor_postion(x,y)

    x = cursor[0]
    y = cursor[1]

    let rx = get_rx(x,y)
    let rz = get_ry(y)

    selector.position.x = rx - LAND.half_map_width
    selector.position.z = rz - LAND.half_map_width
    selector.position.y = LAND.heightmap_height(selector.position.x,selector.position.z)+0.1
}


const render_selector = ()=>{
    const m = selector
    if (m===null){
        return 
    }
    //const rx = x*chunk_width 
    //const ry = y*chunk_width
    //m.position.x = rx - half_map_width
    //m.position.y = 0
    //m.position.z = ry - half_map_width

    m.updateMatrix()
    m.matrixWorld.multiplyMatrices( RENDER.scene.matrixWorld, m.matrix )

    RENDER.render_mesh(m)
}

export const object_update_position = (o,m,h)=>{
    /*
        const smooth_step = 0.05 // сглаженный переход
        if (o._moving){
    
            let t = render_time - o._mov_st 
    
            if (t>o._mov_dt){
                if (o._mov_i===1){
                    t = t - o._mov_dt
                    shift_animation_list(o)
                }            
            }
    
            if (t>o._mov_dt){
                o._moving = false
                t = o._mov_dt
            }
    
            let x1 = o._mov_l[0]
            let y1 = o._mov_l[1]
            let x2 = o._mov_l[3]
            let y2 = o._mov_l[4]
    
            let delta = t/o._mov_dt
    
            let px = x1 + (x2-x1)*delta
            let py = y1 + (y2-y1)*delta
         
            px = px + o.info.pos[0]
            py = py + o.info.pos[2]
    
            let vx = px - m.position.x
            let vy = py - m.position.z
    
            m.position.x = m.position.x + vx*smooth_step
            m.position.z = m.position.z + vy*smooth_step
    
            let d = vx*vx+vy*vy
            if (d>0.00001){
                m.rotation.y = o.rot_y - Math.atan2(vy, vx)
            }
     
        }else{
            */
            let rx = get_rx(o.x,o.y)
            let rz = get_ry(o.y)

            m.position.x = rx - LAND.half_map_width
            m.position.z = rz - LAND.half_map_width
            m.position.y = LAND.heightmap_height(m.position.x,m.position.z)

            //if (hh<0){
            //    hh = 0
            //}
            //
            //m.position.x = m.position.x + o.lib.pos[0]
            //m.position.y = h + hh + 0.01 + o.lib.pos[1]
            //m.position.z = m.position.z + o.lib.pos[2]
    
            m.rotation.y = o.rot_y
    /*
        }
    */
}

export const render_block = (cx,cy)=>{
    const chunk = CHUNKS.get(cx,cy)
    let o = chunk.objects_first
    while (o!==null){
        if (o.mesh){
            let m = o.mesh
    
                /*
                const visible = get_hexmap_fade_state(o.x,o.y)
    
                if (o.mixer.length!==0){
                    //Костыль. Если анимации находяться отдельно от меша, то иногда бывает так что 
                    // кости задействованные в анимации отсутствуют в скелете меша и вся анимация переходит на сам объект, 
                    // из за чего положение и поворот могут быть изменены, поэтому здесь мы их сохраняем а потом востанавливаем
                    // Решение: -
                    let px = m.position.x
                    let py = m.position.y
                    let pz = m.position.z
                    let rx = m.rotation.x
                    let ry = m.rotation.y
                    let rz = m.rotation.z
                    //
                    for (let i=0;i<o.mixer.length;i++){
                        o.mixer[i].update( delta2 )
                    }
                    //
                    m.position.x = px
                    m.position.y = py
                    m.position.z = pz
                    m.rotation.x = rx
                    m.rotation.y = ry
                    m.rotation.z = rz
                    //
                }
                
    
                if (visible!==0){
                    if (render_mesh(m,o)){
                        if (o.gui_active){
                            GD.onRender(o)
                        }
                    }
                }
    
                //if (fill_visible && g.data){
                //    map_render_fill(g,x,y)
                //}
                */
    
                let h = 0 //gd_get_height(o.x,o.y)
                if (h<0){
                    h=0
                }
            
            object_update_position(o,m,h)
    
            RENDER.update_matrix(m)
            RENDER.render_mesh(m)
             
        }
        o = o.chunk_next
    }
    //
}

export const render = ()=>{
    const l = VIEWPORT.viewport_free_n
    for (let i = 0; i < l; i++) {
        const t = VIEWPORT.viewport[VIEWPORT.viewport_free[i]]
        render_block(t.x,t.y)
    } 

    render_selector()
}


export const create = ( width, height)=>{
    
    count_x   = width
    count_y   = height
    
    _ids = 0
    grid = new Array(width*height)
    let i = 0
    for (let y=0;y<count_y;y++){
        for (let x=0;x<count_x;x++){
            const cell = []
            grid[i] = cell
            i=i+1
        }
    }
}

update_texture()

