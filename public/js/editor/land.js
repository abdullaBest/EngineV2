import * as CHUNK     from '/js/chunk.js'
import * as LAND      from '/js/land.js'
import * as INFO      from '/js/info.mjs'
import * as NET       from '/js/net.js'
import * as ASSETS    from '/js/assets.js'
import * as HEIGHTMAP from '/js/heightmap.js' 
import * as CAMERA    from '/js/camera_orbit.js'
import { sel_dialog } from '/js/editor/textures.js'

let mask_selected_tag    = null
let mask_selected        = 2
let mask_selected_tag2   = null
let mask_selected2       = 2
let tile_selected_tag    = null
let tile_selected        = 0
let tiles                = []       // список текстур для покраски
let hm_mode              = 0

const save_tiles_list = ()=>{
    NET.send_json([
        INFO.MSG_EDITOR_PAINT_LIST,
        NET.game_id,
        tiles,
    ])
}

export const prepare_game = (_tiles)=>{
    tiles = _tiles
    fill_tiles()
}

const fill_tiles = ()=>{
    const w = $.LAND.PAINT
    w.tiles.clear()
    for (let i=0;i<tiles.length;i++){
        let n = tiles[i]
        $.TPL.tile_preview.i = i
        $.TPL.tile_preview.n = n
        const b = w.tiles.set(n,$.TPL.tile_preview)
        b.onclick = tile_sel
        if (i===tile_selected){
            tile_selected_tag = b
            b.classList.add('sel')
        }
    }
}

const mask_sel = (e)=>{
    if (mask_selected_tag!==null){
        mask_selected_tag.classList.remove('sel')
    }
    mask_selected_tag = e.target
    mask_selected_tag.classList.add('sel')
    mask_selected = parseInt(e.target.dataset.n)
}

const tile_sel = (e)=>{
    if (tile_selected_tag!==null){
        tile_selected_tag.classList.remove('sel')
    }
    tile_selected_tag = e.target
    tile_selected_tag.classList.add('sel')
    tile_selected = parseInt(e.target.dataset.n)
}

const paint_prepare = ()=>{
    const w = $.LAND.PAINT
    w.masks.clear()
    //
    const c = ASSETS.getMasksCount()
    for (let i=0;i<c;i++){
        $.TPL.mask_preview.n = i
        const b = w.masks.set(i,$.TPL.mask_preview)
        b.onclick = mask_sel
        if (i===mask_selected){
            mask_selected_tag = b
            b.classList.add('sel')
        }
    }

    w.conf.btn_rep.el.onclick = ()=> sel_dialog(1)
    w.conf.btn_add.el.onclick = ()=> sel_dialog(2)
    w.conf.btn_del.el.onclick = ()=> land_texture_sel(3,0)

    w.conf.btn_save.el.onclick = ()=>{
        const grid = LAND.getGrid()
        const width = LAND.getWidth()
        NET.send_json([INFO.MSG_EDITOR_SAVE_LAYER,NET.game_id,width,width])
        NET.send(grid)
    }
}

const heightmap_mask_sel = (e)=>{
    if (mask_selected_tag2!==null){
        mask_selected_tag2.classList.remove('sel')
    }
    mask_selected_tag2 = e.target
    mask_selected_tag2.classList.add('sel')
    mask_selected2 = parseInt(e.target.dataset.n)
}

const heightmap_prepare = ()=>{
    const w = $.LAND.HM
    w.masks.clear()
    //
    const c = ASSETS.getMasksCount()
    for (let i=1;i<c;i++){
        $.TPL.mask_preview.n = i
        const b = w.masks.set(i,$.TPL.mask_preview)
        b.onclick = heightmap_mask_sel
        if (i===mask_selected2){
            mask_selected_tag2 = b
            b.classList.add('sel')
        }
    }

    w.conf.add.el.onclick   = ()=> hm_mode = 0
    w.conf.sub.el.onclick   = ()=> hm_mode = 1
    w.conf.solid.el.onclick = ()=> hm_mode = 2
    w.conf.blur.el.onclick  = ()=> hm_mode = 3

    w.conf.btn_save.el.onclick = ()=>{
        const grid = HEIGHTMAP.getGrid()
        const width = HEIGHTMAP.getWidth()
        NET.send_json([INFO.MSG_EDITOR_SAVE_HM,NET.game_id,width,width])
        NET.send(grid)
    }
}

const conf_prepare = ()=>{
    const w = $.LAND.CONF

    const updateConf = ()=>{
        let t0_scale = parseFloat(w.layers.texture0scale_input.el.value)
        let t_scale  = parseFloat(w.layers.texturescale_input.el.value)
        let size = parseInt(w.layers.size.el.value)
        LAND.setConf(t0_scale,t_scale,size)
    }

    const updateHM = ()=>{
        let maxHeight = parseFloat(w.hm.maxheight_input.el.value)
        let grid_cx = parseFloat(w.hm.gridcx_input.el.value)
        if (maxHeight!==HEIGHTMAP.getMaxHeight()){
            HEIGHTMAP.change_max_height(maxHeight)
        }
        if (grid_cx!==HEIGHTMAP.get_grid_cx()){
            HEIGHTMAP.change_grid_cx(grid_cx)
            LAND.updateGroundMeshGeometry()
        }
    }

    const siblingValueUpdate = (e)=>{
        let inp = e.target
        if (e.target.type==='range'){
		    e.target.nextElementSibling.value = e.target.value
            inp = e.target.nextElementSibling
        }else{
    		e.target.previousElementSibling.value = e.target.value
        }

        if (inp===w.layers.normalf_input.el){
            let normalf = parseFloat(w.layers.normalf_input.el.value)
            LAND.setNormalF(normalf)
            return
        }

        if (inp===w.layers.rwidth_input.el){
            let rwidth = parseFloat(w.layers.rwidth_input.el.value)
            CHUNK.setTileWidth(rwidth)
            LAND.updateGroundMeshGeometry()
            CAMERA.orbit_set_zone(
                -CHUNK.half_max_width,
                -CHUNK.half_max_width,
                 CHUNK.half_max_width,
                 CHUNK.half_max_width
            )
            return
        }

        if (inp===w.hm.maxheight_input.el || inp===w.hm.gridcx_input.el){
            updateHM()
            return
        }

        updateConf()
	}

    w.layers.texture0scale_range.el.oninput = siblingValueUpdate 
	w.layers.texture0scale_input.el.oninput = siblingValueUpdate
    w.layers.texturescale_range.el.oninput  = siblingValueUpdate 
	w.layers.texturescale_input.el.oninput  = siblingValueUpdate
    w.layers.normalf_range.el.oninput  = siblingValueUpdate 
	w.layers.normalf_input.el.oninput  = siblingValueUpdate
    w.layers.rwidth_range.el.oninput  = siblingValueUpdate 
	w.layers.rwidth_input.el.oninput  = siblingValueUpdate
    w.layers.size.el.oninput = updateConf
    w.layers.restore.el.onclick = ()=>{
        LAND.load(NET.game_id)
    }


    w.hm.maxheight_range.el.oninput = siblingValueUpdate
	w.hm.maxheight_input.el.oninput = siblingValueUpdate
    w.hm.gridcx_range.el.oninput    = siblingValueUpdate
	w.hm.gridcx_input.el.oninput    = siblingValueUpdate

    w.hm.restore.el.onclick = ()=>{
        HEIGHTMAP.load(NET.game_id)
    }
}

export const land_texture_sel = (mode,n)=>{
    if (mode===1){  // заменяем
        tiles[tile_selected] = n
    }
    if (mode===2){  // добавляем
        tiles.push(n)
    }
    if (mode===3){  // удаляем последний в списке
        if (tiles.length>1){
            tiles.length = tiles.length-1
        }
    }
    LAND.prepare_tiles(tiles)
    fill_tiles()
    save_tiles_list()
    
}


export const set_mouse_position = (rx,rz)=>{

    let mode = $.LAND.dialog_active_tab
    if (mode===0){
        const size = parseFloat($.LAND.PAINT.conf.size.el.value)
        LAND.set_mask_position(rx,rz,size)
    }

    if (mode===1){
        const size = parseFloat($.LAND.HM.conf.size.el.value)
        LAND.set_mask_position(rx,rz,size)
    }
    
    /*
    if (point_mode===3){
        let size = 0
        LAND.set_mask_position(rx,rz,size)
        HEXGRID.editor_set_selector_position(rx,rz)
    }
    */
}

export const set_point = (x,y)=>{

    let mode = $.LAND.dialog_active_tab
    // покраска
    if (mode===0){
        const size = parseFloat($.LAND.PAINT.conf.size.el.value)
        LAND.set_point(x,y, mask_selected, tile_selected, size)
    }

    // карта высот
    if (mode===1){
        const size = parseFloat($.LAND.HM.conf.size.el.value)
        const power = parseFloat($.LAND.HM.conf.power.el.value)
        HEIGHTMAP.set_heightmap(x,y,hm_mode,mask_selected2,size,power)
    }

    // гексы
    //if (point_mode===3){
    //   HEXGRID.editor_select(x,y)
    //}
}

export const prepare = ()=>{
    //
    paint_prepare()

    heightmap_prepare()

    conf_prepare()

    //
    /*

    /*
    let light_cx = 0
    let light_cy = 0
    let light_pixels = null
    const calc_light = ()=>{
        console.log(light_cx,light_cy)

        LAND.ground_photon(light_cx,light_cy,light_pixels)

        light_cx = light_cx + 1
        if (light_cx===64){
            light_cx = 0
            light_cy = light_cy + 1
            if (light_cy===64){
                const width  = 4096
                const height = 4096
                // 
                NET.send_json([INFO.MSG_EDITOR_SAVE_TMAP,NET.game_id,width,width])
                NET.send(light_pixels)
                //
                const layer_grid  = LAND.get_layer_grid()
                const layer_width = LAND.get_layer_size()
                NET.send_json([INFO.MSG_EDITOR_SAVE_LAYER,NET.game_id,layer_width,layer_width])
                NET.send(layer_grid)
            }else{
                setTimeout(calc_light,0)
            }
        }else{
            setTimeout(calc_light,0)
        }
    } 

    $.PAINT.conf.btn_save.el.onclick = ()=>{
        const pixels = LAND.draw_minimap()
        const width  = 4096
        const height = 4096

        light_pixels = pixels
        light_cx = 0
        light_cy = 0
        setTimeout(calc_light,0)
    }
    */
}
