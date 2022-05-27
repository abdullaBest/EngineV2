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

const update_land_info = ()=>{
    const w = $.LAND.CONF

    let s = 'width: <span>' + LAND.getMapWidth() +'</span>, '
    s = s + 'paint: <span>' + LAND.getPaintWidth() + 'px</span>, '
    s = s + 'hm: <span>' + LAND.getHeightmapWidth() + 'px</span>, '
    let m = LAND.getViewGPUUsage()
    s = s + 'view: <span>' + UTILS.bytesToSize(m) + '</span>'

    w.chunks.info.el.innerHTML = s
}

export const prepare_game = (prop)=>{
    tiles = prop.tiles
    fill_tiles()

    const w = $.LAND.CONF
    w.chunks.chunkscount_range.el.value = parseInt(prop.chunks)
    w.chunks.chunkscount_input.el.value = parseInt(prop.chunks)
    w.chunks.chunkwidth_range.el.value  = parseFloat(prop.chunk_width)
    w.chunks.chunkwidth_input.el.value  = parseFloat(prop.chunk_width)
    w.chunks.viewsize_range.el.value    = parseInt(prop.view)
    w.chunks.viewsize_input.el.value    = parseInt(prop.view)

    w.layers.gridcx_range.el.value        = parseInt(prop.layer_cx)
    w.layers.gridcx_input.el.value        = parseInt(prop.layer_cx)
    w.layers.texture0scale_range.el.value = parseFloat(prop.layer_t0_scale)
    w.layers.texture0scale_input.el.value = parseFloat(prop.layer_t0_scale)
    w.layers.texture1scale_range.el.value = parseFloat(prop.layer_t1_scale)
    w.layers.texture1scale_input.el.value = parseFloat(prop.layer_t1_scale)
    w.layers.size.el.value                = parseInt(prop.texture_size)
    w.layers.normalf_range.el.value       = parseFloat(prop.normalf)
    w.layers.normalf_input.el.value       = parseFloat(prop.normalf)

    w.hm.maxheight_range.el.value = parseFloat(prop.hm_max)
    w.hm.maxheight_input.el.value = parseFloat(prop.hm_max)
    w.hm.gridcx_range.el.value    = parseInt(prop.hm_cx)
    w.hm.gridcx_input.el.value    = parseInt(prop.hm_cx)

    update_land_info()
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
        const width = LAND.getPaintWidth()
        NET.send_json([ INFO.MSG_EDITOR_SAVE_LAYER, NET.game_id, width, width ])
        NET.send(LAND.getPaintGrid())
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
        const width = LAND.getHeightmapWidth()
        NET.send_json([ INFO.MSG_EDITOR_SAVE_HM, NET.game_id, width, width ])
        NET.send(LAND.getHeightmapGrid())
    }

    w.tools.loadgray.el.onchange = (e)=>{
        const file = w.tools.loadgray.el.files[0]
        ASSETS.get_texture_from_file(file, t =>LAND.heightmapLoadGray(t) )
    }

}

const conf_prepare = ()=>{
    const w = $.LAND.CONF

    const updateChunks = ()=>{ 
        const chunks = parseInt(w.chunks.chunkscount_input.el.value)
        const view   = parseInt(w.chunks.viewsize_input.el.value)
        const width  = parseFloat(w.chunks.chunkwidth_input.el.value)
        LAND.resize(chunks,view,width)

        CAMERA.orbit_set_zone(
            -LAND.half_map_width,
            -LAND.half_map_width,
             LAND.half_map_width,
             LAND.half_map_width
        )

        update_land_info()
    }

    const updatePaint = ()=>{
        const grid_cx     = parseInt(w.layers.gridcx_input.el.value)
        const t0scale     = parseFloat(w.layers.texture0scale_input.el.value)
        const t1scale     = parseFloat(w.layers.texture1scale_input.el.value)
        const texturesize = parseInt(w.layers.size.el.value)
        LAND.setPaintParams(grid_cx,t0scale,t1scale,texturesize)
        update_land_info()
    }

    const siblingValueUpdate = (e)=>{
        let inp = e.target
        if (e.target.type==='range'){
		    e.target.nextElementSibling.value = e.target.value
            inp = e.target.nextElementSibling
        }else{
    		e.target.previousElementSibling.value = e.target.value
        }

        switch(inp){
            case w.chunks.chunkscount_input.el: 
            case w.chunks.viewsize_input.el:
            case w.chunks.chunkwidth_input.el:
                                                updateChunks()
                                                break;
            case w.layers.gridcx_input.el:
            case w.layers.texture0scale_input.el: 
            case w.layers.texture1scale_input.el:
                                                updatePaint()
                                                break;
            case w.layers.normalf_input.el:
                                                LAND.setNormalF(parseFloat(w.layers.normalf_input.el.value))
                                                break;
            case w.hm.maxheight_input.el:       LAND.setHeightmapHeight(parseFloat(w.hm.maxheight_input.el.value))
                                                break;
            case w.hm.gridcx_input.el:          LAND.setHeightmapCx(parseInt(w.hm.gridcx_input.el.value))
                                                update_land_info()
                                                break;
        }
       
    }

    w.chunks.chunkscount_range.el.oninput = siblingValueUpdate
    w.chunks.chunkscount_input.el.oninput = siblingValueUpdate
    w.chunks.viewsize_range.el.oninput    = siblingValueUpdate
    w.chunks.viewsize_input.el.oninput    = siblingValueUpdate
    w.chunks.chunkwidth_range.el.oninput  = siblingValueUpdate 
	w.chunks.chunkwidth_input.el.oninput  = siblingValueUpdate


    w.layers.gridcx_range.el.oninput        = siblingValueUpdate 
    w.layers.gridcx_input.el.oninput        = siblingValueUpdate 
    w.layers.texture0scale_range.el.oninput = siblingValueUpdate 
	w.layers.texture0scale_input.el.oninput = siblingValueUpdate
    w.layers.texture1scale_range.el.oninput = siblingValueUpdate 
	w.layers.texture1scale_input.el.oninput = siblingValueUpdate
    w.layers.normalf_range.el.oninput       = siblingValueUpdate 
	w.layers.normalf_input.el.oninput       = siblingValueUpdate
    w.layers.size.el.oninput                = updatePaint


    w.hm.maxheight_range.el.oninput = siblingValueUpdate
	w.hm.maxheight_input.el.oninput = siblingValueUpdate
    w.hm.gridcx_range.el.oninput    = siblingValueUpdate
	w.hm.gridcx_input.el.oninput    = siblingValueUpdate

    w.layers.restore.el.onclick = ()=> LAND.paintLoad(NET.game_id)
    w.hm.restore.el.onclick     = ()=> LAND.heightmapLoad(NET.game_id)
    
    w.tools.paint_clear_all.el.onclick = ()=> LAND.paintClearAll()

    w.btns.save.el.onclick = ()=>{
        // сохраняем настройки
        const param = {
            tiles          : tiles,
            chunks         : parseInt(w.chunks.chunkscount_input.el.value),
            chunk_width    : parseFloat(w.chunks.chunkwidth_input.el.value),
            view           : parseInt(w.chunks.viewsize_input.el.value),
            texture_size   : parseInt(w.layers.size.el.value),
            normalf        : parseFloat(w.layers.normalf_input.el.value),
            layer_cx       : parseInt(w.layers.gridcx_input.el.value),
            layer_t0_scale : parseFloat(w.layers.texture0scale_input.el.value),
            layer_t1_scale : parseFloat(w.layers.texture1scale_input.el.value),
            hm_cx          : parseInt(w.hm.gridcx_input.el.value),
            hm_max         : parseFloat(w.hm.maxheight_input.el.value),
            minimap_cx     : 4,
        }

        NET.send_json([
            INFO.MSG_EDITOR_LAND_PARAM,
            NET.game_id,
            param,
        ])

        // сохраняем покраску
        let width = LAND.getPaintWidth()
        NET.send_json([ INFO.MSG_EDITOR_SAVE_LAYER, NET.game_id, width, width ])
        NET.send(LAND.getPaintGrid())
        
        // сохраняем карту высот
        width = LAND.getHeightmapWidth()
        NET.send_json([ INFO.MSG_EDITOR_SAVE_HM, NET.game_id, width, width ])
        NET.send(LAND.getHeightmapGrid())

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
    LAND.preparePaintTiles(tiles)
    fill_tiles()
    save_tiles_list()
    
}


export const set_mouse_position = (mouse)=>{

    let mode = $.LAND.dialog_active_tab
    if (mode===0){
        const size = parseFloat($.LAND.PAINT.conf.size.el.value)
        LAND.set_mask_position(mode,mouse,size)
    }

    if (mode===1){

        $.LAND.HM.conf.info.el.innerText = mouse.x.toFixed(2)+'  '+mouse.y.toFixed(2)+'  '+mouse.z.toFixed(2)

        const size = parseFloat($.LAND.HM.conf.size.el.value)
        LAND.set_mask_position(mode,mouse,size)
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
        LAND.setPaint(x,y, mask_selected, tile_selected, size)
    }

    // карта высот
    if (mode===1){
        const size  = parseFloat($.LAND.HM.conf.size.el.value)
        let power   = parseFloat($.LAND.HM.conf.power.el.value)
        const height = parseFloat($.LAND.HM.conf.height.el.value)
        if (hm_mode===2){
            power = height
        }
        LAND.setHeightmap(x,y,hm_mode,mask_selected2,size,power)
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
