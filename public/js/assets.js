import { ktx2loader, textureloader, gltfloader, traverse, get_MeshStandardMaterial, get_MeshBasicMaterial, set_callback_flag, call_manager_callback } from '/js/render.js'
import { RepeatWrapping } from '/lib/three.js'

let textures = []
let models = []

let requestCount = 0

export const load_texture = (n,callback)=>{
    const a = textures[n]
    if (!a){
        return
    }
    if (a.t!==null){
        callback(a)
        return
    }
    const u = '/t/'+a.n+'.k'
    if ( a.type===2 ){
        textureloader.load(u,t=>{
            a.t = t
            callback(a)
        },
        progress=>{},
        err=>console.log(err)
        )
    }else{
        ktx2loader.load(u,t=>{
            a.t = t
            callback(a)
        },
        progress=>{},
        err=>console.log(err)
        )
    }
}

export const load_model = (n,callback)=>{
    const a = models[n]
    if (!a){
        return
    }
    if (a.g!==null){
        callback(a)
        return
    }
    
    gltfloader.load('/m/'+a.n+'.g',g=>{
        a.g = g
        callback(a)
    },(xhr)=>{
    },(err)=>{
        alert(err)
    })
}

const set_texture_params = (t)=>{
    t.anisotropy = 4
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
    //
    requestCount = requestCount - 1
    if (requestCount===0){
        call_manager_callback()
    }
}

export const get_texture = (n, cflag = 0)=>{
    const a = textures[n]
    if (a.t===null){
        const u = '/t/'+a.n+'.k'
        if ( a.type===2 ){
            a.t = textureloader.load(u,set_texture_params)
        }else{
            a.t = ktx2loader.load(u,set_texture_params)
        }
        set_callback_flag(cflag)
        requestCount = requestCount + 1
    }
    return a.t
}

export const prepare_material = (materials,obj)=>{
    const material = materials[obj.name]
    if (material===undefined){
        return
    }
    let m = null
    switch(material.type){
        case 'MeshStandardMaterial':{ // MeshStandardMaterial
            m = get_MeshStandardMaterial()

            m.map          = get_texture(material.defuse)
            m.normalMap    = get_texture(material.normals)
            m.aoMap        = get_texture(material.arm)
            m.roughnessMap = m.aoMap
            m.metalnessMap = m.aoMap
        }
        break;
        default:{    // MeshBasicMaterial
            m = get_MeshBasicMaterial()

            m.map = get_texture(material.defuse)
        }
    }
    obj.material = m
}

const prepare_materials = (model)=>{
    traverse(model.g.scene, obj => prepare_material(model.m,obj) )    
}

export const get_model = (n,callback)=>{
    const model = models[n]
    if (model===undefined){
        return
    }
    if (model.g!==null){
        prepare_materials(model)
        callback(model)
    }else{
        gltfloader.load('/m/'+model.n+'.g',g=>{
            model.g = g
            prepare_materials(model)
            callback(model)
        },xhr=>{
        },err=>{
            console.log(err)
        })
    }
}

export const prepare = (_textures,_models)=>{
    textures = _textures
    models = _models
}