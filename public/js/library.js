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

import {
    Object3D
} from '/lib/three.js'

const library   = new Map()
const library_a = []
const library_n = []

let _lib_data = null

export const get           = (name)=>library.get(name)
export const get_library   = ()=>library

const new_obj = (name,group,asset,prop)=>{
    const o = Object.seal({
        name        : name,
        group       : group,
        asset       : asset,
        //
        prepared    : false,
        mesh        : new Object3D(),
        animations  : {},
        //
        prop        : prop,
        //
        scale       : [1.0,1.0,1.0],
        rot         : [0.0,0.0,0.0],
        pos         : [0.0,0.0,0.0],
        //
        gui         : false,
        uniq        : false,
        squad       : false,
        //
        mask        : 0,                // маска для террейна
        // vox      
        vox_make    : false,            //
        vox         : null,
        vox_b       : null,    // 
        // box
        box         : null,             //
        //group       : 0,              // группа для террейна
        type        : '',               // тип объекта
        proj_m      : 0,                // проекция маска
        proj_t      : 0,                // проекция текстура
        //
        link        : '',               // ссылка на таблицу
        link_n      : 0,                // номер ссылки
        //
        n           : 0,                // позиция в списке библиотеки
        o           : null,             // сжатая запись, в редакторе null
    })
    return o
}

const info_prepare = (o,info)=>{
    //
    if (info.uniq && info.uniq===true){
        o.uniq = true
    }
    //
    if (info.squad && info.squad===true){
        o.squad = true
    }
    //
    if (info.gui && info.gui===true){
        o.gui = true
    }
    //
    if (Array.isArray(info.scale)){
        o.scale[0] = parseFloat(info.scale[0])
        o.scale[1] = parseFloat(info.scale[1])
        o.scale[2] = parseFloat(info.scale[2])
    }
    if (Array.isArray(info.rot)){
        o.rot[0] = parseFloat(info.rot[0])
        o.rot[1] = parseFloat(info.rot[1])
        o.rot[2] = parseFloat(info.rot[2])
    }
    if (Array.isArray(info.pos)){
        o.pos[0] = parseFloat(info.pos[0])
        o.pos[1] = parseFloat(info.pos[1])
        o.pos[2] = parseFloat(info.pos[2])
    }
    //
    o.mask    = parseInt(info.mask) || 0
    // vox
    if (info.vox_make && info.vox_make===true){
        o.vox_make = true
    }
    //o.group   = parseInt(info.group) || 0
    o.type    = info.type || ''
    o.link    = info.link || ''
    o.link_n  = parseInt(info.link_n) || 0
    o.proj_m  = parseInt(info.proj_m) || 0
    o.proj_t  = parseInt(info.proj_t) || 0   
}

const asset_prepare = (o)=>{
    for (let i=0;i<o.asset.length;i++){
        const a = o.asset[i]

        // добавляем модель
        if (a.model>=0){
            const model = ASSETS.getModel(a.model)

            if (a.mesh!==''){
                const mesh = model.g.scene.getObjectByName(a.mesh)
                const clone = UTILS.fullClone(mesh)

                if (a.scale){
                    clone.scale.x = parseFloat(a.scale[0])
                    clone.scale.y = parseFloat(a.scale[1])
                    clone.scale.z = parseFloat(a.scale[2])
                }
                if (a.rot){
                    clone.rotation.x = parseFloat(a.rot[0])
                    clone.rotation.y = parseFloat(a.rot[1])
                    clone.rotation.z = parseFloat(a.rot[2])
                }
                if (a.pos){
                    clone.position.x = parseFloat(a.pos[0])
                    clone.position.y = parseFloat(a.pos[1])
                    clone.position.z = parseFloat(a.pos[2])
                }     

                if (a.attach===undefined || a.attach===''){
                    o.mesh.add(clone)
                }else{
                    const node = o.mesh.getObjectByName(a.attach)
                    if (node){
                        node.add(clone)
                    }
                }
            }

            if (a.anim!==''){
                let anim = null
                for (let j=0;j<model.g.animations.length;j++){
                    if (model.g.animations[j].name===a.anim){
                        anim = model.animations[j]
                    }
                }
                if (anim!==null){
                    let name = a.name
                    if (name===''){
                        name = anim.name
                    }
                    o.animations[name] = anim
                }
            }
        }
        
    }
    //
    //if (a.box){
    //    o.box = a.box
    //}
    o.prepared = true
}

const asset_load = (o)=>{
    o.mesh.scale.x = o.scale[0]
    o.mesh.scale.y = o.scale[1]
    o.mesh.scale.z = o.scale[2]

    for (let i=0;i<o.asset.length;i++){
        const a = o.asset[i]        
        //
        if (a.model>=0){
            ASSETS.loadModel(a.model)
            ASSETS.set_assets_flag(INFO.ASSETS_LIBRARY)
        }
    }
}

export const add = (name,info)=>{

    const o = new_obj(name,info.group,info.asset,info.prop)
    //
    o.n = library_a.length
    library_a.push(o)
    //
    info_prepare(o,info)
    //
    asset_load(o)
    //
    //if (o.vox_make){
    //    o.vox = VOX.make(o.mesh)
    //    o.vox_b = Array.from(VOX._b)
    //}
    //
    const info_n = {}
    let n = 2   
    for (let name in o.prop){
        info_n[name] = n
        n = n + 1
    }
    //
    library_n.push(info_n)

    library.set(name,o)

    return o
}

export const remove = (name)=>{
    library.delete(name)
    //const data = export_library(library)
    //prepare(data)
}

export const get_info_block = (o)=>{
    return {
        //name     : o.name,
        //group    : o.group,
        //
        scale    : o.scale,
        rot      : o.rot,
        pos      : o.pos,
        //
        gui      : o.gui,
        uniq     : o.uniq,
        squad    : o.squad,
        //
        mask     : o.mask,
        vox_make : o.vox_make,            //
        type     : o.type,
        proj_m   : o.proj_m,
        proj_t   : o.proj_t,
        //
        link     : o.link,
        link_n   : o.link_n
        //
        //n     : v.n,
        //o     : v.o,
    }
}

export const export_obj = (o)=>{
    return {
        name     : o.name,
        group    : o.group,
        //
        scale    : o.scale,
        rot      : o.rot,
        pos      : o.pos,
        //
        gui      : o.gui,
        uniq     : o.uniq,
        squad    : o.squad,
        //
        mask     : o.mask,
        vox_make : o.vox_make,            //
        type     : o.type,
        proj_m   : o.proj_m,
        proj_t   : o.proj_t,
        //
        link     : o.link,
        link_n   : o.link_n,

        asset    : o.asset,
        prop     : o.prop,
        //
        //n     : v.n,
        //o     : v.o,
    }
}

export const export_library = ()=>{
    const r = {}
    for (let [n,v] of library) {
        r[n] = export_obj(v)
    }
    return r
}

export const loaded = ()=>{
    for (let [n,v] of library) {
        if (!v.prepared){
            asset_prepare(v)
        }
    }
}

export const prepare = (lib)=>{
    library.clear()
    library_a.length = 0
    library_n.length = 0

    for (let name in lib){
        const d = lib[name]
        add( name, d )
    }
    
    console.log(library)
    //VOX.prepare_lib(library)
}
