/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as INFO    from '/js/info.mjs'
import * as NET     from '/js/net.js'
import * as RENDER  from '/js/render.js'
import * as ASSETS  from '/js/assets.js'
import {show, hide, isVisible} from '/js/strapony.js'
import { textures_sel } from '/js/editor/models.js'
import { land_texture_sel } from '/js/editor/land.js'


let textures = []
let group_selected   = 'root'
let txt_selected_tag = null
let txt_selected_n   = 0
let txt_updated      = 0
let mode = 0 // 1,2-land 3,4,5-model edit, 6-env


const txt_load_prepare = ()=>{
    const w = $.TXT_LOAD
    w.file.el.onchange = (e)=>{
        let file = w.file.el.files[0]
        let name = file.name
        let a = name.split('.')
        a.splice(a.length-1,1)
        name = a.join('.').toLowerCase()

        w.file_name.el.innerText = file.name

        const reader = new FileReader()
        reader.onload = ()=>{
            w.img.el.src = reader.result
            w.img.el.onload = ()=>{
                w.o_size.el.innerText  = w.img.el.naturalWidth+' x '+w.img.el.naturalHeight
                if (w.name.el.value===''){
                    w.name.el.value = name
                }
                if (w.width.el.value===''){
                    w.width.el.value = w.img.el.naturalWidth
                }
                if (w.height.el.value===''){
                    w.height.el.value = w.img.el.naturalHeight
                }
            }
        }
        reader.readAsDataURL(file)
    }

    w.save.el.onclick=()=>{

        if (isVisible($.WAIT)){
            return
        }
        show($.WAIT)
        
        const file_name = w.file_name.el.innerText
        const width     = Math.trunc(w.width.el.value)
        const height    = Math.trunc(w.height.el.value)
        const group     = w.group.el.value
        const name      = w.name.el.value
        const n         = Math.trunc(w.n.el.value)
        const type      = Math.trunc(w.type.el.value)
        const mapping   = Math.trunc(w.mapping.el.value)
        const alpha     = w.alpha.el.checked
        const mipmap    = w.mipmap.el.checked
        const normalmap = w.normalmap.el.checked

        NET.send_json([
            INFO.MSG_EDITOR_SAVE_TXT,
            {
                n,
                type,
                file_name,
                group,
                name,
                o_width  : w.img.el.naturalWidth,
                o_height : w.img.el.naturalHeight,
                width,
                height,
                alpha,
                mipmap,
                normalmap,
                mapping,
            }
        ])

        const canvas  = document.createElement('canvas')
        canvas.width  = w.img.el.naturalWidth
        canvas.height = w.img.el.naturalHeight
        const ctx     = canvas.getContext('2d')
        ctx.drawImage(w.img.el,0,0,canvas.width,canvas.height)
        
        let d = ctx.getImageData(0, 0, canvas.width,canvas.height)
        NET.send(d.data)

        // resize
        canvas.width  = width
        canvas.height = height
        ctx.drawImage(w.img.el,0,0,width,height)
        
        d = ctx.getImageData(0, 0, width,height)
        NET.send(d.data)

        // resize
        canvas.width  = 128
        canvas.height = 128
        ctx.drawImage(w.img.el,0,0,128,128)
                
        d = ctx.getImageData(0, 0, 128,128)
        NET.send(d.data)
        
        hide($.TXT_LOAD)
    }
    
    $.ASSETS.TEXTURES.groups.onselect = group_sel

    $.ASSETS.txt_add.el.onclick=()=>{
        const w = $.TXT_LOAD
        w.img.el.src = ''
        w.file_name.el.innerText = ''
        w.o_size.el.innerText  = ''
        w.group.el.value  = group_selected
        w.name.el.value   = ''
        w.width.el.value  = ''
        w.height.el.value = ''
        w.n.el.value      = textures.length
        w.type.el.value   = 0
        w.mapping.el.value = 0
        w.alpha.el.checked = false
        w.mipmap.el.checked = true
        w.normalmap.el.checked = false
        show($.TXT_LOAD)
        w.tab_btn1.el.click()
        w.file.el.click()
    }
    $.ASSETS.txt_edt.el.onclick = ()=>{
        txt_edit(txt_selected_n)
    }
    $.ASSETS.txt_sel.el.onclick = ()=>{        
        // defuse, normals, arm, env
        if (mode===3 || mode===4 || mode===5 || mode===6 ){
            textures_sel(mode,txt_selected_n)
        }
        // land
        if (mode===1 || mode===2){
            land_texture_sel(mode,txt_selected_n)
        }
        // env
        if (mode>=7 && mode<=12){
            env_texture(mode,txt_selected_n)
        }
        hide($.ASSETS)
    }
}

const env_prepare = ()=>{
    const w = $.TXT_LOAD
    const c = $.TXT_LOAD.ENV.cube
    c.nx.el.onclick = ()=> sel_dialog(7)
    c.px.el.onclick = ()=> sel_dialog(8)
    c.ny.el.onclick = ()=> sel_dialog(9)
    c.py.el.onclick = ()=> sel_dialog(10)
    c.nz.el.onclick = ()=> sel_dialog(11)
    c.pz.el.onclick = ()=> sel_dialog(12)

    w.ENV.generate.el.onclick = ()=>{
        RENDER.generate_env_from_cube([
            c.px.el.dataset.n+'.png',
            c.nx.el.dataset.n+'.png',
            c.py.el.dataset.n+'.png',
            c.ny.el.dataset.n+'.png',
            c.pz.el.dataset.n+'.png',
            c.nz.el.dataset.n+'.png'
        ],(canvas)=>{
            w.img.el.src = canvas.toDataURL()

            w.img.el.onload = ()=>{
                w.file_name.el.innerText = 'pmremgenerator'
                w.o_size.el.innerText  = w.img.el.naturalWidth+' x '+w.img.el.naturalHeight
                w.width.el.value  = w.img.el.naturalWidth
                w.height.el.value = w.img.el.naturalHeight
                w.mapping.el.value = 1
            }
            //
            w.tab_btn1.el.click()
        })
    }
}

const env_texture = (mode,n)=>{
    const w = $.TXT_LOAD.ENV.cube
    let a = [w.nx,w.px,w.ny,w.py,w.nz,w.pz][mode-7].el

    a.dataset.n = n
    a.src = 't/preview/'+n+'.png?'+Date.now()+'>'
}


const group_sel = (group)=>{
    group_selected = group
    const w = $.ASSETS.TEXTURES
    w.list.clear()
    for (let i=0;i<textures.length;i++){
        const a = textures[i]
        if (a.group===group){
            $.TPL.txt_preview.n = a.n
            $.TPL.txt_preview.t = a.name
            if (a.n===txt_updated){
                $.TPL.txt_preview.a = '?'+Date.now()
            }else{
                $.TPL.txt_preview.a = ''
            }
            const b = w.list.set(a.n,$.TPL.txt_preview)
            if (a.n===txt_selected_n){
                txt_selected_tag = b
                b.classList.add('sel')
            }
            b.onclick = txt_sel
        }
    }
}

const txt_sel = (e)=>{
    if (txt_selected_tag!==null){
        txt_selected_tag.classList.remove('sel')
    }
    txt_selected_tag = e.currentTarget
    txt_selected_tag.classList.add('sel')
    txt_selected_n = parseInt(e.currentTarget.dataset.n)
    $.ASSETS.TEXTURES.txt_selected_n = txt_selected_n
}

const galery_fill = ()=>{
    const groups = new Set()
    for (let i=0;i<textures.length;i++){
        const a = textures[i]
        if (a.group!=='root'){
            groups.add(a.group)
        }
    }

    const w = $.ASSETS.TEXTURES
    w.groups.clear()
    w.groups.add(null,'root','root')
    $.textures_group_names.el.innerHTML = ''
    for (let name of groups.values()){
        w.groups.add(null,name,name)
        //
        let a = document.createElement('option')
        a.value = name
        a.innerText = name
        $.textures_group_names.el.appendChild(a)
    }

    w.groups.select(group_selected)
}


export const set_texture = (m)=>{
    txt_updated = m.d.n
    textures[m.d.n] = m.d
    hide($.WAIT)
    galery_fill()
    txt_updated = 0
}

const txt_edit = (id)=>{
    const w = $.TXT_LOAD
    const a = textures[id]
    w.img.el.src = 't/original/'+a.n+'.png'
    w.img.el.onload = ()=>{
        w.file_name.el.innerText = a.file_name
        w.o_size.el.innerText  = w.img.el.naturalWidth+' x '+w.img.el.naturalHeight
        w.group.el.value  = a.group
        w.name.el.value   = a.name
        w.width.el.value  = a.width
        w.height.el.value = a.height
        w.n.el.value      = a.n
        w.type.el.value   = a.type
        w.mapping.el.value = a.mapping
        w.alpha.el.checked = a.alpha
        w.mipmap.el.checked = a.mipmap
        w.normalmap.el.checked = a.normalmap
    }
    //
    show($.TXT_LOAD)
    w.tab_btn1.el.click()
}

//
export const sel_dialog = (_mode)=>{
    mode = _mode
    show($.ASSETS)
    $.ASSETS.tab_btn2.el.click()
}

export const prepare = (_textures)=>{
    textures = _textures
    txt_load_prepare()
    env_prepare()
    galery_fill()
}