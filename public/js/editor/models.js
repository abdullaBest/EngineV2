/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as INFO    from '/js/info.mjs'
import * as NET     from '/js/net.js'
import * as RENDER  from '/js/render.js'
import { show, hide, isVisible } from '/js/strapony.js'
import { sel_dialog } from '/js/editor/textures.js'
import { get_model, prepare_material } from '/js/assets.js'
import { GLTFExporter } from '/lib/GLTFExporter.js'

let models = []
let curr_gltf = null    // gltf
let curr_obj  = null    // модель
let sell_obj  = null    // объект в моделе
let materials = {}

let models_group_selected = 'root'
let model_selected_tag = null
let model_selected_n   = 0
let model_updated      = 0
let model_gltf_changed = false

const model_update_material = ()=>{
    if (sell_obj===null){
        return
    }
    const w = $.MODEL_EDIT    

    let m = materials[sell_obj.name]
    if (m===undefined){
        m = Object.seal({
            type        : w.material.material.el.value,
            defuse      : parseInt(w.material.defuse.el.dataset.n),
            normals     : parseInt(w.material.normals.el.dataset.n),
            arm         : parseInt(w.material.arm.el.dataset.n),
            metalness   : parseFloat(w.material.metalness.el.value),
            roughness   : parseFloat(w.material.roughness.el.value),
            transparent : w.material.transparent.el.checked,
            dside       : w.material.dside.el.checked,
            alphatest   : parseFloat(w.material.alphatest.el.value),
            env         : w.material.env.el.value
        })
        materials[sell_obj.name] = m
    }else{
        m.type        = w.material.material.el.value
        m.defuse      = parseInt(w.material.defuse.el.dataset.n),
        m.normals     = parseInt(w.material.normals.el.dataset.n),
        m.arm         = parseInt(w.material.arm.el.dataset.n),
        m.metalness   = parseFloat(w.material.metalness.el.value)
        m.roughness   = parseFloat(w.material.roughness.el.value)
        m.transparent = w.material.transparent.el.checked
        m.dside       = w.material.dside.el.checked
        m.alphatest   = parseFloat(w.material.alphatest.el.value)
        m.env         = w.material.env.el.value
    }
}

const material_set_param = ()=>{
    if (!sell_obj && !sell_obj.material){
        return
    }
    model_update_material()
    prepare_material(materials,sell_obj)
}

const models_prepare = ()=>{
    const w = $.MODEL_EDIT    
    
    w.file.el.onchange = (e)=>{
        let file = w.file.el.files[0]
        if (!file){
            return
        }
        let name = file.name
        let a = name.split('.')
        let ext = a.splice(a.length-1,1)[0]
        ext = ext.toLowerCase()
        name = a.join('.').replaceAll(' ','').toLowerCase()
        if (['fbx','gltf','glb'].indexOf(ext)===-1){
            alert('file format not recognized')
            return
        }

        curr_gltf = null
        curr_obj = null

        const reader = new FileReader()
        reader.onload = ()=>{
            if (ext==='fbx'){
                // отправляем на конвертацию
                show($.WAIT)
                NET.send_json([
                    INFO.MSG_EDITOR_FBX_CONV
                ])
                NET.send(reader.result)
            }
            if (ext==='gltf' || ext==='glb'){
                RENDER.gltfloader.parse(reader.result,'',(data)=>{
                    model_gltf_changed = true
                    curr_gltf = data
                    curr_obj = data.scene
                    RENDER.update_matrix(curr_obj)
                    model_show_scene()
                },(err)=>{
                    alert(err)
                })
            }

            w.name.el.value = name
            w.vis.scale.el.value = 1
            w.vis.scale.el.onchange()
            
        }
        reader.readAsArrayBuffer(file)

    }

    w.material.apply.el.onclick = ()=>{
        if (isVisible($.WAIT)){
            return
        }

        let screen = RENDER.make_screen_shoot(128,128)
        
        const n     = Math.trunc(w.n.el.value)
        const group = w.group.el.value
        const name  = w.name.el.value

        const model = Object.seal({
            n,
            group,
            name,
            m: materials,
            g: null,
        })

        NET.send_json([INFO.MSG_EDITOR_MODEL, model ])

        NET.send(screen)

        if (model_gltf_changed){
            show($.WAIT)
    
            model_gltf_changed = false

            RENDER.traverse(curr_gltf.scene,(m)=>{
                if (m.material){
                    m.material = RENDER.simpleMaterial
                }
            })
    
            const exporter = new GLTFExporter()
		    exporter.parse(RENDER.group_to_scene(curr_gltf.scene), 
            (gltf)=>{ 
                NET.send(gltf)
            }, 
		    (error)=>{ 
                console.log(error) 
            },
		    {
			    binary 		 : true,
			    embedImages  : false,
			    forceIndices : false,
			    onlyVisible  : false,	
		    })
        }else{
            set_model(model)
        }
    }

    w.scene.onselect = model_object_select

    w.vis.scale.el.onchange = ()=>{
        const v = parseFloat(w.vis.scale.el.value)
        if (curr_obj===null || isNaN(v) || v===0){
            return
        }
        curr_obj.scale.set(v,v,v)
        RENDER.update_matrix(curr_obj)
    }

    w.material.clear.el.onclick = ()=>{
        w.material.defuse.el.dataset.n  = 0
        w.material.normals.el.dataset.n = 0
        w.material.arm.el.dataset.n     = 0
        w.material.defuse.el.src  = '/t/preview/0.png'
        w.material.normals.el.src = '/t/preview/0.png'
        w.material.arm.el.src     = '/t/preview/0.png'

        material_set_param()
    }

    w.tabs.t_material.el.onclick = ()=>{
        show(w.material)
        hide(w.transform)
        hide(w.animations)
    }
    w.tabs.t_transform.el.onclick = ()=>{
        hide(w.material)
        show(w.transform)
        hide(w.animations)
    }
    w.tabs.t_animations.el.onclick = ()=>{
        hide(w.material)
        hide(w.transform)
        show(w.animations)
    }
    //
    w.material.defuse.el.onclick  = ()=> sel_dialog(3)
    w.material.normals.el.onclick = ()=> sel_dialog(4)
    w.material.arm.el.onclick     = ()=> sel_dialog(5)
    //
    w.material.material.el.onchange    = material_set_param
    w.material.metalness.el.onchange   = material_set_param
    w.material.roughness.el.onchange   = material_set_param
    w.material.transparent.el.onchange = material_set_param
    w.material.dside.el.onchange       = material_set_param
    w.material.alphatest.el.onchange   = material_set_param
    w.material.env.el.onchange         = material_set_param
}

export const textures_sel = (mode,n)=>{
    const w = $.MODEL_EDIT
    let a = null 
    if (mode===3){ a = w.material.defuse.el }
    if (mode===4){ a = w.material.normals.el }
    if (mode===5){ a = w.material.arm.el }
    
    a.dataset.n = n
    a.src  = '/t/preview/'+n+'.png'
    
    material_set_param()
}

const _base64ToArrayBuffer = (base64)=> {
    let binary_string = window.atob(base64)
    let len = binary_string.length
    let bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
}

export const fbx_converted = (s)=>{
    hide($.WAIT)
    let b = _base64ToArrayBuffer(s)
    let loader = RENDER.gltfloader
    loader.parse(b,'',(data)=>{
        model_gltf_changed = true
        curr_gltf = data
        curr_obj = data.scene
        RENDER.update_matrix(curr_obj)
        model_show_scene()
    },(err)=>{
        alert(err)
    })
}

const models_fill = ()=>{
    const groups = new Set()
    for (let i=0;i<models.length;i++){
        const a = models[i]
        if (a.group!=='root'){
            groups.add(a.group)
        }
    }

    let w = $.ASSETS.MODELS
    w.groups.clear()
    w.groups.add(null,'root','root')
    $.models_group_names.el.innerHTML = ''
    for (let name of groups.values()){
        w.groups.add(null,name,name)
        //
        let a = document.createElement('option')
        a.value = name
        a.innerText = name
        $.models_group_names.el.appendChild(a)
    }

    w.groups.onselect = model_group_sel
    w.groups.select(models_group_selected)

}

const model_sel = (e)=>{
    if (model_selected_tag!==null){
        model_selected_tag.classList.remove('sel')
    }
    model_selected_tag = e.currentTarget
    model_selected_tag.classList.add('sel')
    model_selected_n = e.currentTarget.dataset.n
    
}

const model_group_sel = (group)=>{
    models_group_selected = group
    let w = $.ASSETS.MODELS
    w.list.clear()
    for (let i=0;i<models.length;i++){
        const a = models[i]
        if (a.group===group){
            $.TPL.model_preview.n = a.n
            $.TPL.model_preview.t = a.name
            if (a.n===model_updated){
                $.TPL.model_preview.a = '?'+Date.now()
            }else{
                $.TPL.model_preview.a = ''
            }
            const b = w.list.set(a.name,$.TPL.model_preview)
            if (a.name===model_selected_n){
                model_selected_tag = b
                b.classList.add('sel')
            }
            b.onclick = model_sel
        }
    }
}


const model_object_select = (name)=>{
    if (!curr_obj===null){
        return
    }
    sell_obj = null
    RENDER.traverse(curr_obj,el=>{
        if (el.name===name){
            sell_obj = el
        }
    })
    if (sell_obj===null){
        return
    }
    $.MODEL_EDIT.model_selected_obj = name
    //
    let m = materials[name]
    const w = $.MODEL_EDIT.material
    if (m===undefined){
        w.el.value               = 'MeshStandardMaterial'
        w.defuse.el.dataset.n    = 0
        w.normals.el.dataset.n   = 0
        w.arm.el.dataset.n       = 0
        w.defuse.el.src          = '/t/preview/0.png'
        w.normals.el.src         = '/t/preview/0.png'
        w.arm.el.src             = '/t/preview/0.png'
        w.metalness.el.value     = 0
        w.roughness.el.value     = 0
        w.transparent.el.checked = false
        w.dside.el.checked       = false
        w.alphatest.el.value     = 0
        w.env.el.value           = ''
    }else{
        w.material.el.value      = m.type
        w.defuse.el.dataset.n    = m.defuse
        w.normals.el.dataset.n   = m.normals
        w.arm.el.dataset.n       = m.arm
        w.defuse.el.src          = '/t/preview/'+m.defuse+'.png'
        w.normals.el.src         = '/t/preview/'+m.normals+'.png'
        w.arm.el.src             = '/t/preview/'+m.arm+'.png'
        w.metalness.el.value     = m.metalness
        w.roughness.el.value     = m.roughness
        w.transparent.el.checked = m.transparent
        w.dside.el.checked       = m.dside
        w.alphatest.el.value     = m.alphatest
        w.env.el.value           = m.env
    }
}

const model_show_scene = ()=>{
    $.MODEL_EDIT.scene.clear()
    //let materials = models[curr_obj.name].materials
    let sel = null
    curr_obj.traverse(el=>{
        if (el.type==='Scene'){
            return
        }

        //ASSET.apply_materials(el,materials)

        let name = el.name
        let parent_name = null
        if (el.parent && el.parent.type!=='Scene'){
            parent_name = el.parent.name 
        }

        let count = 0
        let color = 'gray'
        switch(el.type){
            case 'SkinnedMesh':
            case 'Mesh':
                color = 'white'
                if (el.geometry.index){
                    count = el.geometry.index.count/3
                }
                sel = el
            break;
        }
        let vis = ''
        if (!el.visible){
            vis = 'x'
        }
        $.MODEL_EDIT.scene.add(parent_name,name,name+'|'+el.type+'|'+count+'|'+vis,color)

    })
    if (sel!==null){
        $.MODEL_EDIT.scene.select(sel.name)
    }
    // подготавливаем список анимаций
    const l = $.MODEL_EDIT.animations.list.el
    l.innerHTML = ''
    let d
    /*
            if (mem_animation!==null){
                d = document.createElement('option')
                d.innerText = mem_animation.name
                l.appendChild(d)
            }
    */
    //
    for (let i=0;i<curr_gltf.animations.length;i++){
        d = document.createElement('option')
        d.innerText = curr_gltf.animations[i].name
        l.appendChild(d)
    }
}

export const render = ()=>{
    if (curr_obj!==null){
        RENDER.render_mesh(curr_obj)
    }
}

export const set_model = (m)=>{
    models[m.n] = m
    hide($.WAIT)
    models_fill()
}

export const prepare = (_models)=>{
    models = _models

    $.ASSETS.model_add.el.onclick = ()=>{
        $.MODEL_EDIT.n.el.value = models.length
        show($.MODEL_EDIT)
        $.MODEL_EDIT.file.el.click()
    }

    $.ASSETS.model_edt.el.onclick = ()=>{
        $.MODEL_EDIT.model_selected_n = model_selected_n
        get_model(model_selected_n, m=>{
            materials = m.m
            $.MODEL_EDIT.n.el.value = m.n
            $.MODEL_EDIT.group.el.value = m.group
            $.MODEL_EDIT.name.el.value = m.name
            
            model_gltf_changed = false
            curr_gltf = m.g
            curr_obj = m.g.scene
            RENDER.update_matrix(curr_obj)
            model_show_scene()
        })

        show($.MODEL_EDIT)
    }


    models_prepare()
    models_fill()
}