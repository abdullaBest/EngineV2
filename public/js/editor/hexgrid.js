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
import * as HEXGRID   from '/js/hexgrid.js'

let selected_position = [0,0]

export const setParam = ()=>{
    const w = $.HEXGRID
    w.conf.scale_range.el.value     = HEXGRID.getScale()
    w.conf.scale_input.el.value     = HEXGRID.getScale()
    w.conf.intensity_range.el.value = HEXGRID.get_grid_f()
    w.conf.intensity_input.el.value = HEXGRID.get_grid_f()
    w.conf.color.el.value           = '#'+HEXGRID.get_grid_color().getHexString()

    w.conf.linew_range.el.value    = HEXGRID.get_grid_t_lwidth()
    w.conf.linew_input.el.value    = HEXGRID.get_grid_t_lwidth()
    w.conf.hexscale_range.el.value = HEXGRID.get_grid_t_scale()
    w.conf.hexscale_input.el.value = HEXGRID.get_grid_t_scale()
    w.conf.blur_range.el.value     = HEXGRID.get_grid_t_blur()
    w.conf.blur_input.el.value     = HEXGRID.get_grid_t_blur()
    w.conf.twidth.el.value         = HEXGRID.get_grid_t_width()

    updateInfo()

    select()
}

const updateInfo = ()=>{
    const w = $.HEXGRID
    let width  = HEXGRID.getWidth()
    let height = HEXGRID.getHeight()
    let s = 'size: <span>'+width+'</span>'
    s = s + ' x '
    s = s + '<span>'+height +'</span>'

    const map_width = LAND.getMapWidth()
    //const scale = HEXGRID.getScale()
    HEXGRID.set_cursor_postion(map_width,map_width)

    width = Math.trunc(HEXGRID.cursor[0])
    height = Math.trunc(HEXGRID.cursor[1])
    s = s + '<br>'
    s = s + 'new size: <span>'+width+'</span>'
    s = s + ' x '
    s = s + '<span>'+height+'</span>'

    let m = HEXGRID.get_grid_t_width()
    s = s + '<br>'
    s = s + 'texture size: <span>' + UTILS.bytesToSize(m*m)+'</span>'

    w.conf.info.el.innerHTML = s
}

const prepareConf = ()=>{
    const w = $.HEXGRID

    const updateValue = ()=>{
        const scale = parseFloat(w.conf.scale_input.el.value)
        HEXGRID.setScale(scale)
        const color = w.conf.color.el.value
        HEXGRID.set_grid_color(color)
        const intensity = parseFloat(w.conf.intensity_input.el.value)
        HEXGRID.set_grid_f(intensity)

        HEXGRID.update_selector()
        
        updateInfo()
    }

    const updateTexture = ()=>{
        const linew    = parseFloat(w.conf.linew_input.el.value)
        const hexscale = parseFloat(w.conf.hexscale_input.el.value)
        const twidth   = parseInt(w.conf.twidth.el.value)
        const blur     = parseFloat(w.conf.blur_input.el.value)
        HEXGRID.set_grid_param(twidth,linew,hexscale,blur)
        updateInfo()
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
            case w.conf.color.el:
            case w.conf.scale_input.el:
            case w.conf.intensity_input.el:
                                                updateValue()
                                                break;
            case w.conf.linew_input.el:
            case w.conf.hexscale_input.el:
            case w.conf.blur_input.el:
                                                updateTexture()
                                                break;
        }

/*    
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
*/       
    }

    w.conf.scale_range.el.oninput     = siblingValueUpdate
    w.conf.scale_input.el.oninput     = siblingValueUpdate
    w.conf.intensity_range.el.oninput = siblingValueUpdate
    w.conf.intensity_input.el.oninput = siblingValueUpdate
    w.conf.color.el.oninput           = updateValue

    w.conf.linew_range.el.oninput    = siblingValueUpdate
    w.conf.linew_input.el.oninput    = siblingValueUpdate
    w.conf.hexscale_range.el.oninput = siblingValueUpdate
    w.conf.hexscale_input.el.oninput = siblingValueUpdate
    w.conf.blur_range.el.oninput     = siblingValueUpdate
    w.conf.blur_input.el.oninput     = siblingValueUpdate
    w.conf.twidth.el.oninput         = updateTexture

    w.conf.create.el.onclick = ()=>{
        const map_width = LAND.getMapWidth()
        const scale = HEXGRID.getScale()
        HEXGRID.set_cursor_postion(map_width,map_width)

        let width = Math.trunc(HEXGRID.cursor[0])
        let height = Math.trunc(HEXGRID.cursor[1])
        HEXGRID.create(width,height)
    }

    w.conf.save.el.onclick = ()=>{
        let _color = HEXGRID.get_grid_color()
        let color = [Math.trunc(255*_color.r),Math.trunc(255*_color.g),Math.trunc(255*_color.b)]
        // сохраняем настройки
        const param = {
            width              : HEXGRID.getWidth(),
            height             : HEXGRID.getHeight(),
            scale              : HEXGRID.getScale(),
            texture_size       : HEXGRID.get_grid_t_width(),
            texture_blur       : HEXGRID.get_grid_t_blur(),
            texture_line_width : HEXGRID.get_grid_t_lwidth(), 
            texture_hex_scale  : HEXGRID.get_grid_t_scale(),
            texture_grid_f     : HEXGRID.get_grid_f(),
            texture_grid_color : color
        }

        NET.send_json([
            INFO.MSG_EDITOR_HEX_PARAM,
            NET.game_id,
            param,
        ])

        NET.send_json([
            INFO.MSG_EDITOR_HEX_GRID,
            NET.game_id,
            HEXGRID.getGrid(),
        ])
    }
}

export const set_position = (mouse)=>{
    let x = mouse.x + LAND.half_map_width
    let y = mouse.z + LAND.half_map_width
    HEXGRID.set_cursor_postion(x,y)

    x = HEXGRID.cursor[0]
    y = HEXGRID.cursor[1]

    let s = 'hex: <span>'+x+'</span> x <span>'+y+'</span>'
    s = s+'<br>'
    s = s + 'sel: <span>'+selected_position[0]+'</span> x <span>'+selected_position[1]+'</span>'
    $.HEXGRID.edit.info.el.innerHTML = s
    
}

const update_list = ()=>{
    const cell = HEXGRID.get(selected_position[0],selected_position[1])

    $.HEXGRID.edit.list.el.innerHTML = ''
    for (let i=0;i<cell.length;i++){
        const o = cell[i]
        let opt = document.createElement('option')
        opt.value = i
        opt.innerText = o.name
        $.HEXGRID.edit.list.el.appendChild(opt)
    }

    if (cell.length!==0){
        $.HEXGRID.edit.list.el.value = cell.length-1
    }

    update_table()
}

const update_table = ()=>{
    $.HEXGRID.edit.props.table.el.innerHTML =''
    if ($.HEXGRID.edit.list.el.value==='' ){
        return
    }
    let selected_n = parseInt($.HEXGRID.edit.list.el.value)

    const cell = HEXGRID.get(selected_position[0],selected_position[1])
    const o = cell[selected_n]
    for (let name in o.prop){
        if (name==='name'){
            continue
        }
        let value = o.prop[name]
        let row = document.createElement('tr')
        let td1 = document.createElement('td')
        let td2 = document.createElement('td')
        let inp = document.createElement('input')
        td1.innerText = name
        inp.dataset.name = name
        inp.type = 'number'
        inp.value = value
        td2.appendChild(inp)
        row.appendChild(td1)
        row.appendChild(td2)
        $.HEXGRID.edit.props.table.el.appendChild(row)
    }    
}

export const select = ()=>{
    let x = HEXGRID.cursor[0]
    let y = HEXGRID.cursor[1]

    selected_position[0] = x
    selected_position[1] = y

    let rx = HEXGRID.get_rx(x,y)
    let rz = HEXGRID.get_ry(y)

    HEXGRID.selector.position.x = rx - LAND.half_map_width
    HEXGRID.selector.position.z = rz - LAND.half_map_width
    HEXGRID.selector.position.y = LAND.heightmap_height(HEXGRID.selector.position.x,HEXGRID.selector.position.z)+0.1

    update_list()
}


export const prepare = ()=>{
    prepareConf()
}