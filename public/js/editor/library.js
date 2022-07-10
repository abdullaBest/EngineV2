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

import {show, hide, isVisible} from '/js/strapony.js'
import { hexgrid_lib_sel } from '/js/editor/hexgrid.js'

const group_color = '#afafaf'
const name_color  = '#ffffff'
let mode = 0

const save_library = ()=>{
    const data = LIBRARY.export_library()
    NET.send_json([
        INFO.MSG_EDITOR_LIBRARY,
        NET.game_id,
        data,
    ])
}

const get_info_data = ()=>{
    const w = $.ASSETS.LIBRARY
    const name  = w.edit.name.el.value.replaceAll(':','')
    const group = w.edit.group.el.value.replaceAll(':','')

    if (group.length === 0 || name.length === 0) {
        alert(name + ' error')
        return
    }

    let prop  = null
    let info  = null
    let asset = null

    try {
        eval('prop=' + w.edit.prop.el.value)
    } catch (e) {
        alert('prop error')
        return
    }

    try {
        eval('info =' + w.edit.info.el.value)
    } catch (e) {
        alert('info error')
        return
    }

    try {
        eval('asset=' + w.edit.asset.el.value)
    } catch (e) {
        alert('asset error')
        return
    }

    info.name  = name
    info.group = group
    info.prop  = prop
    info.asset = asset

    return info
}

// добавляет строчку с записями с текстовое поле
export const add_mesh_to_asset = (model,mesh)=>{
    const a = $.LIBRARY.asset.el
    const s = a.selectionStart, 
          e = a.selectionEnd
    a.value = a.value.substring(0, s)
            + '{model:"'+model+'", mesh:"'+mesh+'"}'
            + a.value.substring(e, a.value.length)
}

export const sel_dialog = (_mode)=>{
    mode = _mode
    show($.ASSETS)
    $.ASSETS.tab_btn1.el.click()
}

export const prepare = (lib)=>{
    const w = $.ASSETS.LIBRARY
    const list = w.list

    const groups = new Set()

    list.clear()
    for (let name in lib){
        const o = lib[name]
        groups.add(o.group)

        list.add_or_update('', o.group, o.group, group_color)
        list.insert(o.group, o.group+':'+o.name, o.name, name_color)
    }

    //
    $.library_group_names.el.innerHTML =''
    for (let name of groups){
        const o = document.createElement('option')
        o.value = name  
        $.library_group_names.el.appendChild(o)
    }

    w.edit.prop.el.value = '{}'
    w.edit.info.el.value = '{}'
    w.edit.asset.el.value = '[]'

    w.edit.add.el.onclick = ()=>{
        const info = get_info_data()
        if (LIBRARY.get(info.name) !== undefined){
            alert(info.name+' alredy exists')
        }

        LIBRARY.add(info.name,info)

        save_library()

        list.add_or_update('', info.group, info.group, group_color)
        list.insert(info.group, info.group+':'+info.name, info.name, name_color)

        list.show_group(info.group)
        list.select(info.group+':'+info.name)
    }
    w.edit.change.el.onclick = ()=>{
        const info = get_info_data()

        const oldname  = w.edit.oldname.el.value
        const oldgroup = w.edit.oldgroup.el.value
        if (oldname!==info.name || oldgroup!==info.group){
            LIBRARY.remove(oldname)
            list.delete(oldgroup+':'+oldname)
        }

        LIBRARY.add(info.name,info)

        save_library()

        list.add_or_update('', info.group, info.group, group_color)
        list.insert_or_update(info.group, info.group+':'+info.name, info.name, name_color)

        list.show_group(info.group)
        list.select(info.group+':'+info.name)
    }
    w.edit.delete.el.onclick = ()=>{
        const oldgroup = w.edit.oldgroup.el.value
        const oldname  = w.edit.oldname.el.value
        LIBRARY.remove(oldname)
        save_library()
        list.delete(oldgroup+':'+oldname)
    }

    list.onselect = (id)=>{
        const l = parseInt(list.get_selected_level())
        if (l===0){
            list.switch_visibility_group(id)
            return
        }

        id = id.split(':')[1]
        const o = LIBRARY.get(id)

        w.edit.oldgroup.el.value = o.group
        w.edit.oldname.el.value  = o.name        
        w.edit.group.el.value    = o.group
        w.edit.name.el.value     = o.name

        w.edit.prop.el.value  = JSON.stringify(o.prop, undefined, 2)
        w.edit.info.el.value  = JSON.stringify(LIBRARY.get_info_block(o), undefined, 2)
        w.edit.asset.el.value = JSON.stringify(o.asset, undefined, 2)
    }

    w.edit.from_model.el.onclick = ()=>{
        const n = parseInt($.MODEL_EDIT.model_selected_n)
        const a = w.edit.asset.el
        const obj = $.MODEL_EDIT.model_selected_obj
        const s = a.selectionStart, 
              e = a.selectionEnd
        a.value = a.value.substring(0, s)
                    + '{model:"'+n+'", mesh:"'+obj+'"}'
                    + a.value.substring(e, a.value.length)
    }

    $.ASSETS.lib_sel.el.onclick = ()=>{     
        const group = w.edit.oldgroup.el.value
        const name  = w.edit.oldname.el.value
        const l = parseInt(list.get_selected_level())
  
        hexgrid_lib_sel(mode,l,group,name)

        if (mode!==1){
            hide($.ASSETS)
        }
    }
}